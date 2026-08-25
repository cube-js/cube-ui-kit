# Development flow rules

- Don't respond with "You're right!", "Great idea!" and so on. Get straight to the point.
- **Stop and describe the reason**, if you can't closely implement the task, or need a different approach from what was asked, or noticed a critical mistake in the prompt.
- Do not run tests if you only changed stories or documentation since the last test run.
- If you need to move or rename a file: use command line tools for that.
- If you need to move a part of code from one file to another: First, write the code at the new place, then delete the code in the original place.
- Don't implement backward compatibility unless asked.

# Coding rules

- Use named imports from react (like `useCallback`) instead of using the `React` instance. Avoid: `React.useCallback`.
- Prefer stable `useEvent` callbacks when it's possible.

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

# Markdown rules

- **Never hard-wrap prose.** One paragraph is one line, in every `.md` and `.mdx` file — documentation, `AGENTS.md`, specs and changesets alike. No wrapping at 80 or 100 columns, no manual line breaks inside a sentence.
- Hard-wrapped prose is what makes these files awkward to edit and to review: a one-word change reflows the paragraph, so the diff reads as a full rewrite and every editor disagrees about where the breaks belong.
- Prettier enforces it (`proseWrap: 'never'` in `.prettierrc.cjs`, `*.{md,mdx}` in `.lintstagedrc`). `pnpm fix` unwraps anything that slipped through.

# Knowledge rules

- If you find any essential knowledge that is not yet listed anywhere, then add it to AGENTS.md file in the nearest folder this knowledge applies to. Create file if it's not yet exist. Make sure this essential knowledge is as compact as possible.
