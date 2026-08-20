# ESLint plugin — `no-redundant-default-prop`

The package ships a lint plugin at `@cube-dev/ui-kit/eslint-plugin` that flags props explicitly set to the value the component already defaults to (`<Button type="outline">`, `<Select size="medium">`), with an autofix.

## Consumer setup

```js
// eslint.config.js
import uiKit from '@cube-dev/ui-kit/eslint-plugin';

export default [...uiKit.configs.recommended];
```

`recommended` targets `.js/.mjs/.cjs/.jsx/.ts/.mts/.cts/.tsx` explicitly, because ESLint's flat-config default covers only `.js/.mjs/.cjs` — without that the rule would silently never run in the JSX files that matter. Linting `.tsx` still needs a TypeScript parser, as usual:

```js
import tseslint from 'typescript-eslint';

export default [
  { files: ['**/*.tsx'], languageOptions: { parser: tseslint.parser } },
  ...uiKit.configs.recommended,
];
```

The rule itself is plain-AST and never needs type information, which is also what keeps it loadable by Oxlint's JS plugin bridge.

The rule only reports components it can prove were imported from `@cube-dev/ui-kit`. To lint components re-exported through an internal barrel:

```js
{ rules: { 'cube-ui-kit/no-redundant-default-prop': ['warn', { packages: ['~/components/ui'] }] } }
```

Stories and `.docs.mdx` are set to `warn`, not `off`. They are the code people copy, so redundant props there travel outward — but a deliberate side-by-side contrast has a real reason to name the default, and failing a build over it would be wrong. Silence those individual sites with a disable comment.

## Linting this repository with its own rule

`pnpm lint` runs the rule against ui-kit's own source, including stories. Two pieces make that work.

First, provenance. In this repo components are imported by path (`../../layout/Space`, `./Button`, `..`), never by package name, so the `packages` check matches nothing and the rule would silently do nothing. The `relativeImports` option adds relative specifiers as an accepted source:

```jsonc
// .oxlintrc.json
"cube-ui-kit/no-redundant-default-prop": ["error", { "relativeImports": true }]
```

Never enable it in a consumer project: there, a relative import *is* the consumer's own component, and trusting it would rewrite props on code this registry knows nothing about. Shadowing is still safe either way — resolution requires an `ImportBinding`, so a local `const Badge = tasty({})` is never matched.

Second, loading. Oxlint's `jsPlugins` takes `./scripts/oxlint-cube-ui-kit-plugin.mjs`, a jiti shim that imports `src/eslint-plugin/index.ts` directly. That keeps linting honest against the source rather than a possibly stale `dist/`, and needs no build step in front of `pnpm lint`. Oxlint's own loader cannot read the TS source directly — it is a bare `await import()`, which will not resolve the extensionless relative imports the source uses.

Two exclusions are deliberate, both in `.oxlintrc.json`:

- `eslint-plugin/fixtures.tsx` — generator input for the prover. Autofixing it would rewrite the inputs that establish the registry.
- `*.test.ts(x)` — a test that pins an expected value should keep stating it. The removals are render-equivalent, but stripping `cols={12}` makes the test assert whatever the default happens to be, so a later change to that default passes instead of failing.

Suppress a deliberate case at the site. Inside a JSX opening tag use a line comment; in children position only a JSX comment parses:

```jsx
{/* oxlint-disable-next-line cube-ui-kit/no-redundant-default-prop -- Sizes story names every size */}
<Badge size="inline">8</Badge>
```

Note that `.lintstagedrc` runs `oxlint --fix` on commit, so an unsuppressed redundant prop is stripped automatically by the next commit that touches its file.

## When you change a default

Run `pnpm audit-defaults`, then commit the regenerated `src/eslint-plugin/defaults.generated.ts`. `pnpm test` fails until it matches, naming the exact prop — this is what keeps the list in sync.

Never edit `defaults.generated.ts` by hand. To change *how* a prop is classified, edit its fixture in `src/eslint-plugin/fixtures.tsx` and regenerate.

## How the registry is produced

Defaults here cannot be derived statically. They are established by destructuring, `??` chains, JSX-site fallbacks (`Button`'s real `type` default of `outline` exists only at the JSX site), `tasty()` factory options, React context, alias maps, and tasty style objects — and TypeScript encodes none of their *values*.

So the prover does not read defaults from source. It **renders each component twice**, once with the prop and once without, and compares markup plus tasty CSS (`getCssTextForNode`). If passing the prop changes nothing observable, it is redundant. That works regardless of how the default was produced.

Each prop lands in one of these states:

| State | Meaning |
|---|---|
| `default` | Proven redundant. **The only state the rule acts on.** |
| `skip: 'conditional'` | Redundant bare, load-bearing under a co-prop (`Button` `size` depends on `type="link"`). |
| `skip: 'context'` | Redundant bare, load-bearing under a provider (`ItemAction` `isDisabled` inside `ItemActionProvider`). |
| `skip: 'reflected-attribute'` | Rendered onto the DOM as `data-*`/`aria-*`, so omitting it drops the attribute. `Item` renders `aria-selected={isSelected}`, so `isSelected={false}` is **not** removable. |
| `skip: 'state-map'` | The default is a tasty state map, not a scalar; passing the default-state value replaces the whole map. |
| `skip: 'unverified'` | The documented default could not be reproduced — usually docs drift. Needs a human. |

Exclusions are recorded rather than omitted, so a newly documented prop fails the guard until someone triages it.

## Compound aliases

ui-kit hangs compound aliases off its components, and the dotted form is usually the idiomatic one — every example in `RadioGroup.docs.mdx` writes `<Radio.Group>`, never `<RadioGroup>`. The rule resolves a JSX tag to its dotted path, so a registry keyed only on `RadioGroup` would never fire on the way the component is actually written.

So the registry carries a second map, `aliases`, from alias path to canonical key:

```ts
aliases: {
  'Radio.Group': 'RadioGroup',
  'Button.Split': 'ButtonSplit',
  'Item.Action': 'ItemAction',
  Input: 'TextInput',   // `Object.assign` mutates and returns `TextInput`
  // …
}
```

It is generated by `findAliases` in `generate.ts`, which walks the package exports and records every path — `X`, `X.Y` — whose value **is the same object** as a fixture's component. Fixtures name one export each; the rest is derived, so adding a fixture needs no alias bookkeeping.

Identity, not name shape, is the whole safety argument, and the `Radio` namespace is why:

| Path | Is | Alias? |
|---|---|---|
| `Radio.Group` | `RadioGroup` itself | yes — cannot behave differently |
| `Radio.ButtonGroup` | `tasty(RadioGroup, { type: 'button' })` | **no** — different effective `type` default |
| `Radio.Tabs` | `tasty(RadioGroup, { type: 'tabs' })` | **no** — same reason |
| `Radio.Button` | `Radio` itself, which has no fixture | not applicable |

A rule that normalised `Radio.Group` to `RadioGroup` by concatenating the path would hand `Radio.ButtonGroup` RadioGroup's entry and offer to strip a `type` that is not its default. Identity cannot make that mistake, and `defaults.test.ts` re-checks each alias against the live exports so a refactor that turns an alias into a wrapper fails instead of shipping a wrong entry.

Note this is unrelated to `VerifiedDefault.aliases`, which lists alternate spellings of a prop *value* (`Dialog` maps `M` onto `medium`) and stays hand-curated — see below.

## Adding a fixture

Coverage is partial because each component needs a hand-written render fixture. Add one to `FIXTURES` in `fixtures.tsx`:

```tsx
{
  name: 'Tag',                                   // the name exported from ui-kit
  render: (props) => <Tag {...props}>Tag</Tag>,  // minimal renderable form
  conditions: [insideHorizontalForm],            // where a default might shift
  ignoreProps: ['label'],                        // props the fixture sets itself
  curatedSkips: { isSelected: ARIA_SELECTED_SKIP },  // triaged exclusions
  curatedAliases: { size: ['medium'] },          // other spellings of the default
}
```

Then bump `COVERED` in `defaults.test.ts` and run `pnpm audit-defaults`.

A fixture must render the component for real — required props, collection children, `defaultOpen` for portalled overlays. Some components throw without exactly the right children (`DialogTrigger`, `MenuTrigger` and `TooltipTrigger` require exactly two; `DisplayTransition` requires a function child). Every fixture is rendered inside `<Root>`, which is what satisfies `useEventBus` for the popover-based components.

## Excluding one prop on one component

Every exclusion is scoped to a component *and* a prop: `curatedSkips` and `ignoreProps` are keyed by prop name on a single fixture, and the registry is `component -> prop -> entry` throughout. Excluding a prop name globally is deliberately not possible — `isDisabled` is a genuine plain default on `ButtonSplit`, `Disclosure`, `InlineInput`, `Portal` and `Tree`, and an inherited override only on `ItemAction`. A name-level exclusion would silence the former to protect the latter.

Which of the three to reach for:

| Situation | Use |
|---|---|
| The prop is load-bearing under a provider, or under a co-prop of the same component | `conditions` |
| The probe reports a difference and only a person can say what it means | `curatedSkips`, with a reason and a note |
| The fixture sets the prop itself, so it cannot be probed at all | `ignoreProps` |

Prefer `conditions` whenever the difference is reproducible in a render. A `curatedSkips` entry short-circuits `classifyProp` (`generate.ts`) and is never probed again, so it keeps asserting its reason after the component stops behaving that way; a condition is re-proved by the sync guard on every `pnpm test`, and flips back to a plain default the moment it stops holding. Use `curatedSkips` when there is nothing to reproduce.

There is no consumer-side override, by design. A product hitting a one-off uses a disable comment at the site; anything systemic is a registry bug and belongs in a fixture here, where it ships to every consumer at once.

## Three traps worth knowing

**A prop whose default comes from context needs a condition, or it is misfiled as a plain default.** When a component resolves a prop as `prop ?? context ?? literal`, probing it bare hits the literal and the prop looks redundant — while in a real tree it is what stops the inherited value from applying. Stripping it is then a behaviour change, not a cleanup. Three cases were caught this way:

- `ItemAction` reads `isDisabled` off `ItemActionContext`. `<Item isDisabled>` renders its `actions` inside that provider, so `<ItemAction isDisabled={false}>` is the documented way to keep one action live inside a disabled item. (It used to read `type` and `theme` from there too; both are plain defaults now that the `current` theme tracks the host through `currentcolor` instead.)
- `ItemBadge` read `type` and `theme` the same way and had no conditions at all.
- `Dialog` resolves `isDismissable = contextProps.isDismissable` with no literal fallback, and `DialogContainer`/`DialogTrigger` default that context value to `true`, so a nested `<Dialog isDismissable={false}>` is an override.

Only the props with a matching condition were classified correctly at first. When you add a fixture, check what the component reads from context and add a condition supplying a *different* value for each such prop — the prover can only see what a condition lets it see. Grep for `= context` and `?? context` in the component to find them.

**A fixture that renders nothing is worse than a missing one.** Every prop would look like a no-op and be recorded as a verified default, and the rule would then delete real props. `fixtures.test.tsx` compares each fixture against an empty tree to catch that.

**"Renders the same" is not "is the same," and this is why aliases are never inferred.** Deriving aliases by probing a prop's other documented values was tried and removed, because rendering cannot establish equivalence:

- A prop that is inert in the fixture makes every value look equivalent. `Item`'s `level` does nothing without a heading, so `level={1}` matched `level={3}`.
- Worse, and unfixable by any DOM comparison: values that differ only in *behaviour*. `InlineInput`'s `editTrigger` wires a click handler versus a dblclick handler and renders byte-identical markup, so `click` was reported as an alias of the `dblclick` default — an autofix would have silently changed how the component activates.

Guarding on "some other value must differ" catches the first but not the second, since `editTrigger="none"` genuinely does change the DOM. So `aliases` is hand-curated via `curatedAliases`, and only for values a component demonstrably normalises onto the default (`Dialog` maps `M` onto `medium` through a lookup table).

## Components excluded from the registry

Not every component can be probed. These are excluded deliberately:

| Component | Why |
|---|---|
| `CollectionItem` | It is react-stately's `Item`; its render function returns `null`. |
| `SubMenuTrigger` | Public component returns `null`; it only works as a collection node inside `Menu`. |

A component with no fixture is simply absent from the registry, so the rule ignores it. The coverage ratchet in `defaults.test.ts` records how many are covered.
