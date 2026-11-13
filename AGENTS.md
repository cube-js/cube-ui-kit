# AI Agent Reference — Cube UI Kit

Entry point for AI agents working on `@cube-dev/ui-kit`.

- **Package:** `@cube-dev/ui-kit`
- **Repository:** [cube-js/cube-ui-kit](https://github.com/cube-js/cube-ui-kit)
- **Storybook:** [cube-ui-kit.vercel.app](https://cube-ui-kit.vercel.app/)
- **Styling engine:** [Tasty](https://github.com/tenphi/tasty) (`@tenphi/tasty`)
- **Palette engine:** [Glaze](https://github.com/tenphi/glaze) (`@tenphi/glaze`)

> **Maintenance note:** The design-system reference (tokens, presets, colors, modifiers, state syntax, form system, icons) lives in `src/stories/Usage.docs.mdx` (Storybook → **Getting Started / Usage**). The component creation guide lives in `src/stories/CreateComponent.docs.mdx` (**Getting Started / Create Component**). Update these whenever you add components, change the API surface, or modify tokens/presets.

## Before You Start

**Run this at the start of every task, before reading code, running tests, or trusting any type error:**

```bash
pnpm install && pnpm rebuild esbuild
```

A working copy can sit idle across dependency bumps, so `node_modules` may not match `pnpm-lock.yaml`. A stale tree does not fail loudly — it silently inverts results. Tests pass locally and fail on CI (or the reverse), and `tsc` reports errors that do not exist on the pinned version. Anything you conclude from a stale tree is unreliable, including the conclusion that a failure is "pre-existing".

When local results and CI disagree, suspect the dependency tree first. Compare the installed version against the lockfile before theorising about anything else:

```bash
pnpm list @tenphi/tasty @tenphi/glaze
```

## Rules

Project-specific working rules for AI agents. Not published with the package.

- [react-compiler.md](docs/rules/react-compiler.md) — React 19, callbacks, Effect Events, memoization and lifecycle ownership
- [coding.md](docs/rules/coding.md) — development flow, code style, **import rules**, inline `style` and Tasty lint rules, Markdown formatting, knowledge maintenance
- [entropy.md](docs/rules/entropy.md) — proportional complexity in code, public APIs, consumer usage and UX; Entropy review and developer exceptions
- [input-components.md](docs/rules/input-components.md) — form-attachable input components (`useFieldProps`, validation props, `wrapWithField`)
- [storybook.md](docs/rules/storybook.md) — `.stories.tsx` and `.docs.mdx` authoring, including the `play`-function rule below
- [documentation.md](docs/rules/documentation.md) — `.docs.mdx` structure + update flow
- [tests.md](docs/rules/tests.md) — Vitest + React Testing Library patterns
- [probe.md](docs/rules/probe.md) — `pnpm probe`: inspecting the HTML, CSS and tokens a render actually produces
- [screen-reader.md](docs/rules/screen-reader.md) — the virtual screen reader: `pnpm probe render --sr` and the spec helpers, with the limits that make a silence the simulator's rather than the component's
- [commit-changes.md](docs/rules/commit-changes.md) — commit message convention
- [eslint-plugin.md](docs/rules/eslint-plugin.md) — the shipped lint rule + the defaults registry it checks against
- [review.md](docs/rules/review.md) — shared UI Kit review checklist, scope and verification; the local `ui-review` skill reads this file

## Entropy rule

Every task follows the [Entropy rule](docs/rules/entropy.md): added complexity must serve validated requirements and remain proportional to the capability delivered. Prefer safe simplification in the affected area, and consider the burden on component maintainers, consumers and end users together. Record any developer-accepted exception with its reason and scope. Every UI Kit review includes an Entropy review and reports the entropy change level in the affected context.

## Browser Support and Web Platform Guidance

**Browser Support:** the latest 3 major versions of Chrome, Firefox and Safari, iOS Safari included (`browserslist` in `package.json`). A feature all of them support needs no fallback or polyfill; for anything newer, use the fallback its guide recommends.

The [`modern-web-guidance`](.claude/skills/modern-web-guidance/SKILL.md) skill (Chrome's web platform guides: its `SKILL.md` is copied from the npm package, and the guides load at run time) is guidance, not rules. UI Kit is built on React Aria and does many things differently, so React Aria stays the target and reference for semantics, focus, keyboard, overlays and positioning. Where a guide prescribes a native primitive React Aria already covers (`<dialog>` and `showModal()`, the `popover` attribute, `commandfor` and `interestfor`, CSS anchor positioning for overlay placement, a customizable `<select>`), follow React Aria and skip that advice; drop a `legacy-scan` finding whose fix would replace React Aria behavior for the same reason. Departing from React Aria takes a maintainer's decision in its own issue, never a drive-by in another fix.

Use the guides where they don't conflict: CSS layout, animation, color, scrollbars, typography and performance, with their CSS written as Tasty styles (`@starting`, `@supports(…)`, `@(…)` container states) and their colors as UI Kit's Glaze tokens, which already carry the dark and high-contrast schemes. When the CLI reports the skill out of date, replace `SKILL.md` with the package's current copy, unchanged.

## Changesets

When making code changes that affect end users or the public API, **always add a new changeset or update an existing one** in [`.changeset/`](.changeset/) as part of the same task. Do not wait to be asked.

- Prefer updating an existing open changeset that already covers the same work/PR; otherwise add a new `.md` file.
- Use `patch` for bug fixes and small changes; `minor` for new features and noticeable breaking changes.
- Keep the summary concise and user-focused (`"@cube-dev/ui-kit": patch|minor` frontmatter).
- Skip changesets for docs-only, test-only, Storybook-only, or internal tooling that does not affect package consumers. Also skip fixes for issues introduced and resolved within the same PR.
- Add changeset manually (no CLI) — full guidelines: [`.cursor/commands/add-changeset.md`](.cursor/commands/add-changeset.md).
- Write the summary unwrapped: one paragraph is one line, like every other Markdown file here (see [Markdown rules](docs/rules/coding.md#markdown-rules)).

## Linear Issues: Done When Cloud Has the Fix

Cloud consumes the published package, so a UI Kit fix reaches users only when a Cloud PR bumps a release that carries it. Cloud's `update-uikit` skill finds the fix's issues through the changelog's links to UI Kit PRs, and the bump closes each one it completes; an issue that also needs a Cloud change, such as removing a workaround, closes with that change. So a UI Kit PR links its issues without closing them:

- Name each issue on a line of its own in the PR body: `Part of <issue ID>`.
- Keep issue IDs out of the PR title and the branch name, which close an issue on merge, and out of changesets, whose text the release PR copies. Never put a closing word before an ID: Linear's are close, fix, resolve, complete and implement in any form, and "Linear issue".
- A PR that only edits another PR's unreleased changeset ships under that PR's changelog entry, which links only that PR, so it names only issues that PR names too. Give any other issue a changeset of its own.
- Tasty isn't connected to Linear. The UI Kit PR that bumps `@tenphi/tasty` names the Tasty fix's issues as `Part of`.
- After a merge, check each issue the PR names. An issue whose fix ships in no release, because none of its PRs adds a non-empty changeset (see Changesets), has nothing for a bump to find: move it to Done by hand once its last PR has merged. One whose fix ships in a release and went to Done before Cloud has it goes back to In Progress, with a comment saying what is left.

File new issues with the [`create-ticket`](.claude/skills/create-ticket/SKILL.md) skill. `implement` runs it for a task that has no issue.

**Tracking a task.** Update the issue and the PR body when the work moves, not on every event, and edit them in place rather than append:

- **Status:** In Progress when work starts. Linear's GitHub integration attaches each PR that names the issue and moves its status when the PR opens: don't repeat that by hand or in a comment.
- **Description:** the task as it stands now. When the scope or approach changes, edit the sections it changes and comment one line on what changed and why. No progress log. On an issue someone else is working on, propose the edit in a comment instead.
- **PR body:** what the diff does now, rewritten after a push that changes it.
- **Comments:** what a reader acts on, such as a question or blocker waiting on a person or another issue, or a follow-up issue.
- **Not tracked:** CI runs and their test failures, reruns, flakes and outages, review rounds and their findings, pushes and rebases. When one changes the scope or approach, record that change, not the event.

## Stories: Interaction-Only States

A state that only exists during an interaction — an open tooltip, a hover or focus style, an expanded overlay — is invisible to Chromatic unless a `play` function puts the story into it. Chromatic runs `play` before it snapshots, so a story whose point is such a state **must** drive it with `play` and end on a `waitFor` assertion for the state itself (that assertion is also the wait Chromatic needs). Drive one element per story — only the final state is captured. For tooltips, copy the recipe verbatim: `timeout(250)` (the trigger is wired in a mount effect), `unhover` before `hover` (React Aria ignores a hover until a mouse move sets the pointer modality), and `delay: 0` in the tooltip config. Both caveats fail silently, and a local render test can pass while the story does not — Chromatic is the check. Full pattern: [storybook.md](docs/rules/storybook.md#interaction-only-states-need-a-play-function).

## Imports: Reach Past the Barrel

Inside `src/`, import the file that defines a thing rather than the barrel that re-exports it: `from '../../actions/ItemButton/ItemButton'`, not `from '../../actions'`. Same component either way, but the barrel also drags `Menu`, `CommandMenu`, `ButtonSplit` and everything they import into the graph. Three things read that graph — Chromatic's TurboSnap (which cannot scope a build around anything reachable from `<Root>`, so a barrel there costs a full 1000-snapshot rebuild), consumers' tree-shaking, and module init order around `Root`'s module-scope `configure()`. Lint enforces it: `repo/no-barrel-import` rejects a relative import that resolves to an `index.ts`, and `import/no-cycle` rejects an import cycle. `import type` is exempt, a story may import a component's own entry for its compound API (`Button.Group`), and `index.ts` files and specs are exempt. `node scripts/chromatic-report.mjs --trace <file>` prices a change before you make it. Full rules: [coding.md](docs/rules/coding.md#imports).

## React Compiler: Skip Manual Memoization

The build compiles runtime source with React Compiler 1.0.0 targeting React 19, using the native `react/compiler-runtime`. Consumers require React and React DOM 19.3 or newer. Write plain derived values and ordinary handlers; use local `useEffectEvent` callbacks for effect-owned work and retain `useEvent` only for a demonstrated retained-reference contract. Manual memoization does not own a permanent per-mount lifetime. Follow the canonical [React Compiler and callback rules](docs/rules/react-compiler.md).

Run `pnpm diagnostics:compiler` and `pnpm diagnostics:hooks --check` after touching runtime source. Both ratchets reject regressions; every module adopting Effect Events also passes strict official hook/dependency rules without inline suppressions. Ratchet only verified improvements and review the baseline diff. Keep compiled and uncompiled behavior correct; preserve legacy Form opt-outs.

## Styling: Keep Components Customizable

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

## Stories: The Snapshot Budget

Chromatic bills per snapshot and a snapshot is one story, so every story is a recurring cost for as long as it exists. A story earns its snapshot by showing something no other story shows — and a surprising number do not: controlled/uncontrolled twins, props that only paint during a drag or hover, `DynamicSections` next to `WithSections`, a `Modal` story for a dialog whose default type is already `modal`. Keep those stories (the sidebar and the docs page still want them) and opt the photograph out with `NO_SNAPSHOT` from [`src/stories/chromatic.ts`](src/stories/chromatic.ts), with a comment saying why. Where several stories differ only in one enum value, one matrix story is both cheaper and a better review artefact — an inconsistency between two themes shows up in one image and not across two.

Do not guess which stories are redundant, measure: `pnpm build-storybook && pnpm chromatic:duplicates` renders every story in real Chromium (waiting for `play`, as Chromatic does) and reports the groups that are provably paying twice for one image, plus the stories named for an overlay that never opened. `pnpm chromatic:report` covers the other half of the bill — how much of the suite one changed file drags in, and which files force a full rebuild by being reachable from `.storybook/preview.jsx`. Inside that dependency tree, import defining files directly rather than through a barrel: one `from '../../actions'` pulls most of the library into the always-rebuild set. `pnpm chromatic:check` gates this in CI. Full guidance: [storybook.md](docs/rules/storybook.md#the-snapshot-budget).

## Stories: The Accessibility Baseline

CI renders every story in real Chromium and runs axe-core on it: `pnpm diagnostics:a11y --check`, against WCAG 2.2 A/AA. `scripts/a11y-baseline.json` records how many elements fail each rule in each existing story, and nothing may grow. A new story has to be clean, including the labels on its icon-only buttons and fields, because consumers copy stories. After a fix, lower the baseline with `--update` and commit it. Raise it only for an axe false positive or an axe-core upgrade, and say which in the PR. Full rules: [storybook.md](docs/rules/storybook.md#the-accessibility-baseline).

## Bundle Size: Gate Dependencies, Not Growth

The size job (`.github/workflows/size-limit.yml`) has no byte limit: UI Kit's own code grows with every feature, and the PR comment reports the total and its change against `main`. It fails on two things instead. The dependency graph changes: a third-party package enters or leaves the bundle, or grows more than 10 KB past its size in `scripts/bundle-deps-baseline.json`. Or the `{ Button }` import weighs more than 35% of the full bundle, which means tree-shaking broke. Only those changes are reported, so a version bump within the 10 KB passes without a word. **Leave the check to CI: don't run `pnpm size` before a push.** A graph change is rare, and the job measures every PR. When it fails on a package, its PR comment lists the baseline entries to set and delete: apply them, commit, and say in the PR why the package is worth it, or that it is gone. `@tenphi/*` packages are ours and not gated. Growth within the 10 KB is tolerated but not approved, so it adds up across PRs until it fails. The `{ Button }` entry is checked only by its share: a package already in the full bundle that newly reaches `Button` passes. `pnpm build && pnpm size` runs the same check locally, for work on the check itself; `pnpm size --update` re-approves every package at its current size, so review the whole baseline diff. See [`scripts/bundle-deps.mjs`](scripts/bundle-deps.mjs).

## CI: Run What a Change Can Affect

PR CI skips the jobs a change cannot affect. A `plan` job runs `scripts/ci/plan-jobs.mjs` first in the `Pull Request`, size and `Publish` workflows, and the run summary says why each job ran or was skipped. A job is skipped for one of two reasons. Either the PR changes no file the job reads, judged by each file's kind in `KINDS` (a spec alone runs the jsdom suites; a story runs a11y, Chromatic and the canary; repository notes run nothing but `Lint, types & diagnostics`, which always runs). Or the job already passed on exactly these inputs in an earlier run of the same PR: `Tests & lint` saves an empty cache entry named after a hash of each passing job's inputs, a pass marker, and a later push that leaves those inputs alone skips the job.

A file no kind matches runs every job, and so does a failed planner. Chromatic is never skipped by a marker: its skip marks the commit as passing, which would approve visual changes an earlier push left unreviewed. A fork's PR neither saves nor trusts markers. To run every affected job again, use **Re-run all jobs**: a later attempt ignores markers. The table is only sound while imports respect it, so `plan-jobs.test.mjs` checks every relative import in `src`: the imported file's kind must be read by every job that reads the importer. When it fails, move the import or widen the kind.

## Inspecting Rendered HTML & CSS — `pnpm probe`

Answering "what CSS does this actually produce?" is one call, not a throwaway vitest spec: `pnpm probe styles '{"fill":"#purple"}'` (also `tokens`, `render`, `globals`). It loads the real config — the `configure()` and `setGlobalPredefinedStates()` from `src/components/Root.tsx` and the live Glaze palette. **Never verify a style through `node -e "import {renderStyles} from '@tenphi/tasty'"`** — that path loads none of it, so units, recipes, presets and tokens go unresolved and the output looks authoritative while being wrong.

Use it as freely as you like, either tier: it is a throwaway question-answering tool, so nothing here needs justifying. It is also the honest way to check a styling claim before you write it into a doc or a review. `pnpm probe:browser` adds the four things jsdom cannot do — computed values, geometry, pointer behaviour, screenshots — at the cost of a browser binary and a slower start.

**Read [`docs/rules/probe.md`](docs/rules/probe.md)** for the modes, the jsdom blind spots that make an answer jsdom's rather than the truth, the one-time `pnpm exec playwright install chromium`, and how the `*.browser.test.tsx` suite differs (that one _is_ in CI, and the probe's freedom does not extend to it).

The DOM helpers behind it live in `src/probe/` and ship as the `@cube-dev/ui-kit/probe` entry, which Cube Cloud's own `yarn probe` imports. Changing them is a change to published API.

## Hearing What a Screen Reader Says

"What does a screen reader announce here?" is one call: `pnpm probe render --sr`, on either tier. It reads the page with [`@guidepup/virtual-screen-reader`](https://www.guidepup.dev/docs/virtual) and prints each phrase — `button, Save`, `checkbox, Accept, not checked`, `polite: Added two`. A snippet that exports `play({ reader, screen, userEvent, waitFor, within })` drives keys and focus first, and `--sr` then prints what was said during `play` as well. Use it before you claim or fix anything about names, descriptions, states, reading order, modal containment or announcements.

In specs, use `startScreenReader()` / `readWithScreenReader()` from `src/test/screen-reader.ts`, imported by path. **Never call the package's `virtual.start()` directly**: it is a singleton whose unstopped sessions keep writing into later specs' logs. It is a simulator with blind spots — an inserted `role="alert"` is silent, and `press()` re-focuses the element under its cursor — so **read [`docs/rules/screen-reader.md`](docs/rules/screen-reader.md)** before trusting a silence, and confirm a new pattern with VoiceOver or NVDA.

## Project Structure

```
src/
├── components/        # actions, content, fields, form, layout, navigation,
│                      # organisms, overlays, status, helpers, portal, other, shared
├── icons/             # 130+ icon components
├── shared/            # Form types (FieldBaseProps, FormBaseProps, FieldCoreProps)
├── tokens/            # Design tokens (colors, typography, spacing, sizes, shadows, layout)
├── stories/           # Storybook guides and documentation pages
├── _internal/         # Internal hooks (useEvent, etc.)
├── tasty-augment.d.ts # TypeScript module augmentation for tasty
└── index.ts           # Public barrel export
```

Each component lives in `src/components/{category}/{ComponentName}/` and ships `ComponentName.tsx`, `.stories.tsx`, `.docs.mdx`, `.test.tsx`, and `index.tsx`.

## Commands

- `pnpm storybook` — start Storybook on port 6060
- `pnpm build` — build library (`tsdown`, unbundled ESM)
- `pnpm test` — run all tests (Vitest); add `-- ComponentName` to filter, `-u` to update snapshots
- `pnpm test:once` — the full `pnpm test` (no test arguments), skipped when this exact tree is the last one that passed it in this worktree: a clean working tree (no changes, no untracked files, no tracked file written during that run) with the same Node, install and test environment (`KEYED_ENV` in the script; a test that reads another environment variable adds it there). It never selects tests by changed files. See [`scripts/test-once.mjs`](scripts/test-once.mjs)
- `pnpm test:browser` — run the `*.browser.test.tsx` specs in real Chromium (layout, pointer, observers)
- `pnpm probe` — print the HTML, CSS or tokens a snippet actually produces, with the real config loaded. `pnpm probe:browser` for computed values, geometry and screenshots; `render --sr` for what a screen reader says. See [Inspecting Rendered HTML & CSS](#inspecting-rendered-html--css--pnpm-probe) and [Hearing What a Screen Reader Says](#hearing-what-a-screen-reader-says)
- `pnpm fix` — lint + format (Oxlint + Prettier)
- `pnpm size` — measure the bundle, then check its third-party packages against `scripts/bundle-deps-baseline.json` (needs `pnpm build` first). CI runs it on every PR, so it is not a pre-push step; `--update` re-approves every package. See [Bundle Size](#bundle-size-gate-dependencies-not-growth)
- `pnpm chromatic` — visual regression
- `pnpm chromatic:report` — snapshot inventory + TurboSnap blast radius. `pnpm chromatic:check` is the CI gate; `pnpm chromatic:duplicates` finds stories that photograph the same thing. All three read `storybook-static`, so run `pnpm build-storybook` first. See [The Snapshot Budget](#stories-the-snapshot-budget)
- `pnpm add-icons` — add new icons from tabler
- `pnpm audit-docs` — audit component API ↔ docs ↔ argTypes sync. Options: `--component=Name`, `--fix-stories`, `--fix-docs`, `--json`, `--verbose`, `--all-props`. **Run after changing a component's API or adding a new component.**
- `pnpm diagnostics:compiler` — check every source file against the React Compiler coverage baseline (`scripts/compiler/baseline.json`); `--update` ratchets it after a reviewed change. See [React Compiler](#react-compiler-skip-manual-memoization)
- `pnpm diagnostics:hooks --check` — whole runtime-source official Hooks ratchet plus strict Effect Event adoption checks. `--update` tightens the canonical baseline after reviewed improvements. See [React Compiler rules](docs/rules/react-compiler.md).
- `pnpm diagnostics:form` — Form/input view of the same Hooks baseline; `--check` rejects growth. Update through `diagnostics:hooks --update`. See [`src/components/form/Form/legacy-contract/README.md`](src/components/form/Form/legacy-contract/README.md)
- `pnpm check:react-package` — verify supported React peers and native compiler imports before publishing or testing a packed build.
- `pnpm check:consumer-declarations` — after `pnpm pack:test`, install the packed build in a consumer and emit declarations for `tasty(Component, {})` of every exported component with TypeScript 7. It fails when a declaration needs a type the package does not export (TS2883, TS4023), and when the package bundles `dist/node_modules`. Name a compound component with an exported interface, as `LayoutComponent` does.
- `pnpm diagnostics:a11y` — every story through axe-core (WCAG 2.2 A/AA) in real Chromium, against the per-story baseline in `scripts/a11y-baseline.json`. `--check` fails on growth and runs in CI; `--update` records a fix; `--filter` and `--verbose` show what fails where; `--shard 2/3` runs one of the three parts CI checks in parallel. Reads `storybook-static`, so run `pnpm build-storybook` first. See [storybook.md](docs/rules/storybook.md#the-accessibility-baseline)
- `pnpm diagnostics:complexity` — every function in `src/` ranked by cognitive complexity (SonarSource's metric, from `eslint-plugin-sonarjs` running in oxlint), worst first. Options: `--limit N`, `--all`, `pnpm -s … --json`. `.oxlintrc.json` caps every function with the same rule (`sonarjs/cognitive-complexity`), so `pnpm lint` fails CI if any function exceeds it. The ceiling only goes down: when a refactor leaves the worst function lower, lower the ceiling to match (the report says when). A new function too complex to fit is a sign to extract hooks, sub-components or pure helpers, not to raise the ceiling. One quirk of the plugin (4.2.2): a ternary branch that is itself a function (`cond ? () => true : fn`) adds a level of nesting to everything after it in the enclosing function, so hoist such a function to a named constant. See [`scripts/complexity-report.mjs`](scripts/complexity-report.mjs)
- `pnpm audit-defaults` — regenerate the lint plugin's defaults registry (`src/eslint-plugin/defaults.generated.ts`). **Run whenever you change a default prop value.** `pnpm test` fails until the registry matches what the components actually render — see [eslint-plugin.md](docs/rules/eslint-plugin.md).
- `pnpm generate:tasty-config` — regenerate `tasty.config.generated.ts`: the tokens, state aliases, presets and recipes the published `tasty.config.ts` lists for consumers' lint. **Run whenever you add, rename or remove one.** `pnpm test` fails until the file matches the runtime — see [coding.md](docs/rules/coding.md#tasty-lint-rules).
- `pnpm run update-tasty` / `pnpm run update-glaze` — bump and pin `@tenphi/tasty` or `@tenphi/glaze` to the latest version, then sync the harness block. To pin a specific version, set `npm_config_version`: `npm_config_version=X.Y.Z pnpm run update-glaze`. A `--version=X.Y.Z` flag does not work: pnpm passes it to `pnpm add`, which prints pnpm's own version and changes nothing.

## Environment

- Tasty's experimental type-aware JSX analysis is enabled only in this repo's `.oxlintrc.json` through `settings.tasty.typeAwareJSX`, using `tsconfig.json` and the installed TypeScript. It distinguishes semantic props such as drop ordering and Item content from style props. Unresolved or erased prop types keep the name heuristic and may still need individual ignores. Cold lint runs load the TypeScript project; the setting is not part of the published Tasty config or plugin presets, so consumers such as Cloud remain opt-in.
- Two TypeScripts. `pnpm test:types` and the `tsc` half of `pnpm test:types:consumer` run TypeScript 7 (the `typescript-native` alias, ~7× faster). `typescript` stays 5.x because TypeScript 7 ships no compiler API, and tsdown's declaration build, `audit-docs`, `check-declaration-bindings.mjs`, the export parsing in `check-consumer-declarations.mjs` and the type-aware lint above all need it. Both packages ship a `tsc` binary, so a bare `tsc` may run either one; use the scripts. TypeScript 7 removed `baseUrl`, so import by relative path, never `from 'src/…'`.
- Node 24, pinned in `.nvmrc` and used by every CI job including publish — OIDC trusted publishing requires npm ≥ 11.5.1, which Node 24 ships and Node 22 (npm 10.x) does not. pnpm `^10`, pinned to `pnpm@10.34.5` via `packageManager`; no Corepack involved. Note the published package still declares `engines.node >=22.0.0` — that is the floor for consumers, not for building this repo.
- After `pnpm install`, run `pnpm rebuild esbuild` (postinstall is blocked in `pnpm-workspace.yaml`). Do this at the start of every task — see [Before You Start](#before-you-start).
- Husky hooks: `pre-commit` runs `pnpm lint-staged`; `pre-push` runs `node scripts/test-once.mjs --pre-push`, which skips like `pnpm test:once` only when every pushed ref also points at that tree, and otherwise runs the full suite on the working tree as before. So a `pnpm test:once` pass covers the next push of that tree. Skip only intentionally (`--no-verify` or `HUSKY=0`).
- No external services or databases required for local development.

## Tasty and Glaze Documentation

The docs of the installed Tasty and Glaze come through harnesspm, as they do for consumers. Their indexes are in the harnesspm block at the end of this file, and `pnpm install` rewrites them for the pinned versions.

- **Tasty:** [`llms.txt`](node_modules/.harnesspm/pkgs/@tenphi/tasty/docs/llms.txt). Read "Tasty Style Rules for AI Agents" before you write or review styles, then the guides and references the task needs. UI Kit ships neither build-time extraction nor SSR.
- **Glaze:** [`llms.txt`](node_modules/.harnesspm/docs/glaze/llms.txt). Read it when you work on color tokens, theme generation or contrast tuning: Glaze powers `src/tokens/palette.ts`. Start with "Designing a palette" and "Light, dark, and high contrast".

## Harness for Coding Agents — `harness/`

`harness/` ships in the package for projects that use [harnesspm](https://www.npmjs.com/package/@tenphi/harnesspm). It is for agents that **use** UI Kit; the rules for working on UI Kit stay in this file. This repository uses harnesspm too, so the block at the end of this file holds the same harness, changed for this repository by `harnesspm.json`.

- [`plugin.json`](harness/plugin.json) extends `@tenphi/glaze` and `@tenphi/tasty`, so a project gets Glaze's colors rule, docs and `glaze-theme` skill, and Tasty's styles rule and docs, through UI Kit. It also extends `@tenphi/eslint-plugin-tasty`, an optional peer: a project that installs the plugin gets its `tasty-lint` harness (a rule to lint changed styles, a page for every `tasty/*` rule, `tasty-lint:check`, and a hook that lints each file an agent edits), and harnesspm skips it quietly in a project without the plugin. Every `extends` entry must be a dependency or an optional peer, which `src/harness.test.ts` checks. Scripts run only in projects that trust their package: `uikit:tokens` needs `@cube-dev/ui-kit` trusted, Glaze's `glaze:*` tools need `@tenphi/glaze`, `tasty:styles` needs `@tenphi/tasty`, and `tasty-lint:check` and its edit hook need `@tenphi/eslint-plugin-tasty`. Its `docs` is `src/`: the package ships the Storybook pages (`src/**/*.docs.mdx`) and the Modern Form guides there, and harnesspm indexes them by their `#` titles, with no build step. Tasty's and Glaze's indexes come with their harnesses. harnesspm lists every page it finds in `src/`, so keep anything else there out of `files`.
- [`rules/usage.md`](harness/dev.harnesspm/rules/usage.md) (`uikit:rules/usage`) is the one always-on rule, with UI Kit's color guidance. Keep it short: it is in every consumer's `AGENTS.md`. Its ID is public, since consumers name it to patch or exclude it.
- [`patches/glaze-colors.patch.md`](harness/dev.harnesspm/patches/glaze-colors.patch.md) replaces only the "Where colors come from" section of Glaze's colors rule, which would otherwise send an app on UI Kit to a Glaze theme of its own.
- [`patches/tasty-usage.patch.md`](harness/dev.harnesspm/patches/tasty-usage.patch.md) replaces only the "Checking styles" section of Tasty's rule, so `tasty:styles` loads UI Kit's `configure()` through `--setup @cube-dev/ui-kit/dist/components/Root.js`. Without it, the CSS uses Tasty's default units and none of UI Kit's states or recipes.
- `uikit:tokens` ([`scripts/tokens.mjs`](harness/dev.harnesspm/scripts/tokens.mjs)) is for consumers: palette tokens and their aliases by their Tasty names (which aliases are legacy is the Usage guide's call, not the tool's), with values in all four schemes and contrast against their base, measured by Glaze's public measuring module, `@tenphi/glaze/harness/measure`, from the pinned Glaze. It reads `dist/`. While you edit the palette here, use `pnpm probe tokens`, which reads `src/`.
- [`harnesspm.json`](harnesspm.json) changes the harness for this repository only, never for consumers. It trusts `@tenphi/tasty`, `@tenphi/glaze` and `@tenphi/eslint-plugin-tasty`, so their tools and the lint hook run here. Its patches in `harnesspm/patches/` point the UI Kit, Tasty, Glaze and lint rules at `src/`, `pnpm probe` and `pnpm exec oxlint`, because the shipped text names `dist/` and a consumer's own Glaze theme and lint.
- `pnpm install` runs `harnesspm sync` (in `prepare`); `pnpm add` does not. After `pnpm add` or a change to `harness/` or `harnesspm.json`, run `pnpm exec harnesspm sync` and commit `AGENTS.md` and `harnesspm.lock.json`. The lint job fails when they are out of date. Prettier skips the block, which harnesspm formats its own way.
- `pnpm check:harness` (`harnesspm check`, a devDependency) validates the harness, and CI runs it in the lint job. [`src/harness.test.ts`](src/harness.test.ts) guards what it cannot see: the packages `extends` names, the Glaze and Tasty sections the patches replace, and the tool; `package-tests/artifacts.test.tsx` runs the tool, checks that `src/` ships only doc pages, and runs `tasty:styles` with the setup the Tasty patch names, all on the packed build.

## Stack

- **Styling:** `@tenphi/tasty` (declarative token-aware CSS-in-JS)
- **Accessibility:** `react-aria` + `react-stately`
- **Icons:** `@tabler/icons-react` + custom icons in `src/icons/`
- **Testing:** Vitest + React Testing Library + Chromatic
- **Build:** React Compiler → tsdown (unbundled ESM, `es2022`). See [`scripts/compiler/README.md`](scripts/compiler/README.md) for the shared transform, coverage baseline, and compiled/uncompiled packaged-consumer tests. Review baseline changes explicitly; a successful build with known bailouts does not mean every function is optimized.
- **Storybook:** v10 (`@storybook/react-vite`)
- **React:** React and React DOM 19.3+ supported

## Creating Components

See `src/stories/CreateComponent.docs.mdx` (Storybook → **Getting Started / Create Component**) for the full guide: `styleProps` vs `extractStyles`, `filterBaseProps`, modifiers, sub-elements, React Aria integration, variants, `useEvent`, and complete examples.

## Design System Reference

See `src/stories/Usage.docs.mdx` (Storybook → **Getting Started / Usage**) for units, base/spacing/size/shadow/layout tokens, color tokens, typography presets, themes, recipes, modifiers, state syntax, icons, and the form system.

## i18n

Full rules in [`src/i18n/README.md`](src/i18n/README.md). The short version:

- **Scope: strings a component renders.** Anything the component itself puts in front of a user — visible text, `aria-label`, `aria-roledescription`, live-region announcements, `title` — goes through `useI18n()`: `t('component.key', 'English default')`. The inline English stays as a belt-and-braces fallback.
- **Not for stories, docs, or tests.** Storybook stories, `.docs.mdx`, and specs are demo and fixture copy, not product UI. Use plain literals there — a locale key that exists only to feed a story is noise in twelve files, and a test that reads its expectation from the bundle asserts nothing about the string.
- **Component props that expose a label stay overrides** that win over the translated default: `emptyLabel = t('...', 'No items')`.
- **All 12 locales, every time.** `en-US` is the source of truth; `locale-parity.test.ts` fails CI if any locale's key set or `{{interpolation}}` tokens diverge. Interpolation is `{{double}}` braces with no ICU, so plurals need separate keys rather than a plural rule.
- **If a string doubles as a DOM selector**, build the selector from the same `t(...)` value so the two cannot drift when the language changes.

## TypeScript & Exports

- **Module augmentation:** `src/tasty-augment.d.ts` extends `@tenphi/tasty` with project-specific color tokens, preset names, and theme names.
- **Props naming:** `Cube{ComponentName}Props`. Extend `BaseProps`/`AllBaseProps` from `@tenphi/tasty`; mix in style-prop interfaces (`ContainerStyleProps`, `OuterStyleProps`, `ColorStyleProps`, …) as needed. Field-level inputs take `FieldLayoutStyleProps` only ([input-components.md §1](docs/rules/input-components.md)). Form types live in `src/shared/`.
- **Barrel exports:** every category has an `index.ts`; everything re-exports through `src/index.ts`.
- **Modern Form adoption:** follow [`modern-form-migration.md`](src/components/form/Form/modern-form-migration.md). Keep legacy wrappers on their existing backend until explicitly migrated, use selectors for rendering, and preserve legacy inline callback/rule inference in built-consumer fixtures. Path types resolve the supplied path only; do not introduce a recursive enumeration of all model paths.
- **Compound components:** `Object.assign(Button, { Group: ButtonGroup, Split: ButtonSplit })`.
- **Tasty re-exports:** only types are re-exported. Runtime imports (`tasty`, `extractStyles`, `filterBaseProps`) come directly from `@tenphi/tasty`.
- **React Aria props are checked.** Adobe's consolidated packages resolve their types even with `preserveSymlinks`. Omit locally owned props before mixing Aria interfaces with Tasty or Form interfaces: native `form`/`name` differ from UI Kit's controller/path props, and Aria's validation messages differ from field messages. Pass the normalized `useFieldProps` result to native hooks. Upgrade the Adobe dependency family together so scoped compatibility packages and monolithic packages share overlay and i18n contexts.

## Testing

- **Helpers:** `renderWithRoot` (wraps with `<Root>`), `renderWithForm` (returns `{ formInstance, ...renderResult }`).
- **QA selectors:** `qa` prop → `data-qa` attribute → `screen.getByTestId('name')` (`testIdAttribute` is configured to `data-qa`).
- **Tasty snapshots:** `toMatchTastySnapshot()` captures markup + CSS together.
- **Not every question needs a spec.** If you only want to _see_ what something renders, run [`pnpm probe`](#inspecting-rendered-html--css--pnpm-probe) instead of writing a spec to delete afterwards.
- **Screen reader:** `startScreenReader()` / `readWithScreenReader()` from `src/test/screen-reader.ts` assert what a user hears. See [Hearing What a Screen Reader Says](#hearing-what-a-screen-reader-says).
- Patterns: see [docs/rules/tests.md](docs/rules/tests.md).

<!-- prettier-ignore-start -->
<!-- BEGIN:harnesspm — generated by `harnesspm sync`. Do not edit. To change a rule, run `npx harnesspm why <ID>`. -->
## @tenphi/eslint-plugin-tasty 1.19.0

### Linting Tasty styles (tasty-lint:rules/usage)

#### After you change styles

- Lint the changed files with `pnpm exec oxlint <files>` and fix every `tasty/*` problem. It runs every Tasty rule UI Kit enforces, with the settings in `.oxlintrc.json`.
- `tasty-lint:check` and the edit hook run only the plugin's recommended rules, without UI Kit's settings, and they do not read `oxlint-disable` comments. When they disagree with `pnpm exec oxlint`, oxlint decides.
- Each `tasty/<rule>` has a page in the `tasty-lint` docs index.

#### Exceptions

- Disable a rule for one line only, with a reason: `// oxlint-disable-next-line tasty/<rule> -- <reason>`. See "Tasty lint rules" in `docs/rules/coding.md`.

- Docs: node_modules/.harnesspm/docs/tasty-lint/llms.txt (tasty-lint:docs)
- Script: `npx harnesspm run tasty-lint:check` — Lint files or folders with only the tasty/* rules (recommended, or --strict) and the project's tasty.config, and print each problem with its rule's page (tasty-lint:scripts/check)

## @tenphi/glaze 3.1.0

### Glaze colors (glaze:rules/colors)

#### Where colors come from

- UI Kit's palette is a Glaze palette, built in `src/tokens/palette.ts` from the seeds in `src/tokens/palette-config.ts`. Components use its tokens: follow the UI Kit rule.
- A color the palette lacks is added to the palette, not made in a component with a Glaze theme or `glaze.color()` of its own. Do not write its dark or high-contrast values by hand. The `glaze-theme` skill explains how to define one.

#### Checking a theme

- `glaze:inspect` cannot load UI Kit's palette: `palette.ts` builds it inside `getPalette()` and imports files without extensions. After a palette change, compare `pnpm probe tokens --json` before and after in all four schemes, as `docs/rules/probe.md` shows, and run `pnpm test -- src/tokens`.
- To try one color, such as a brand color, before you add it, run `glaze:color <color> --base <surface> --contrast AA`.
- To check two literal colors, run `glaze:contrast <text> <background>`.

- Docs: node_modules/.harnesspm/docs/glaze/llms.txt (glaze:docs)
- Script: `npx harnesspm run glaze:inspect` — Resolve a theme or palette in light, dark and high contrast, and check every contrast floor (filter with --color, --theme) (glaze:scripts/inspect)
- Script: `npx harnesspm run glaze:color` — Resolve one color without a theme: its values and tone in light, dark and high contrast, and its contrast on a --base (glaze:scripts/color)
- Script: `npx harnesspm run glaze:contrast` — Measure the WCAG and APCA contrast of a text color on a background (glaze:scripts/contrast)

## @tenphi/harnesspm 0.3.0

### Files generated by harnesspm (harnesspm:rules/generated-files)

- Files and links that harnesspm writes, such as `.claude/agents/`, `.codex/agents/`, `.claude/skills/` and `.agents/skills/`, are outputs like the managed block. Never edit them. Change the source that `npx harnesspm why <ID>` names, with the `harnesspm-improve` skill.
- After changing `harnesspm.json` or a harness file, or after `npm install <pkg>` or `pnpm add`, run `npx harnesspm sync`.

- When editing `harnesspm.json`, `harnesspm.local.json`, `harness/**`, read node_modules/.harnesspm/pkgs/@tenphi/harnesspm/harness/dev.harnesspm/rules/harnesspm-config.md — How to change harnesspm configuration and harness files safely (harnesspm:rules/harnesspm-config)
- Docs: node_modules/.harnesspm/docs/harnesspm/llms.txt (harnesspm:docs)

## @tenphi/tasty 3.19.1

### Tasty styles (tasty:rules/usage)

#### Writing styles

- Before you write or review styles, read `ai-agents.md` from the Tasty docs index.
- Use only the tokens, units, presets, recipes and states the project defines in `tasty.config.ts` or `configure()`.
- Style with `tasty()` and `styles`, not the `style` prop. Colors are `#tokens`, sizes are units (`2x`, `1r`): no hex, `rgb()` or `px`.
- One state map per property, `''` first. Sub-elements are capitalized keys, not nested selectors.

#### Checking styles

- To see the CSS that styles produce, run `pnpm probe styles '<json>'`. It loads `configure()` and the states from `src/components/Root.tsx`, and the palette from `src/`. `docs/rules/probe.md` has the other modes.
- `tasty:styles` with UI Kit's `--setup` reads the build in `dist/`, which is missing or out of date while you work here.

- Docs: node_modules/.harnesspm/pkgs/@tenphi/tasty/docs/llms.txt (tasty:docs)
- Script: `npx harnesspm run tasty:styles` — Print the CSS a Tasty styles object produces, with the app's configure() loaded through --setup, and flag values that stayed unresolved (tasty:scripts/styles)

## @cube-dev/ui-kit (this project)

### UI Kit (uikit:rules/usage)

#### Components

- Build screens from `@cube-dev/ui-kit` components before writing your own. Before you use a component, read its page in the UI Kit docs index.
- For a new form, use `Form.useController`. Read the modern form guide in the UI Kit docs index first.

#### Styling

- Style with Tasty (the `styles` prop and `tasty()`) and UI Kit's tokens, units and presets.
- Colors are UI Kit palette tokens, written `#name`, such as `#surface`, `#surface-text` or `#danger-accent-text`. Never paste raw `#rrggbb`, `rgb()` or `hsl()` values.
- To find a token, run `pnpm probe tokens --filter <part of its name>`, with `--scheme dark` or `--hc` for the other schemes. It reads the palette in `src/`. `uikit:tokens` reads the build in `dist/`, which is missing or out of date while you work here. Put a text token on its base. The Usage guide lists the legacy aliases that new code avoids.

- Docs: node_modules/.harnesspm/docs/uikit/llms.txt (uikit:docs)
- Script: `npx harnesspm run uikit:tokens` — Look up UI Kit color tokens by name: values in light, dark and high contrast, and contrast against their base (uikit:scripts/tokens)
<!-- END:harnesspm -->
<!-- prettier-ignore-end -->
