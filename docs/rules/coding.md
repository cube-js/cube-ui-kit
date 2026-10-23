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

Concretely:

- **Icons: always the file.** `import { CloseIcon } from '../../icons/CloseIcon'`. `no-restricted-imports` in `.oxlintrc.json` enforces this — the barrel re-exports 133 components, so it is the single worst offender. `src/index.ts` is exempt, because re-exporting that barrel is its job.
- **Category barrels** (`../../actions`, `../../form`, `../../content`, …) pull in a whole family. Reach past them, especially anywhere `Root` can reach.
- **Component barrels** (`../Dialog`, `../HotKeys`) are cheap on their own but chain: `../Dialog` pulls `DialogForm`, which used to pull the `actions` _and_ `form` barrels. Prefer the file.
- **`index.ts` files may import barrels** — assembling the public surface is what they are for.

When you do need to widen something inside `Root`'s tree, `node scripts/chromatic-report.mjs --trace <file>` shows what it costs before you commit to it.

# Inline style

React's `style` prop bypasses Tasty: no tokens, units or states, and nothing a consumer's `styles` can override. `.oxlintrc.json` makes it an error on every element, through `react/forbid-component-props` and `react/forbid-dom-props`, in runtime code and stories alike. Specs are exempt, because they set inline styles to stage layouts and to check that a consumer's `style` reaches the DOM.

Use the Tasty channel that fits the value:

- **A value that changes at runtime** (a measured width, a drag position, a picked color): declare `$name` or `#name` in the element's styles and pass the value through `tokens`, for example ``tokens={{ '$panel-size': `${size}px` }}``. It renders as the same inline custom property, without a new style rule per value. A bare number renders unitless (`'$x': 12` gives `--x: 12`), so add the unit yourself.
- **A fixed value**: put it in the element's `styles`, or in a style prop such as `width="25x"`.
- **A value that depends on state**: a mod and a state map, not a conditional style object.

Keep `style` only when something outside our styles owns the value, and say so on the line before it:

```tsx
// oxlint-disable-next-line react/forbid-component-props -- React Aria's overlay positioning computes these coordinates
style={positionProps.style}
```

The accepted reasons are:

- a library computes the value: React Aria positioning, a virtualizer, prism-react-renderer;
- the component forwards its own public `style` prop;
- the value sits on a native element with no Tasty element to carry a token, such as a table cell that `TableElement` styles through sub-element selectors;
- our styles cannot express the value or cannot win the cascade for it, such as a `preset` that owns `font-family`; name the cause, and for a Tasty limitation its issue and the condition for removing the exception.

The lint sees only a `style` JSX attribute. A `style` key in an object that reaches an element (`mergeProps(props, { style })`, a context value, a props object) gets past it, so hold those to the same rule in review, with the reason in a comment.

Every disable directive needs a ` -- reason`, not only these ones. The repo-local `repo/require-disable-reason` rule (`scripts/oxlint-repo-rules.mjs`) fails a directive without one. A directive that names no rule, such as a file-wide `/* eslint-disable */`, switches that rule off too, so review has to check its reason.

`tasty/no-style-prop` stays off. Since 1.8.2 it also recognizes Tasty components imported from relative modules, but it still covers only Tasty components, while the React rules cover every element, native and third-party ones included. Enabling both would need two directives on every exception.

# Tasty lint rules

`pnpm lint` runs Oxlint without `--deny-warnings`, so a rule at `warn` never fails CI: it is advisory. Every `@tenphi/eslint-plugin-tasty` rule UI Kit enforces is an `error` in `.oxlintrc.json`. `consistent-token-usage` is an `error` in runtime code and stays `warn` in stories and specs, which size their demos and fixtures in plain pixels. Add a new rule as `error` once it has no hits, or leave it off.

An exception takes the same form as for inline style: `// oxlint-disable-next-line tasty/<rule> -- <reason>` on the line before (the older `eslint-disable-next-line` spelling works the same). The reasons accepted there, such as a library owning the value or a component forwarding its public prop, hold here too. Keep it to the line: a file-wide disable also waves through every later violation in that file.

`no-style-spread` reports an object spread. Compose shared style objects with `mergeStyles(base, ...overrides)` instead: the plugin lints each of its object arguments, the first as a full base and later ones as partial overrides. `mergeStyles` merges sub-elements too, and an override state map that restates `''` replaces the base's map, while one without `''` extends it: a state it shares with the base replaces that entry in place, and a new state is added at the end. That covers splicing shared states into a map: `mergeStyles(theme, VALIDATION_STYLES)` appends the validation states to `theme`'s `border`. A spread that stays (the rule reports only the first of several at an object's top level, and each one in a nested map) is an exception whose reason names what it shares and why `mergeStyles` doesn't fit.

Pixel values take a unit or a token chosen by what the value means, not by what it equals. `bw` is a border width: use it for a border, or for a size that compensates for one (`(1.5x - 1bw)`), never for a `1px` that only happens to match, because a consumer who changes `--border-width` changes borders, not every pixel. `x` is for spacing and sizes on the grid. Three kit tokens name the shared device-pixel values: `$ring-width` for a hairline focus or selection ring (an outline, or a ring drawn with `shadow`; a field's thick focus ring is `ow`), `$outline-offset` for a ring's gap from its element, and `$item-gap` for the hairline between adjacent items in a list, menu or action group. A divider line drawn in `#border` is a border, so it stays `bw`. Geometry that has to stay in device pixels, such as a resize handle's grip, a tooltip arrow or a marker line, names its size once as a local custom property (`'$grip-size': '3px'`) and derives the rest from it. The rule doesn't check `$name` and `#name` definitions (it does check `--name` ones), so a comment on the definition says why the value stays in pixels. Other raw pixels are an exception with a reason.

`no-runtime-styles-mutation` is an `error` in runtime code and stays `warn` in stories and specs, which build demo styles from data. It reports a value from render in a `styles` object literal, including one passed to `mergeStyles`. It misses a style object held in a variable built during render (declared with `const` or reassigned) and an object inside a conditional `mergeStyles` argument (tenphi/eslint-plugin-tasty#111), so apply the same fixes there by hand. Move a dynamic custom property to `tokens` (`tokens={{ '$grid-width': width }}`), a dynamic state to `mods` with a state map, or a choice between a few fixed shapes to module-level constants (`styles={isDisabled ? DISABLED_STYLES : STYLES}`). A component that merges its consumer's public `styles` or style props during render is an exception whose reason names those props.

Transitions and animations take their duration from a token. Leave the duration out to get the transition's own default (`$<name>-transition`, falling back to `$transition`), or name a duration token from `src/tokens/base.ts` (listed in the Usage docs). Derive a dependent timing from its token, such as `(2 * $overlay-transition)`, rather than hardcoding the result. A keyframe loop's length, or a one-off timing that no token's role covers, is an exception with its reason.

Off on purpose: `no-style-prop` (see [Inline style](#inline-style)), `no-styles-prop` (UI Kit's own components pass `styles` down, and it is public API) and `prefer-shorthand-property` (single-side overrides are deliberate). `valid-custom-property` stays off until its existing hits are cleared.

# Markdown rules

- **Never hard-wrap prose.** One paragraph is one line, in every `.md` and `.mdx` file — documentation, `AGENTS.md`, specs and changesets alike. No wrapping at 80 or 100 columns, no manual line breaks inside a sentence.
- Hard-wrapped prose is what makes these files awkward to edit and to review: a one-word change reflows the paragraph, so the diff reads as a full rewrite and every editor disagrees about where the breaks belong.
- Prettier enforces it (`proseWrap: 'never'` in `.prettierrc.cjs`, `*.{md,mdx}` in `.lintstagedrc`). `pnpm fix` unwraps anything that slipped through.

# Knowledge rules

- If you find any essential knowledge that is not yet listed anywhere, then add it to AGENTS.md file in the nearest folder this knowledge applies to. Create file if it's not yet exist. Make sure this essential knowledge is as compact as possible.
