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

- **A value that changes at runtime** (a measured width, a drag position, a picked color): declare `$name` or `#name` in the element's styles and pass the value through `tokens`, for example `tokens={{ '$panel-size': `${size}px` }}`. It renders as the same inline custom property, without a new style rule per value. A bare number renders unitless (`'$x': 12` gives `--x: 12`), so add the unit yourself.
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
- a known Tasty limitation, named with its issue and the condition for removing the exception.

Every disable directive needs a ` -- reason`, not only these ones. The repo-local `repo/require-disable-reason` rule (`scripts/oxlint-repo-rules.mjs`) fails a directive without one.

`tasty/no-style-prop` stays off. Since 1.8.2 it also recognizes Tasty components imported from relative modules, but it still covers only Tasty components, while the React rules cover every element, native and third-party ones included. Enabling both would need two directives on every exception.

# Markdown rules

- **Never hard-wrap prose.** One paragraph is one line, in every `.md` and `.mdx` file — documentation, `AGENTS.md`, specs and changesets alike. No wrapping at 80 or 100 columns, no manual line breaks inside a sentence.
- Hard-wrapped prose is what makes these files awkward to edit and to review: a one-word change reflows the paragraph, so the diff reads as a full rewrite and every editor disagrees about where the breaks belong.
- Prettier enforces it (`proseWrap: 'never'` in `.prettierrc.cjs`, `*.{md,mdx}` in `.lintstagedrc`). `pnpm fix` unwraps anything that slipped through.

# Knowledge rules

- If you find any essential knowledge that is not yet listed anywhere, then add it to AGENTS.md file in the nearest folder this knowledge applies to. Create file if it's not yet exist. Make sure this essential knowledge is as compact as possible.
