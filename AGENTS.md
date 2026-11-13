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
- [coding.md](docs/rules/coding.md) — development flow, code style, **import rules**, styling that keeps components customizable, inline `style` and Tasty lint rules, Markdown formatting, knowledge maintenance
- [entropy.md](docs/rules/entropy.md) — proportional complexity in code, public APIs, consumer usage and UX; Entropy review and developer exceptions
- [input-components.md](docs/rules/input-components.md) — form-attachable input components (`useFieldProps`, validation props, `wrapWithField`)
- [storybook.md](docs/rules/storybook.md) — `.stories.tsx` and `.docs.mdx` authoring. Read it before you add or change a story: an interaction-only state needs a `play` function, a story must earn its Chromatic snapshot, and a new story must pass axe-core
- [documentation.md](docs/rules/documentation.md) — `.docs.mdx` structure + update flow
- [tests.md](docs/rules/tests.md) — Vitest + React Testing Library patterns
- [probe.md](docs/rules/probe.md) — `pnpm probe`: inspecting the HTML, CSS and tokens a render actually produces
- [screen-reader.md](docs/rules/screen-reader.md) — the virtual screen reader: `pnpm probe render --sr` and the spec helpers, with the limits that make a silence the simulator's rather than the component's
- [commands.md](docs/rules/commands.md) — the commands not under [Commands](#commands), and the environment: Node, pnpm, the two TypeScripts, Git hooks. Read it before you run one of those commands or change the toolchain
- [commit-changes.md](docs/rules/commit-changes.md) — commit message convention
- [linear.md](docs/rules/linear.md) — Linear issues and PR bodies. Read it before you name a branch, open or update a PR, or change a Linear issue: a PR names its issues as `Part of <issue ID>`, never in its title or branch name
- [ci.md](docs/rules/ci.md) — which CI jobs a PR runs, and the bundle-size gate. Read it before you change a workflow, the job planner or a bundle baseline, or when a job fails or is skipped
- [eslint-plugin.md](docs/rules/eslint-plugin.md) — the shipped lint rule + the defaults registry it checks against
- [harness.md](docs/rules/harness.md) — the harness UI Kit ships for consumers' coding agents, and harnesspm in this repo. Read it before you change `harness/`, `harnesspm.json` or `harnesspm/patches/`
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

## Imports: Reach Past the Barrel

Inside `src/`, import the file that defines a thing rather than the barrel that re-exports it: `from '../../actions/ItemButton/ItemButton'`, not `from '../../actions'`. Same component either way, but the barrel also drags `Menu`, `CommandMenu`, `ButtonSplit` and everything they import into the graph. Three things read that graph — Chromatic's TurboSnap (which cannot scope a build around anything reachable from `<Root>`, so a barrel there costs a full 1000-snapshot rebuild), consumers' tree-shaking, and module init order around `Root`'s module-scope `configure()`. Lint enforces it: `repo/no-barrel-import` rejects a relative import that resolves to an `index.ts`, and `import/no-cycle` rejects an import cycle. `import type` is exempt, a story may import a component's own entry for its compound API (`Button.Group`), and `index.ts` files and specs are exempt. `node scripts/chromatic-report.mjs --trace <file>` prices a change before you make it. Full rules: [coding.md](docs/rules/coding.md#imports).

## React Compiler: Skip Manual Memoization

The build compiles runtime source with React Compiler 1.0.0 targeting React 19, using the native `react/compiler-runtime`. Consumers require React and React DOM 19.3 or newer. Write plain derived values and ordinary handlers; use local `useEffectEvent` callbacks for effect-owned work and retain `useEvent` only for a demonstrated retained-reference contract. Manual memoization does not own a permanent per-mount lifetime. Follow the canonical [React Compiler and callback rules](docs/rules/react-compiler.md).

Run `pnpm diagnostics:compiler` and `pnpm diagnostics:hooks --check` after touching runtime source. Both ratchets reject regressions; every module adopting Effect Events also passes strict official hook/dependency rules without inline suppressions. Ratchet only verified improvements and review the baseline diff. Keep compiled and uncompiled behavior correct; preserve legacy Form opt-outs.

## Styling: Keep Components Customizable

A consumer customizes an element by passing `styles` (or style props) to it, and every styling fix must leave that working. So fix an element in the component that owns it, with a named state in its own `styles`, a slot style, a custom property, a prop or a mod. Never fix it from a parent: no sub-element selector aimed at an element the parent does not render, no blanket reset on another component's children, no selector built to outrank another component's rule. **Never start a `:has()` with `~`**: jsdom before 27 throws on it, and consumers still run one. Read [the full rule](docs/rules/coding.md#styling-keep-components-customizable) before you change a component's styles.

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

The everyday commands. The others, from Chromatic and bundle size to the diagnostics and consumer checks, are in [commands.md](docs/rules/commands.md).

- `pnpm storybook` — start Storybook on port 6060
- `pnpm build` — build library (`tsdown`, unbundled ESM)
- `pnpm test` — run all tests (Vitest); add `-- ComponentName` to filter, `-u` to update snapshots
- `pnpm test:once` — the full `pnpm test` (no test arguments), skipped when this exact tree is the last one that passed it in this worktree: a clean working tree (no changes, no untracked files, no tracked file written during that run) with the same Node, install and test environment (`KEYED_ENV` in the script; a test that reads another environment variable adds it there). It never selects tests by changed files. See [`scripts/test-once.mjs`](scripts/test-once.mjs)
- `pnpm probe` — print the HTML, CSS or tokens a snippet actually produces, with the real config loaded. `pnpm probe:browser` for computed values, geometry and screenshots; `render --sr` for what a screen reader says. See [Inspecting Rendered HTML & CSS](#inspecting-rendered-html--css--pnpm-probe) and [Hearing What a Screen Reader Says](#hearing-what-a-screen-reader-says)
- `pnpm fix` — lint + format (Oxlint + Prettier)
- `pnpm audit-docs` — audit component API ↔ docs ↔ argTypes sync. Options: `--component=Name`, `--fix-stories`, `--fix-docs`, `--json`, `--verbose`, `--all-props`. **Run after changing a component's API or adding a new component.**
- `pnpm audit-defaults` — regenerate the lint plugin's defaults registry (`src/eslint-plugin/defaults.generated.ts`). **Run whenever you change a default prop value.** `pnpm test` fails until the registry matches what the components actually render — see [eslint-plugin.md](docs/rules/eslint-plugin.md).
- `pnpm generate:tasty-config` — regenerate `tasty.config.generated.ts`: the tokens, state aliases, presets and recipes the published `tasty.config.ts` lists for consumers' lint. **Run whenever you add, rename or remove one.** `pnpm test` fails until the file matches the runtime — see [coding.md](docs/rules/coding.md#tasty-lint-rules).

## Tasty and Glaze Documentation

The docs of the installed Tasty and Glaze come through harnesspm, as they do for consumers. Their indexes are in the harnesspm block at the end of this file, and `pnpm install` rewrites them for the pinned versions.

- **Tasty:** [`llms.txt`](node_modules/.harnesspm/pkgs/@tenphi/tasty/docs/llms.txt). Read "Tasty Style Rules for AI Agents" before you write or review styles, then the guides and references the task needs. UI Kit ships neither build-time extraction nor SSR.
- **Glaze:** [`llms.txt`](node_modules/.harnesspm/docs/glaze/llms.txt). Read it when you work on color tokens, theme generation or contrast tuning: Glaze powers `src/tokens/palette.ts`. Start with "Designing a palette" and "Light, dark, and high contrast".

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

<!-- BEGIN:harnesspm — generated by `harnesspm sync`. Do not edit. To change a rule, run `npx harnesspm why <ID>`. -->

## @tenphi/eslint-plugin-tasty 1.19.1

### Linting Tasty styles (tasty-lint:rules/usage)

#### After you change styles

- Lint the changed files and fix every `tasty/*` problem.
- `tasty-lint:check <files>` runs only the Tasty rules.
- Each `tasty/<rule>` has a page in the `tasty-lint` docs index.

#### Exceptions

- Disable a rule for one line only, with a reason: `// oxlint-disable-next-line tasty/<rule> -- <reason>`. See "Tasty lint rules" in `docs/rules/coding.md`.

- Docs: node_modules/.harnesspm/docs/tasty-lint/llms.txt (tasty-lint:docs)
- Script: `npx harnesspm run tasty-lint:check` — Lint files or folders with only the tasty/* rules, as the project's Oxlint or ESLint config sets them (else the recommended preset, or --strict), and print each problem with its rule's page (tasty-lint:scripts/check)

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

## @tenphi/harnesspm 0.4.0

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
