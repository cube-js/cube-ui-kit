# UI Kit review

Use these rules for reviews of `@cube-dev/ui-kit` changes. They adapt Cloud's shared UI review patterns to a library that implements controls, owns its styling and requires React 19.3 or newer. Local reviewers use the same checklist through the `ui-review` skill; this file does not install an automated GitHub reviewer.

## Scope

Review the requested files or diff. By default, inspect staged, unstaged and relevant untracked changes; if the tree is clean, compare `origin/main...HEAD`. State the scope and base used. Read changed hunks with their owners and callers, but report violations in changed code rather than demanding migrations of untouched code.

Read [AGENTS.md](../../AGENTS.md) and the applicable authoring rules it links. They remain the source of truth; the checks below point to failure modes, not a second API manual. Include locale-only, documentation, story, type-fixture and tooling diffs when they affect a contract. Generated files and snapshots are evidence to check against their source, not hand-written implementation to lint.

Library internals legitimately render native elements, integrate React Aria, implement tooltip providers and expose low-level state primitives. Cloud's app conventions about `Tabs`, `Layout.Panel`, member icons, query layers, navigation, hit-area thresholds or translation bindings do not become UI Kit requirements. Stories, docs and tests may intentionally demonstrate legacy APIs, invalid states and literal fixture text.

## Verify candidates before reporting

Actively try to disprove each candidate. Check surrounding branches, provider defaults and supported overrides. Distinguish an API defect from a convention, and a compiler bailout from a behavior bug. Name a concrete failure or an applicable repository rule; visual preference alone is not a finding.

- **APIs:** inspect the working copy's component source, `.docs.mdx`, declarations and defining exports. The probe aliases `@cube-dev/ui-kit` to `src`; it does not typecheck snippets. For public types, inspect emitted declarations and the built-consumer fixtures too. If dependencies are missing or stale, follow [Before You Start](../../AGENTS.md#before-you-start); do not guess from another checkout or package version.
- **Reuse:** search definitions, behavior and callers across `src`, including ordinary utilities and private hooks rather than only barrels. Read both implementations before recommending consolidation. Keep distinct contracts separate; if the new helper corrects a bug, preserve that correction in the shared implementation and identify callers to migrate.
- **Styles:** read the relevant [Tasty docs](../../AGENTS.md#tasty-documentation), then use [the probe](probe.md). `pnpm probe styles '{"gap":"2x"}'` checks generated CSS with Root's config loaded. A bare `renderStyles` import misses that config. Use `pnpm probe:browser render` for computed values, geometry, truncation, pointer behavior or screenshots; jsdom cannot establish those claims. Match viewport, state, font and scheme when comparing renders.
- **Colors:** inspect [Usage](../../src/stories/Usage.docs.mdx#color-tokens), `src/tokens/palette.ts` and the installed [Glaze methodology](../glaze/methodology.md). Resolve aliases rather than treating references as literal colors. Check light/dark and both high-contrast variants when changing palette behavior; `pnpm probe tokens --scheme dark --hc` and browser renders can verify the affected pair.
- **Forms and timing:** trace event ordering, cleanup and the selected backend. Follow [input rules](input-components.md) and [modern Form migration](../modern-form-migration.md) rather than applying legacy contracts to controllers. Use relevant existing behavior tests when needed to establish a candidate. Documentation-only reviews do not require component tests.

Attach verification limits to each affected finding. Say what code proves and what a probe or test established; if runtime behavior was inferred only, label it `not verified — read-only`. Drop candidates whose premise cannot be established. Do not turn a missing tool or failing environment into a component bug.

## Entropy review

Include the [Entropy review](entropy.md#entropy-review) in every UI Kit review, covering the changed implementation, public APIs, consumer usage and applicable UX. Report its entropy change level with the affected context and a brief rationale. Follow its proportionality test and developer exception procedure, including accepted deferrals backed by concrete follow-up tasks. Flag API changes without a demonstrated benefit even when ongoing entropy is Neutral. Keep findings tied to a concrete maintenance or user burden and a verified improvement, which may be retaining the existing contract; do not require unrelated cleanup or treat visual preference as a violation. A focused pass is available through the local `entropy-review` skill.

## Components and public APIs

### Reuse an implementation whose contract fits

Flag new components, hooks or helpers that duplicate an existing implementation with the same contract. Name and verify the replacement. Native markup needed to implement a control, and helpers with different contracts, are valid.

### Preserve consumer customization

Flag parent selectors, blanket child resets or specificity escalation that defeat a child's consumer `styles`. Fix the owning element with named states, slot styles, props or tokens. Verify that an ordinary consumer override still applies. See [Styling](../../AGENTS.md#styling-keep-components-customizable).

### Keep style state names inside the style definition

Flag JS-built state keys such as `[IN_DIALOG]` that hide a reusable condition from consumers. Declare a named local state in `styles`; use Root's predefined states for shared conditions. See [Styling](../../AGENTS.md#styling-keep-components-customizable).

### Use props and slots where they preserve the contract

Flag duplicated labels, icons, validation chrome or action markup when an existing prop, slot or helper already fits. Check layout and ARIA wiring before replacing it. Component internals still need markup to implement those APIs.

### Verify defaults in their provider context

Flag explicit default values only when removing them preserves behavior, including inherited defaults and branches. A context override is not redundant. Changed component defaults need a regenerated defaults registry; see [the plugin rules](eslint-plugin.md).

### Import defining files inside the library

Flag new internal barrel imports that widen the dependency graph; import the defining file. Public `index.ts` files may assemble barrels. Check Root's dependency tree when it changes; see [Imports](coding.md#imports).

### Check the public types consumers receive

Flag unchecked or broken public props, missing exports or form-instance/DOM-form conflicts. Adobe's consolidated `Aria*Props` are checked in-repo; also inspect built declarations and consumer fixtures for public contract regressions. Follow [TypeScript & Exports](../../AGENTS.md#typescript--exports).

## Layout and color

### Remove wrappers only after checking their role

Flag a wrapper that adds no layout, semantics or provider boundary. Verify scrolling, containment, grid placement and the replacement's box before removing it. Having one child does not make a wrapper redundant.

### Keep reusable style definitions static

Flag recreated style objects or conditional spreads that compile fresh rules for reusable styling. Hoist definitions and express state with mods or variants. Supported consumer overrides and cached adaptive maps remain valid; see [Tasty methodology](../tasty/methodology.md).

### Use tokens for continuously changing values

Flag changing dimensions or animation values compiled into new style rules. Use `tokens` or `tokenProps` for runtime values. Plain `style` remains valid at an external-library boundary; see [Tasty methodology](../tasty/methodology.md).

### Use design-system styling where it fits

Flag literal colors, spacing, radii or hand-written typography where a token or preset expresses the intended role. Palette definitions, CSS keywords and documented literal modes are valid. Verify current names in [Usage](../../src/stories/Usage.docs.mdx).

### Preserve layout when simplifying styles

Flag rewrites that lose flex grow/shrink/basis, box sizing or container-owned spacing. Tasty's block `gap` uses child margins, while flex/grid use CSS gap. Verify generated CSS and the actual box; percentages and raw implementation dimensions are not inherently wrong.

### Pair foregrounds with their surface across schemes

Flag adaptive content on fixed fills, accent-fill tokens used as adaptive text or text-colored shadows that glow in dark. Select the foreground and shadow tokens for the surface's role, and verify the pair across schemes. See [color verification](#verify-candidates-before-reporting).

### Preserve supported consumer selector behavior

Flag new selectors that break supported consumers, even when this repo's newer jsdom accepts them. In particular, avoid `:has(~ X)`, which throws in Cloud's jsdom 26. Use a supported selector or mod; see [Styling](../../AGENTS.md#styling-keep-components-customizable).

## Interaction and state

### Preserve control semantics and accessible wiring

Flag lost accessible names, ref/prop forwarding, keyboard activation, disabled behavior or focus restoration. Verify the actual target and React Aria integration. Native `onClick` and raw DOM elements are valid implementation tools; they do not support `onPress`.

### Follow each collection's selection contract

Flag disabled or selected items that bypass their collection's supported API, or `items` combined with unsupported children. Verify the particular collection; per-item disabled state is not universally wrong. Arbitrary app data must not leak through item props to the DOM.

### Keep callbacks current for the work they trigger

Follow the [React Compiler and callback rules](react-compiler.md). Use plain handlers by default, local Effect Events for effect-owned callbacks, and `useEvent` only for a verified retained-reference contract. Preserve reactive resource dependencies, complete manual memo dependencies, lifecycle ownership, both execution modes, and the diagnostics ratchets. Reject suppressed Effect Event misuse and claims of speedups without measurements.

### Prevent stale async work from overwriting current state

Flag requests, validation or submission whose older result can replace current state after newer work, reset or unmount. Use cancellation or ordering guards. Check existing API guarantees before demanding a second guard.

### Preserve identity where it is part of the contract

Flag performance-only manual memoization in compiled functions. Preserve callback refs, effect dependencies, subscriptions, per-mount values, context values and imperative APIs where stable identity is required. Do not strip memos from existing bailouts; see [React Compiler](../../AGENTS.md#react-compiler-skip-manual-memoization).

### Keep compiler coverage honest

Flag new diagnostics, reduced coverage or baseline updates that merely bless a regression. Review `use no memo` opt-outs against mutable render contracts. The release is compiled, ordinary unit tests are not; see [the compiler guide](../../scripts/compiler/README.md).

## Fields and forms

### Wire form inputs through one entrypoint

Flag form inputs that duplicate provider merging, ids, validation normalization or field registration outside `useFieldProps`. Presentational bases and search controls have their own pipelines and must not gain form registration. Follow [input rules](input-components.md).

### Keep field chrome and DOM props in their owners

Flag duplicate validation icons, missing `wrapWithField` wiring, stale label/control ids or a form instance passed as a DOM `form` attribute. Preserve the shared hook's legacy and modern handling rather than removing the supported input `form` prop. See [input rules](input-components.md).

### Preserve the selected form backend

Flag implicit legacy-to-modern migrations, controller casts through legacy wrappers or backend changes on a mounted root. Modern Form is opt-in per form; `Form.Item` stays legacy-only. Preserve existing compatibility contracts; see [migration](../modern-form-migration.md).

### Subscribe to modern form state during render

Flag controller getters or mutable legacy flags used as reactive modern render state. Use `useValue`, `useFieldState`, selectors or `Subscribe`. Register inputs and update their options after commit; see [input rules](input-components.md).

### Declare validator dependencies by their meaning

Flag external captures missing `deps`, or sibling-path revalidation missing `dependsOn`. Reads cancel stale work but do not schedule dependencies; `rulesKey` is optional manual versioning. Do not restart equivalent inline rules; see [migration](../modern-form-migration.md).

### Verify reset, defaults and submission together

Flag changed form behavior that loses drafts, defaults, active-field payloads or cancellation. Check both backends where shared code changes. Form action helpers own submit/reset state unless an independent condition is needed; see [migration](../modern-form-migration.md).

## Translation, stories and maintenance

### Translate text rendered by components

Flag component-owned visible text, accessible labels and announcements that bypass `useI18n`. Keep caller label overrides and inline English fallbacks. Stories, docs, tests, test ids and logs use literals; see [i18n](../../src/i18n/README.md).

### Keep all shipped locale bundles in sync

Flag added or changed source keys without real translations and matching interpolation tokens in all shipped locales. Parity checks do not prove translation quality; identical English is only a candidate. Check valid shared terms and glossary exceptions before reporting.

### Keep localization isolated per server request

Flag server request code that changes the process-wide default i18n language. Use `createUIKitI18n` and pass the request-local instance to Root. Browser language switching is valid; see [i18n](../../src/i18n/README.md).

### Capture the state a story claims to show

Flag stories for hover, focus or open overlays that never reach that state before the snapshot. Use `play` ending on an awaited state assertion. Follow the tooltip timing and modality recipe in [storybook rules](storybook.md#interaction-only-states-need-a-play-function).

### Spend snapshots on distinct visible states

Flag redundant photographs, not useful API demos. Verify the rendered states before recommending `NO_SNAPSHOT`; keep a reason beside it. Prefer a readable variant matrix where it fits, and check TurboSnap impact; see [the budget](storybook.md#the-snapshot-budget).

### Keep documentation aligned with the public contract

Flag changed APIs, defaults, style slots or components without matching docs, stories, argTypes and exports. JSX examples are required in component docs. Run `audit-docs` for API changes; design-system changes also update Usage/CreateComponent. See [documentation](documentation.md).

### Use regression checks that can observe the failure

Flag behavior fixes without a regression check capable of failing before the fix. Use jsdom for ordinary interactions, browser tests for geometry/pointer-only behavior and built-consumer fixtures for public types. Probes answer one-off questions; docs-only changes need no component tests.

### Ship consumer changes with a changeset

Flag consumer-facing runtime or public API changes without a changeset. Docs-only, tests-only, Storybook-only and internal tooling changes are exempt, as are issues introduced and fixed within the same PR. See [Changesets](../../AGENTS.md#changesets).

## Return findings

Return findings in the current conversation, most severe first, with file and line, rule heading, concrete problem and the smallest fix. Distinguish blocking behavior/API defects from maintenance findings. Do not edit files, post comments, file issues or change baselines during a review unless the user explicitly requests that separate action.

Always include the brief entropy change assessment for the affected context. If nothing is found, say so and mention only material verification limits and material developer-accepted entropy exceptions with their scope, acceptance reference and required follow-up tasks. Omit lists of passed checks or refuted candidates. Clear defects outside this checklist still belong in the review; unsupported stylistic preferences do not.
