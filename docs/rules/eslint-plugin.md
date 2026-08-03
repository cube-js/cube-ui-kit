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
| `skip: 'context'` | Redundant bare, load-bearing under a provider (`ItemAction` `theme` inside `ItemActionProvider`). |
| `skip: 'reflected-attribute'` | Rendered onto the DOM as `data-*`/`aria-*`, so omitting it drops the attribute. `Item` renders `aria-selected={isSelected}`, so `isSelected={false}` is **not** removable. |
| `skip: 'state-map'` | The default is a tasty state map, not a scalar; passing the default-state value replaces the whole map. |
| `skip: 'unverified'` | The documented default could not be reproduced — usually docs drift. Needs a human. |

Exclusions are recorded rather than omitted, so a newly documented prop fails the guard until someone triages it.

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

## Two traps worth knowing

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
