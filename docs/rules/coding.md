# Development flow rules

- Don't respond with "You're right!", "Great idea!" and so on. Get straight to the point.
- **Stop and describe the reason**, if you can't closely implement the task, or need a different approach from what was asked, or noticed a critical mistake in the prompt.
- Do not run tests if you only changed stories or documentation since the last test run.
- Follow the [Entropy rule](entropy.md) during implementation: justify added complexity and prefer safe, task-relevant simplification. Record scoped developer exceptions rather than silently waiving the rule.
- If you need to move or rename a file: use command line tools for that.
- If you need to move a part of code from one file to another: First, write the code at the new place, then delete the code in the original place.
- Don't add new backward-compatibility layers unless asked. Preserve existing documented public contracts, including the frozen legacy Form behavior.

# Coding rules

- Use named imports from react (like `useState`) instead of using the `React` instance. Avoid: `React.useState`.
- Follow [React Compiler and callback rules](react-compiler.md): plain handlers and derived values by default; local Effect Events for effect-owned notifications; `useEvent` only for verified retention contracts. Keep resource dependencies reactive, manual memo dependencies complete, and per-mount lifetime in state/ref ownership. Run both diagnostics ratchets after runtime edits.

# Imports

**Inside `src/`, import the file that defines the thing, not the barrel that re-exports it.** `import { ItemButton } from '../../actions'` and `import { ItemButton } from '../../actions/ItemButton/ItemButton'` compile to the same component, but the first one also puts `Menu`, `CommandMenu`, `ButtonSplit`, `Banner` and everything _they_ import into the importer's dependency graph. Barrels are the public API for consumers; within the library they are a way to accidentally depend on everything.

This is not a style preference — three things read that graph:

- **Chromatic.** TurboSnap reruns only the stories that depend on the files a PR changed, and everything reachable from `.storybook/preview.jsx` (which wraps every story in `<Root>`) is exempt from that scoping and forces a full rebuild of the whole suite. One barrel import inside `Root`'s dependency tree used to put 55% of the library in that set. `pnpm chromatic:check` fails if it grows back past its budget — see [storybook.md](storybook.md#keep-imports-out-of-the-root-decorators-tree).
- **Consumers' bundlers.** A narrower graph is a tree-shakeable one.
- **Module init order.** `Root.tsx` calls tasty's `configure()` at module scope; the wider the graph, the more ways there are for something to evaluate before it.

Lint enforces it. `repo/no-barrel-import` (`scripts/oxlint-repo-rules.mjs`) resolves every relative import in `src/` and `.storybook/`, and reports one that lands on an `index.ts`:

- **Runtime code never imports a barrel.** That covers the package root, category barrels (`../../actions`, `../../form`), which pull in a whole family, component entries (`../Dialog`), which are cheap on their own but chain, and support barrels (`../../utils/react`, `../../i18n`). Import the file: `from '../../actions/ItemButton/ItemButton'`.
- **Type-only imports are exempt.** `import type { CubeFormProps } from '../Form'` is erased at build time and adds nothing to the graph. A plain `import { SomeType }` is not exempt, because lint cannot see that it imports only types: write `import type`.
- **A story may import a component's own entry** for its compound API: `import { Button } from '../../actions/Button'` gives it `Button.Group`. Never a category barrel or the package root. Everything else comes from the defining file, as in runtime code. A story that shows a barrel's whole contents, as `icons/Icons.stories.tsx` does with `import * as Icons`, disables the rule on that line with a reason.
- **`index.ts` files may import barrels.** Assembling the public surface is what they are for. Specs, their `*.fixture.tsx` files, `src/test/` and the defaults-registry tooling in `src/eslint-plugin/` are exempt too: they exercise the surface the way a consumer imports it.
- **Icons** also have their own `no-restricted-imports` entry, which applies to specs as well: the icon barrel re-exports 133 components.

An `index.ts` only re-exports. A component's entry may also assemble the compound it exports, such as `Object.assign(Button, { Group, Split })` in `actions/Button/index.ts`, when the parts import the base, so assembling it in the base's own file would be a cycle. Anything else (a component, a hook, a helper, a type) goes in a named file, where runtime code can import it. Some older index files still define code: `Toast` in `overlays/Toast/index.ts`, `addUIKitLocale` in `i18n/index.ts`, the `Axis`, `PlacementAxis` and `RangeValue` types in `shared/index.ts`, and `Typography` in the package root. Runtime code can take those types with `import type`, but not the values: move one into a named file before runtime code needs it.

**No import cycles.** `import/no-cycle` reports one in `src/` and `.storybook/`. Break it by moving what both sides use into a file of its own: `Form/FormContext.tsx` and `Form/FormElement.tsx` hold what `Form.tsx` and `ModernFormRoot.tsx` both render. A cycle made only of types goes away with `import type`. Two components that render each other, and touch each other only inside render, may keep their cycle with a `-- reason`, as `ColorPicker` and `ColorSwatchGroup` do.

When you do need to widen something inside `Root`'s tree, `node scripts/chromatic-report.mjs --trace <file>` shows what it costs before you commit to it.

# Styling: keep components customizable

A consumer customizes an element by passing `styles` (or style props) to it, and every styling fix must leave that working. The trap is a parent fixing a child's layout from outside, with any of these:

- a sub-element selector aimed at an element the parent does not render, such as `$: '> form'` or `$: '> form > :not(:last-child)'`;
- a blanket reset on another component's children, such as `margin: 0` on every child;
- a selector built to outrank another component's rule, using an extra type selector, a doubled class or `!important`.

Such a rule only works by beating the child's own styles, so it also beats the consumer's `styles` on that element, and their padding, gap or layout override silently stops applying. Fix the element in the component that owns it:

- **The child owns its context, as a named state.** When a component must lay out differently inside another, declare a local state at the top of its own `styles` and use that name in the maps:
  ```ts
  '@in-dialog': '@parent(id=Dialog, >)', // `, >` = direct parent; drop it for any ancestor
  display: { '': 'block', '@in-dialog': 'flex' },
  ```
  The rule keeps the child's own specificity and a consumer's `styles` key replaces it. Because the state travels with the styles, a consumer can also target the same case: `gap: { '': '3x', '@in-dialog': '1x' }`. Worked example: `FormElement` in `FormElement.tsx`. It replaced two `Dialog` rules that silently beat a form's own `display` and `gap` styles.
- **Never build state keys in JS.** No `const IN_DIALOG = '@parent(…)'` spread as `[IN_DIALOG]: …`. The condition then lives outside the styles, a consumer can't name it, and every map carries the raw selector instead of a word. If several components need a state, register it with the global predefined states in `Root.tsx` (`setGlobalPredefinedStates`) rather than exporting a string.
- **A parent passes values only through channels built for overriding.** Those channels are slot styles (a `SlotProvider` merges them under the consumer's own `styles`), custom properties the child reads (`$dialog-padding-h`), props and mods.
- **Know what tasty's `gap` compiles to.** On `display: flex` or `grid` it becomes the CSS `gap` property. On `display: block` it becomes a bottom margin on every child but the last. Those margins land on whatever goes inside the container, and a `gap: 0` from outside never reaches them. So when a block container's spacing is wrong in some context, change the container's own `gap` for that context; don't reset its children. `Form` stays a block outside dialogs because a flex column would stretch a bare `Button` child to full width and stack inline content.
- **Check before adding a rule.** Ask whether a consumer can still override it with ordinary `styles` on the element it affects. If their styles would lose, the rule is a hack: move the fix to the component that owns the element, and add a browser test that a consumer override still applies.

**Never start a `:has()` with `~`** (`:has(~ X)`). jsdom before 27 matches selectors with nwsapi, which throws on it for any element without a parent. jsdom's `getComputedStyle` walks up to `<html>`, so once such a rule is on the page, every role query, `toBeVisible` and user-event click in a consumer's tests throws. Cube Cloud runs jsdom 26. This repo runs 29, so its tests never show it. Use `:last-child`, `:first-child` or a mod. 0.187.0 shipped one on ListBox options; `ListBox.test.tsx` guards them.

# Inline style

React's `style` prop bypasses Tasty: no tokens, units or states, and nothing a consumer's `styles` can override. `.oxlintrc.json` makes it an error on every element, through `tasty/no-style-prop` with `elements: 'all'`: Tasty elements, other components and native elements, in runtime code and stories alike. In specs it covers only Tasty elements, because specs set inline styles on native elements and components to stage layouts and to check that a consumer's `style` reaches the DOM.

Use the Tasty channel that fits the value:

- **A value that changes at runtime** (a measured width, a drag position, a picked color): declare `$name` or `#name` in the element's styles and pass the value through `tokens`, for example ``tokens={{ '$panel-size': `${size}px` }}``. It renders as the same inline custom property, without a new style rule per value. A bare number renders unitless (`'$x': 12` gives `--x: 12`), so add the unit yourself. Custom properties inherit, so name the token after its element (`$slider-value-width`, not `$label-width`): when you set none, an ancestor's token of the same name fills it. A number a library computes, such as a virtualizer's row offset or total height, is such a value too.
- **A fixed value**: put it in the element's `styles`, or in a style prop such as `width="25x"`.
- **A value that depends on state**: a mod and a state map, not a conditional style object.

Keep `style` only when something outside our styles owns the value, and say so on the line before it:

```tsx
// oxlint-disable-next-line tasty/no-style-prop -- React Aria's overlay positioning computes these coordinates
style={positionProps.style}
```

The accepted reasons are:

- a library supplies the style object: React Aria's positioning or date segment style, prism-react-renderer's theme;
- the component forwards its own public `style` prop;
- the value sits on a native element with no Tasty element to carry a token, such as a table row or cell that `TableElement` styles through sub-element selectors, even when a virtualizer computes it;
- our styles cannot express the value or cannot win the cascade for it, such as a `preset` that owns `font-family`, or React Aria's popover size cap, which applies only once React Aria has measured and otherwise leaves the max size the merged styles give; name the cause, and for a Tasty limitation its issue and the condition for removing the exception.

The lint sees only a `style` JSX attribute. A `style` key in an object that reaches an element (`mergeProps(props, { style })`, a context value, a props object) gets past it, so hold those to the same rule in review, with the reason in a comment.

Every disable directive needs a ` -- reason`, not only these ones. The repo-local `repo/require-disable-reason` rule (`scripts/oxlint-repo-rules.mjs`) fails a directive without one. A directive that names no rule, such as a file-wide `/* eslint-disable */`, switches that rule off too, so review has to check its reason.

# Tasty lint rules

`pnpm lint` runs Oxlint without `--deny-warnings`, so a rule at `warn` never fails CI: it is advisory. Every `@tenphi/eslint-plugin-tasty` rule UI Kit enforces is an `error` in `.oxlintrc.json`. `consistent-token-usage` is an `error` in runtime code and stays `warn` in stories and specs, which size their demos and fixtures in plain pixels. Add a new rule as `error` once it has no hits, or leave it off.

An exception takes the same form as for inline style: `// oxlint-disable-next-line tasty/<rule> -- <reason>` on the line before (the older `eslint-disable-next-line` spelling works the same). The reasons accepted there, such as a library owning the value or a component forwarding its public prop, hold here too. Keep it to the line: a file-wide disable also waves through every later violation in that file.

`no-style-spread` reports an object spread. Compose shared style objects with `mergeStyles(base, ...overrides)` instead: the plugin lints each of its object arguments, the first as a full base and later ones as partial overrides. `mergeStyles` merges sub-elements too, and an override state map that restates `''` replaces the base's map, while one without `''` extends it: a state it shares with the base replaces that entry in place, and a new state is added at the end. That covers splicing shared states into a map: `mergeStyles(theme, VALIDATION_STYLES)` appends the validation states to `theme`'s `border`. A spread that stays (the rule reports only the first of several at an object's top level, and each one in a nested map) is an exception whose reason names what it shares and why `mergeStyles` doesn't fit.

Pixel values take a unit or a token chosen by what the value means, not by what it equals. `bw` is a border width: use it for a border, or for a size that compensates for one (`(1.5x - 1bw)`), never for a `1px` that only happens to match, because a consumer who changes `--border-width` changes borders, not every pixel. `x` is for spacing and sizes on the grid. Three kit tokens name the shared device-pixel values: `$ring-width` for a hairline focus or selection ring (an outline, or a ring drawn with `shadow`; a field's thick focus ring is `ow`), `$outline-offset` for a ring's gap from its element, and `$item-gap` for the hairline between adjacent items in a list, menu or action group. A divider line drawn in `#border` is a border, so it stays `bw`. Geometry that has to stay in device pixels, such as a resize handle's grip, a tooltip arrow or a marker line, names its size once as a local custom property (`'$grip-size': '3px'`) and derives the rest from it. The rule doesn't check `$name` and `#name` definitions (it does check `--name` ones), so a comment on the definition says why the value stays in pixels. Other raw pixels are an exception with a reason.

`no-runtime-styles-mutation` is an `error` in runtime code and stays `warn` in stories and specs, which build demo styles from data. It reports a value from render in a style object that reaches Tasty: one written in place in `styles` or an argument of `mergeStyles` or `mergeStyleLayers`, one behind a conditional or logical operator (`cond ? { … } : null`), and one held in a render-scope variable (declared with `const` or reassigned) that is then read as styles. Move a dynamic custom property to `tokens` (`tokens={{ '$grid-width': width }}`), a dynamic state to `mods` with a state map, or a choice between a few fixed shapes to module-level constants (`styles={isDisabled ? DISABLED_STYLES : STYLES}`). A component that forwards its consumer's public `styles`, style props or a style-valued prop (`innerStyles`, `size`, `contentPadding`) during render is an exception whose reason names those props. Extract style props with `extractStyles` rather than a loop of spreads. When a consumer's styles are merged over other styles and passed on as an element's `styles`, use `mergeStyleLayers` (`src/utils/styles.ts`): plain `mergeStyles` deletes a `null` in any argument after the first, so the consumer's reset never reaches that element. With the consumer's object first, `mergeStyles` keeps its resets. `.oxlintrc.json` lists `mergeStyleLayers` in `settings.tasty.mergeFunctions`, so the Tasty rules check its arguments like those of `mergeStyles`.

Transitions and animations take their duration from a token. Leave the duration out to get the transition's own default (`$<name>-transition`, falling back to `$transition`), or name a duration token from `src/tokens/base.ts` (listed in the Usage docs). Derive a dependent timing from its token, such as `(2 * $overlay-transition)`, rather than hardcoding the result. A keyframe loop's length, or a one-off timing that no token's role covers, is an exception with its reason.

Off on purpose: `no-styles-prop` (UI Kit's own components pass `styles` down, and it is public API), `prefer-shorthand-property` (single-side overrides are deliberate) and `no-protected-restyle`.

`no-protected-restyle` is for consumers. `protectedComponents` in `tasty.config.ts`, which consumers inherit through `extends`, lists the components a consumer customizes through their props rather than by restyling them. Our own source imports components by relative path, which never matches the list's `source`. When you add a component, decide its side of the list: a layout or typography primitive, an icon, or a base meant for extension joins the last entry's `exclude`; a container whose content layout is its consumer's call joins one of the three containers' entries, by what it draws: a surface of its own (a fill, a border, a radius or a theme), a border only (`Layout`'s sections), or neither (a frame such as `Panel`, which also keeps `fill` and `border`); anything else is protected by default. A sub-component (`Layout.Content`) counts as its export unless an entry names its member path, so put a sub-component that belongs on the other side into that side's list by its member path, as the last entry's `exclude` does for `Button.Group`. Without `typeAwareJSX`, the rule reads a prop named like a Tasty style (`direction`, `filter`, `color`, `content`) as one, so a component that declares such a prop of its own needs an entry that allows that name. Update the lists in the Usage docs (Customizing components) with the config: they describe the contract to consumers. `src/tokens/tasty-config.test.ts` lints a consumer project that extends the config.

The same config tells consumers' lint which names exist. Its `tokens`, `states`, `presets` and `recipes` come from `tasty.config.generated.ts`, which `pnpm generate:tasty-config` writes from the runtime: the tokens `getTokens()` emits, the state aliases and recipes `<Root>` registers, and `TYPOGRAPHY_PRESETS`. When you add, rename or remove one of them, run it and commit the file; `src/tokens/tasty-config.test.ts` fails until you do. Never edit the generated file by hand: on a merge conflict in it, take either side and run the command again.

A component token that one file sets and another reads is not in those lists, and `valid-custom-property` reports it until it is declared where the plugin sees it. The plugin merges the `tasty.config.*` files on the path from a linted file up to its project root, and a consumer's `extends` reads only the package root's config, so there are two places:

- **Offered to consumers** (to read inside the component, or to set on it): document it in the component's `.docs.mdx` and add it to `componentTokens` in `tasty.config.ts`. It is part of that component's API, and consumers' lint accepts it.
- **Internal**: add it to `src/tasty.config.ts`. Only files under `src/` get it, so a consumer that reads the token is told it isn't theirs.

`pnpm check:component-tokens`, in CI's lint job, fails when a published component token is in no component's `.docs.mdx`. `src/tokens/tasty-config.test.ts` fails when a listed token is set by no component (one an app may set counts when UI Kit reads it with a fallback, `($name, 0px)`), or is listed twice: in both lists, or already in the generated ones. A token set and read in the same file needs no list: declare it as a `$name` / `#name` key in a styles object, or in a `tokens` literal.

# Markdown rules

- **Never hard-wrap prose.** One paragraph is one line, in every `.md` and `.mdx` file — documentation, `AGENTS.md`, specs and changesets alike. No wrapping at 80 or 100 columns, no manual line breaks inside a sentence.
- Hard-wrapped prose is what makes these files awkward to edit and to review: a one-word change reflows the paragraph, so the diff reads as a full rewrite and every editor disagrees about where the breaks belong.
- Prettier enforces it (`proseWrap: 'never'` in `.prettierrc.cjs`, `*.{md,mdx}` in `.lintstagedrc`). `pnpm fix` unwraps anything that slipped through.

# Knowledge rules

- If you find any essential knowledge that is not yet listed anywhere, then add it to AGENTS.md file in the nearest folder this knowledge applies to. Create file if it's not yet exist. Make sure this essential knowledge is as compact as possible.
