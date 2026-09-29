# design-sync notes — @cube-dev/ui-kit

Working notes for `/design-sync`. Read this before doing anything; it is the only memory a future sync has.

## Repo facts

- **Shape:** storybook. Config dir `.storybook/` at repo root; stories glob is `src/**/*.stories.@(js|jsx|ts|tsx)` plus `src/**/*.docs.mdx`.
- **Package manager:** pnpm (`pnpm@10.34.5`, `pnpm-lock.yaml`). Install with `pnpm install --frozen-lockfile`. Node pinned by `.nvmrc` (24.19; 24.18 works).
- **Build:** `pnpm build` (tsdown) → `dist/`. Takes ~30s.
- **`--entry` is required.** This is the package's own source repo, so `node_modules/@cube-dev/ui-kit` does not exist; the converter needs `--entry dist/index.js` (recorded as `cfg.entry`).
- **`--node-modules`** is the repo root `node_modules` (react/react-dom live there).
- **Provider:** `Root`, mounted with `fontDisplay="auto"`. It carries tokens, color scheme, i18n, and the portal/overlay/event-bus contexts — without it styles resolve to nothing and any overlay component throws. Set explicitly as `cfg.provider` (not left to decorator bundling) because the README and every `.prompt.md` generate their wrap guidance from config only.
- **Styling is tasty (CSS-in-JS, runtime-injected).** There is no class vocabulary and `_ds_bundle.css` is an intentional stub — that is correct, not a `[CSS_*]` failure to chase.
- **`STORYBOOK_MODE`** (set by the repo's own `build-storybook` script) only substitutes a favicon filename. Irrelevant to the sync; use `npx storybook build -c .storybook -o <repo-root>/.design-sync/sb-reference` per the skill, not the repo script.

## 2026-09-28 — config reconstructed from build artifacts

The previous sync (at `@cube-dev/ui-kit@0.173.0`) left its **working state** (`ds-bundle/`, `.design-sync/.cache/compare/` with 90 graded components, `sb-reference/`) but its **durable state was never committed** — no `config.json`, no `NOTES.md`, no `conventions.md`, and nothing under `.design-sync/` was tracked in git. The project it uploaded to was therefore unrecoverable from the repo.

`config.json` was rebuilt by reading what that build had stamped into its own output. Provenance, so a future run can judge each field:

| Field | Recovered from | Confidence |
| --- | --- | --- |
| `globalName: CubeUIKit`, `shape: storybook` | `ds-bundle/.ds-build-meta.json` | certain |
| `provider: Root {fontDisplay:"auto"}` | the literal `mount()` call in every emitted card html | certain |
| `overrides.*.cardMode` / `primaryStory` | `var MODE=` / `var PRIMARY=` in each card html | certain |
| `overrides.*.viewport` | `@dsCard viewport=` on cards whose value differs from the 900x700 default | inferred — a card at exactly 900x700 cannot be told apart from an unset default, so a deliberate 900x700 override would have been lost |
| no `skip` overrides | `skippedStoryIds: []` in `.ds-build-meta.json` | certain |
| `titleMap` | **not recoverable** — nothing in the output records it | unknown; watch for `[TITLE_UNMAPPED]` and a component count below 90 |

**Lesson worth keeping:** the durable set is the whole point of the sync's repo footprint. `.gitignore` now carries explicit rules (added this run) that ignore `sb-reference/`, `learnings/`, `.cache/`, `.ds-sync/`, `ds-bundle/` while leaving `config.json`, `NOTES.md`, `conventions.md`, `previews/` and `overrides/` visible. Commit them.

`conventions.md` was recovered verbatim from the prior build's `ds-bundle/README.md` (lines 1–102 — everything above the generated `# CubeUIKit (...)` body). It is the prior author's content; validate its names against each fresh build rather than rewriting it.

## ⚠ REQUIRED MANUAL PATCH after staging scripts: the compare clock

**Re-apply this every run, right after the `cp -r` that stages `.ds-sync/`.** `.ds-sync/` is gitignored and re-copied from the skill each run, so this fix evaporates and there is no config knob for it (`compare.mjs` accepts only `--force`).

**The bug:** the two compare panels disagreed on "today" by 4.5 years.

- `.ds-sync/storybook/compare.mjs` pins playwright's clock to `2030-01-15T12:00:00Z`.
- This repo's `.storybook/preview-head.html` installs its own `pinClock()` **Proxy over `window.Date`** pinned to `2025-06-15T12:00:00Z` (deliberate — for chromatic determinism on calendar stories). It runs AFTER playwright's init script and **wins** on the storybook panel.
- The preview card has no pin, so it keeps playwright's time.

Probed directly, not inferred: SB `2025-06-15T12:00:00.000Z`, DS `2030-01-15T12:00:00.000Z`. Any story rendering _today_ therefore differs by a whole month grid — which reads exactly like a component regression and would produce **false mismatches** on `Calendar`, `DatePicker`, `DateRangePicker`, `DateRangeSeparatedPicker`, `PeriodPicker`, `TimeInput`, and any relative timestamp.

**The fix** (applied this run): change that `setFixedTime` value to `2025-06-15T12:00:00Z` so it matches the repo's own pin. This restores the harness's own stated intent — its comment says the point is "same date rendered on both sides".

**Safe for grades:** `gradeKey` derives from `sourceKey` (config slices + stories + srcSha), NOT from the script hash, so editing `compare.mjs` does not clear grades. It does change `scriptsSha`, which the driver surfaces as pipeline churn → a `verification.canary` `[SPOT_CHECK]` with grades kept. That is expected, not a failure.

**Worth reporting upstream** — a `--fixed-time` flag, or reading the repo's pin, would remove the need for a manual patch.

## Operational: the converter build takes ~11 minutes

`package-build.mjs` on this repo runs **~11 minutes**, and the preview-compile phase (after `previews: 91 generated`) is **silent for most of it** — no log output, the node process sleeping at ~1% CPU while esbuild works. This looks exactly like a deadlock and is not one. This run killed two builds at ~10:28 elapsed on that misreading, seconds from completion. **Let it run.** Budget ~11 min, and don't use `--skip-dts` to "prove" it isn't hung — that barely changes the wall clock here.

## Fixes applied 2026-09-28 (at 0.185.1)

- **[GENERAL] Duplicate React context broke 3 previews.** `CommandMenu`, `AlertDialog` and `Notification` failed with `useEventBus must be used within an EventBusProvider` / `You can't use DialogApi outside of <Root />` / `useNotificationContext must be used within an OverlayProvider`. Root is NOT at fault — it renders every one of those providers unconditionally. The cause is import-policy rule 3: those stories import component-private context modules by _relative_ path, which bundles a second copy from source with its own context identity, which the shipped `Root` never provides. Fixed with `cfg.storyImports.shim` on the three module paths. The precondition that makes a shim valid (vs. needing `extraEntries`) is that every name involved is a real bundle export — verified: `useAlertDialogAPI`, `useEventBus`/`EventBusProvider`, and all 8 names the Notifications story pulls from its barrel. Verified fixed by scoped compare: 3 captured, **0 factual failures**.
- **`ButtonSplit` was missing from the sync entirely.** Two separate causes, in sequence. (1) The lost `titleMap` left storybook title `Button.Split` unmapped, so it was dropped — that's what `[TITLE_UNMAPPED]` meant. (2) After mapping it to the `ButtonSplit` export, the subcomponent heuristic folded it under `Button` (it's a `Button.Split` compound member), which absorbed the export but **not its 6 stories** — they rendered nowhere, and Button's card still showed only its own 20 stories. Fixed by pinning `cfg.componentSrcMap.ButtonSplit` (a non-null pin forces root treatment). **Check this after any converter upgrade**: the symptom is silent — no warning fires, the component just vanishes from the roster.
- **`cfg.docsMap`** added for `Block`, `Content`, `Paragraph`, `Portal`, `Text` — their `.docs.mdx` files exist but discovery missed them, cutting `[DOCS_UNMAPPED]` from 12 to 7. This matters: `.prompt.md` is the design agent's usage reference.

## Network assets: only the Inter webfont

No story in this DS loads a remote image — a scan of every `*.stories.tsx` finds only link `href`s (docs.cube.dev, example.com, …), no remote `.png/.jpg/.svg`. The **only** network asset is the Inter webfont, pulled by the `@import` in `styles.css`. So the `[ASSETS_BLOCKED]` false-pass trap (sandboxed shell blanks assets on _both_ compare panels, so grades pass while users see different output) effectively cannot bite here — but still confirm fonts.googleapis.com is reachable before grading (it returned 200 on 2026-09-28). A blocked font would silently degrade every card.

## GRADING TRAP: the two panels frame differently by construction

**Read this before grading anything.** The storybook reference shot is cropped to the **story root's content bounding box**; the preview shot is always the full **900x700** capture viewport. Measured on this repo:

| story                            | reference  | preview |
| -------------------------------- | ---------- | ------- |
| `Button / Default` (one button)  | 868x32     | 900x700 |
| `Button / Default States` (grid) | 868x612    | 900x700 |
| `Dialog / *` (bare trigger)      | **114x64** | 900x700 |

So a component whose story renders one small element produces a _tiny_ left panel next to a mostly-empty right panel. **That is not a mismatch** — the rubric excludes framing ("judge the component, not its surroundings"). A 114x64 reference beside a 900x700 preview showing the same button is `match`.

Corollary for overlay components (`Dialog`, `Tooltip`, `AlertDialog`, `DialogTrigger`, `Toast`, …): their stories render only a **closed-state trigger** unless the story drives the interaction. Both panels showing just the trigger is correct and complete — do not grade it `mismatch` for "the dialog is missing", and never edit a story's open state to force one visible.

## [GENERAL] `play` functions: reference shows post-interaction state

**The single biggest grading hazard in this repo.** Play functions are widespread — the exact roster depends on grepping correctly, see below.

> **DETECT THEM WITH `grep -nE '\.play\s*=|play\s*:'` — nothing less.** A bare `play:` grep is wrong in BOTH directions and produced two false flags in this run's own fan-out briefs (`Item`, `FieldWrapper`):
>
> - it **misses** `Export.play = async …`, which is how many of this repo's play functions are written (both date pickers grep to `play: 0` and each has one);
> - it **false-positives** on `display:` and other `*play:` keys.
>
> Treat any earlier count in this file taken with the bare pattern as unreliable, and re-grep per component before claiming it is play-bearing.

Storybook **runs** play functions before the reference screenshot; compiled previews **never** do. So wherever a play function leaves visible state behind, the reference shows the post-interaction render and the preview shows the initial one.

**Signature:** reference has filled inputs / an open menu / an error alert / an expanded node; preview shows the same component in its pristine state. Everything else (fonts, colors, spacing, variants) matches.

**Worked example** — `Form / With Validation Error`: play types `user@example.com` + a password, clicks Sign In, and the story's `onSubmit` rejects, so the reference shows a `SubmitError` alert and an enabled Reset. The preview shows empty fields and no alert. Graded `mismatch`; it cannot be fixed with props because the error is _produced by submitting_.

**IMPORTANT REFINEMENT — a play story is only hazardous when its state lands INSIDE the story root.** The reference crop is the story root's bounding box, so play-driven state rendered into a **portal** (`document.body`) is outside that crop and never reaches the reference at all. Worked example: `TextItem / Overflow With Tooltip` has a play that hovers to open an auto-overflow tooltip, yet its reference is `868x20` — one line of text, no tooltip — because the tooltip portals to body. Both panels agree and it grades an honest `match`, no skip needed.

So: **check WHERE the state renders before assuming a play story is un-gradeable.** Inside the root (filled inputs, expanded nodes, inline error alerts, open inline editors) → hazardous. Portaled (tooltips, popovers, toasts, menus in portals) → usually harmless. Do not blanket-skip every play story.

> **EXCEPTION — a portaled popover can still leak into the reference crop if it OVERLAPS the story root.** "Portaled" is only safe while the portal sits clear of the root's box. `FilterPicker / Multiple Selection` (layout `centered`) flips its popover _upward_ over the trigger's own label, so the story root's bounding box grows from `154x56` closed to `178x76` open and the reference shows the popover's bottom row where the label should be. `Single Selection` leaks 16px the same way.
>
> **Diagnostic:** for a play-driven open, compare trimmed bbox closed-vs-open. An ~+16/+20px growth on **both** axes means the portal overlapped the root — genuine play-state `close`, not an honest match.

> **A briefed play roster is a HYPOTHESIS, not a fact — verify per file.** This run's orchestrator briefs were wrong at least five times (`Item`, `FieldWrapper`, `CommandTextArea`, `DisplayTransition`, `IconSwitch`). Loose substring greps for `play` match ordinary identifiers: `IconSwitch` has a `PlayPause` export, an `isPlaying` state var, a `PlayIcon` import and the strings `'Play'`/`'Playing'`; `Portal` has a `Playground` export; `DisplayTransition` matches only on `display:`. Always confirm with `grep -nE '\.play\s*=|play\s*:'` against the actual file before acting on a play claim.

**How to handle one (read before grading a play-driven story):**

1. Ask whether the post-play state IS the point of the story. If the story exists only to prove an interaction (assert-only tests, error-after-submit), it cannot render statically → it needs `cfg.overrides.<Name>.skip`.
2. If the initial render is itself a legitimate variant, grade the **initial render** on its own and note the gating — same spirit as the rubric's "when the REFERENCE side is the artifact" clause. A preview is not wrong for declining to fake an interaction.
3. **Subagents must NOT apply skips** — `skip` is a config edit, and config is orchestrator-only. Report the story id in your learnings file; the orchestrator batches all skips into ONE rebuild.
4. Never "fix" this by neutralizing the story or faking the end state in an owned preview — that destroys the fidelity being verified.

## `[REFERENCE_STALE?]` on this run is a FALSE ALARM (verified)

Every scoped `compare.mjs` run prints `! [REFERENCE_STALE?] the bundle changed but .design-sync/sb-reference did not`. **Ignore it for this run** — proven, not assumed:

- `.design-sync/sb-reference/iframe.html` built **2026-09-28 12:30:00**
- newest file anywhere in `src/` is **2026-09-28 12:26:01**
- `find src -newer .design-sync/sb-reference/iframe.html` → **empty**
- `git status src/` → **clean**

The reference was built from exactly the source the bundle is built from. What moved the bundle hash was _config_ (`storyImports.shim`, `componentSrcMap`), and the heuristic cannot tell a config-driven bundle change from a source-driven one. Grades taken against this reference are valid.

**When it would be real:** if anyone edits `src/` or pulls, rebuild the reference before grading (`npx storybook build -c .storybook -o "$(git rev-parse --show-toplevel)/.design-sync/sb-reference"`, ~2 min) — a genuinely stale reference silently grades every component against the OLD design. Re-run the freshness check above rather than trusting this note.

## Pending config decisions (orchestrator)

- **`Form / With Validation Error`** → needs `cfg.overrides.Form.skip` (`forms-form--with-validation-error`): play-driven submit error, cannot render statically. See the `play` section above.
- **`Badge` story cap** — 8 stories, capped at 6; `content-badge--with-right-icon` and `content-badge--with-both-icons` ship verified-by-upload without an individual grade. Low risk (icon-slot variants of an already-matching story). Raise with `--max-stories 8` if worth proving.
- **`Layout / PanelAsDialog`** (`content-layout--panel-as-dialog`) → would need a skip, but **only if the Layout story cap is ever raised**. Layout has 37 stories, the run caps at 6, so story #26 was never captured. It is the only `play:` in that file and the only panel story starting closed (play clicks "Open Panel Dialog"). Pair `--max-stories 37` with the skip, or leave both.
- **`InlineInput`** → needs `cfg.overrides.InlineInput.skip` on exactly `content-inlineinput--single-click-trigger` and `content-inlineinput--manual-trigger`. Both are play-gated: play opens edit mode and the story source says so outright (`// Edit mode is the whole difference from Default`; `editTrigger: 'none'` means only the imperative `startEditing()` opens it). Keep its existing `cardMode: "single"` / `primaryStory: "Default"` — `Default` grades match. NB `Controlled Editing` looks like the same family but has NO play function and genuinely matches.
- **`CopySnippet` story cap** — the ungraded tail (`Javascript Syntax`, `Html Syntax`, `DAX`, `Complex`) is the ONLY place _language-specific_ syntax highlighting is exercised; the captured six prove only operator-level colouring. Best candidate in the repo for `--max-stories`.
- **`Menu`** → needs `cfg.overrides.Menu.skip: ["actions-menu--inside-modal"]`. Play clicks the kebab and asserts the list mounts, so the open menu IS the story; it also hits the `translateZ(0)` overlay-collapse bug above.
- **`TextItem / Tooltip Placements`** (`content-textitem--tooltip-placements`) → would need a skip, but only **if the TextItem cap is raised to 12**. It is story #9, currently in the ungraded tail. Play opens a tooltip with no static equivalent. Same shape as `Layout / PanelAsDialog`.
- **`DateRangePicker`** → add `skip: ["forms-daterangepicker--with-default-value-open"]` (keep its existing `cardMode: "column"`). Play clicks the trigger; the calendar popover portals OUTSIDE the story root so it is missing from the **reference** too (sb crop 868x32, same as closed). Without the play the story is a byte-identical duplicate of `With Default Value`, shipping under a name that promises an open calendar.
- **`DateRangeSeparatedPicker`** → same: `skip: ["forms-daterangeseparatedpicker--with-default-value-open"]`. The story's own source comment says as much.
- **`FileInput`** → `skip: ["forms-fileinput--long-file-name-overflow", "forms-fileinput--extract-text"]`. The truncated filename needs a real `File` in the input's `FileList` and cannot be produced from props; `Extract Text` already carries `NO_SNAPSHOT` upstream.
- **`DataTable`** → `skip: ["data-datatable--tree-rows"]` and **`ItemTable`** → `skip: ["data-itemtable--tree-rows"]`. Same trap in both: play clicks the disclosure to expand a tree row, and neither story declares a `defaultExpandedKeys`-style arg, so expansion exists only as post-interaction state. Keep both components' existing `cardMode: "single"` / `primaryStory: "Default"` and `ItemTable`'s `viewport: 900x1050`.
- **`TagInput`** → `skip: ["forms-taginput--with-suggestions", "forms-taginput--custom-values", "forms-taginput--rejected-entry"]`. Play-committed tags are state INSIDE the story root.
- **`TextInputMapper`** → `skip: ["forms-textinputmapper--with-value-and-new-mapping"]`.
- **DECIDED: no skip for `FilterPicker`** (`single-selection`, `multiple-selection`). They grade play-`close`, but unlike the `DateRangePicker` precedent they are NOT duplicates of another story — they are the canonical single-vs-multiple variants and their closed-trigger render is correct and useful. Skipping would drop both from the design system to buy two cosmetic grade upgrades.
- **DECIDED: no skip for `RenderCache`** (`helpers-rendercache--default`). It is the component's ONLY story, so a skip deletes `RenderCache` from the roster entirely. Graded `close`: the preview's pristine render is honest and nothing is missing or restyled (unlike `Form / With Validation Error`, where a whole alert was absent).
- **`Content` viewport is TRUNCATING — real bug, fix it.** `cfg.overrides.Content.viewport` `"900x2000"` → **`"900x2600"`** (the reference is 2546px tall; ~570px of the icon grid is silently clipped, and **no warning fires**). Keep `cardMode: "column"`.
- **`ResizablePanel`** → `skip: ["layout-resizablepanel--resize-bottom", "layout-resizablepanel--resize-top"]`, OR hold both pending the converter wrapper-height fix, which would repair them properly. The other five stories cover right/left/controlled/disabled. Check `layout-resizablepanel--in-grid-layout` (ungraded, story #7) first — it passes `size={300}` on a stretched `gridColumns` Panel and may hit the same bug.
- **DECIDED: no skip for the Dialog family** (`Dialog`, `DialogTrigger`, `DialogContainer`, `DialogForm`, `AlertDialog`). Every one of their stories is play-gated, so skipping would DELETE those components from the design system. Graded `close`; the triggers render correctly.
- Batch ALL of these into ONE rebuild — a full build is ~11 min.

### Story-cap tails: raising the cap will SURFACE work, not just verify it

Ungraded tails measured so far: `CommandMenu` 6/20, `ItemButton` 6/13, `Menu` 6/29, `Layout` 6/37, `Dialog` 6/23, `Badge` 6/8, `CopySnippet` 6/12+. Nearly every play-bearing story sits in those tails. So raising `--max-stories` would surface a **wave of new play-state mismatches** (`CommandMenu`'s `WithDialog` / `WithDialogContainer` / `WithAnchoredMenu` / `WithContextMenu`; `Menu` has 10+). Those tails currently ship verified-by-upload without an individual grade — an honest, documented gap, not an oversight. Raise the cap only with the appetite to triage what falls out.

### TECHNIQUE: trim both raws and compare geometry

The most reliable way to judge a pair when the sheet is unreadable (tiny components especially — `HotKeys` caps are 39x19):

```sh
magick <shot> -bordercolor white -border 2 -fuzz 1% -trim +repage <out>
```

Trim both raws to their content box and compare the resulting geometry. **Equal trimmed geometry is strong evidence of a match**, and the trimmed crops can then be upscaled into a side-by-side composite that is actually legible. Measured example: every `CopyPasteBlock` story trims to an identical `886x58` / `886x66` box on both sides.

**Do it as batch triage, not per-component.** Run the trim over every raw pair in ONE bash loop before opening a single image: equal-geometry rows are instant high-confidence matches, and only the `DIFF` rows need an image open. One batch reduced 28 pairs to 7 worth looking at, for ~1 tool call.

The 868-vs-900 framing delta has **two** recognisable signatures, both benign:

1. **Equal height, +32 width** (reference 868, preview 900) — the plain full-width framing artifact. Seen across all 6 `Skeleton` layouts; `Skeleton / Menu` shows it as 852 vs 884 (same 16px-per-side inset).
2. **Ellipsis moves by one word-fragment** — the narrower reference truncates a long single line earlier. `PrismDiffCode / Empty Line Diff` clips a URL at `getting-starte` where the 900px preview fits `getting-started` (868 vs 876). Also seen on `CopyPasteBlock / With Long Value`.

Both are excluded by the rubric. A width delta far from ~32px, or any height delta, is worth an image open.

**Settle it numerically when geometry is equal:**

```sh
magick compare -metric AE <sb-trimmed> <ds-trimmed> null:
```

`AE = 0` settles a pair outright as identical — 24 of 24 narrow-component pairs in one batch resolved to facts instead of judgement calls. Small AE on a large canvas is antialiasing (one batch saw `AE=2` of 28672 px).

**MANDATORY THIRD STEP — overlap-crop AE on every `+32` pair.** Equal height plus a ~32px width delta is the framing signature, but it is NOT proof of a match. Crop the preview to the reference's width and run AE on the overlap:

```sh
magick <ds-trimmed> -crop <sb_width>x<sb_height>+0+0 +repage <ds-cropped>
magick compare -metric AE <sb-trimmed> <ds-cropped> null:
```

Genuine framing-only pairs score **< 0.3%** of pixels. A real mismatch hiding behind the signature scores **~30%** — a 100x separation, so the threshold is not delicate. This converts the whole `DIFF +32` bucket from a judgement call into a number, for one extra line.

Caught by exactly this: `TextInputMapper / With Value And New Mapping` (857x72 vs 889x72, equal height, textbook framing signature) scored **AE=18582 / 30.1%**. Its play inserts a row exactly as tall as the button it replaces, so the trimmed box never moves. Unlike `DataTable / Tree Rows` this component is small and looks nothing like a fixed-height container — intuition would not have flagged it.

> **LIMITATION — trim geometry ALONE can pass a real mismatch.** A component with a fixed-height container keeps the same trimmed box whatever its contents. `DataTable / Tree Rows` trims to **420px on both sides** because the table body is fixed-height, yet the reference is expanded and the preview collapsed — a genuine mismatch that geometry called equal. So: use trim + AE as triage to find rows worth looking at, but **open the images for any component whose content can change without changing its box** (tables, fixed-height lists, scroll containers, anything play-bearing).

### Out-of-flow children get CROPPED OUT of the reference (preview shows MORE)

The mirror image of the portal case, and it makes the **preview** look wrong when it is right. An absolutely-positioned child adds **zero layout height** to the story root, so the reference's bbox crop stops short and omits it — while the preview, capturing a fixed 900x700 viewport, shows it.

Worked example: `RangeSlider / With Gradation` — the preview shows the `0 / 50 / 100` gradation labels under the track; the reference does not. Proof it is a crop artifact and not a missing render: the reference bbox is `868x20`, byte-for-byte the same height as `RangeSlider / Disabled`, which has no gradation at all. The labels contribute no layout height, so the crop never reaches them. The shared 20px track band matches on both panels.

Per the rubric's "when the REFERENCE side is the artifact" clause this is `match`, **not** `close`.

> **Diagnostic to reuse:** compare the suspect story's reference bbox height against a sibling story that lacks the feature. **Equal heights prove the feature is out-of-flow** and therefore legitimately cropped.

### A large width gap can be `layout:'centered'` + a dropped `args` spread

`layout: 'centered'` shrink-wraps the reference. It bites hardest on stories whose `render()` does NOT spread the meta-level args. `SearchComboBox` sets `args: { width: '260px' }` on the meta, so `Default` trims to an identical `260x56` on both panels — but `Custom Empty Label`, `With Trigger`, `Clears On Select` and `With Submit` use `render: () => <X …/>` with **no `{...args}` spread**, never receive that width, and so shrink-wrap to 184/214/530/536px against a 900px preview.

So a width delta of **300-700px does not mean the framing analysis failed** — check whether the story spreads `args` before treating a big gap as real. Same mechanism on `Select / Outline 2` (232 vs 900), where the `#surface-2` ground is what stretches.

### High AE with an identical histogram = subpixel text shift

Follow any high AE with a histogram + mean-RGB check before calling a delta. `Picker / Multiple Selection` reads `AE=1179 (17%)` on a byte-identical histogram — a subpixel text offset, not a rendering difference. Also: crop the right edge of both trims before declaring a trailing affordance missing (that nearly produced a false flag on `SearchComboBox / With Trigger`).

### Hover/press play leaves a COLOUR trace — step the fuzz before judging

A hover- or click-driven play tints the whole trigger, which saturates AE at low fuzz and reads as total breakage. Measured on `Tooltip`: the hovered reference trigger is `srgb(240,240,241)` vs the resting preview's `srgb(248,248,249)` — 8/255 across the entire button — giving `-fuzz 1%` → **84.6%**, `-fuzz 2%` → **28.9%**, `-fuzz 3%` → **1.05%** (the truth). **Always step fuzz to 3% (and 6%) before calling a delta on a play-hovered or play-pressed trigger.**

Corollary for bbox leaks: growth follows the popover's _placement_ and is often ONE axis, so the "+16/+20px on both axes" diagnostic is incomplete — `Tooltip / Side` grew width only (172→189), `Default` height only (32→48), `Unbreakable Content` both. Align the crop to the leak's opposite corner (`Unbreakable Content`'s trigger sits at `+17+16`; cropping at `+0+16` scored a spurious 93.7%).

### Play signature: the UNDERLAY WASH (reference goes flat grey)

A third play shape, distinct from the pressed-fill and bbox-leak cases. It hit 4 of 6 components in the Dialog family. The reference becomes a flat grey band — `srgb(179,179,179)` = 255 x 0.7, i.e. a 30%-black composite — with the trigger faint inside it, while the preview shows the same trigger crisp on white.

Two things make it deceptive: the trim geometry is **inverted** from the usual framing signature (the reference is _wider_, e.g. 868x32 vs 56-101x32, because the wash defeats the white trim), and raw overlap AE reads **100% of pixels differing**, which looks like total breakage. The bbox does **not** grow, so the overlapping-portal diagnostic does not fire either.

Settle it by inverting the composite:

```sh
magick <sb-trim> -crop <ds_w>x<ds_h>+0+0 +repage -evaluate multiply 1.4285714 y.png
magick compare -metric AE -fuzz 3% y.png <ds-trim> null:
```

All six Dialog-family stories scored **AE = 0** this way — the triggers are byte-identical and the previews are not defective.

### Two more measurement gotchas

- **Align full-width pairs at the RIGHT edge too.** The `868 sb vs 900 ds` pairs are not related by a uniform 16px inset when the component stretches — the input's own box is 868 wide in storybook and 900 in the preview, so a `+0+0` (west) overlap crop still reports thousands of differing pixels along the right edge. Re-compare at east gravity; that settled all 8 wide NumberInput / PasswordInput / HueSlider pairs as matches.
- **Identical AE across sibling stories is a false alarm, not cloned shots.** Four `TextInput` stories all scored exactly `AE=79` and four `TextArea` ones exactly `AE=119` — but the raws have six distinct md5s and sibling-vs-sibling diffs run 2-3%. In a wide, mostly-empty input strip the field chrome dominates the antialiasing count and is identical across variants. Confirm with md5 before suspecting a capture bug.

### GRADING CONSISTENCY RULE: play-driven pressed/hover fill = `close`

Set after an audit found the same phenomenon graded both ways. A story whose reference differs from the preview ONLY by a play-induced pressed/hover/open fill grades **`close`**, never `match` — the content is right but there is a real styling delta, and the preview is not defective. Applied to: `Dialog` (all 6, corrected from match), `CommandMenu / With Menu Trigger` (corrected from match), `DatePicker / With Default Value Open`, `FilterPicker / Single + Multiple Selection`, `Tooltip` (all 6), `AlertDialog`, `DialogForm`, `DialogTrigger`, `DialogContainer`.

### Verified non-issues (do not re-investigate)

- **A tiny reference PNG is usually a bbox crop, not a blank render.** `Placeholder / Static`'s reference is a 288-byte PNG — that is one flat gray bar cropped to its bounding box and maximally compressed, not a failed shot. Confirm from the raw pair before ever grading "blank".
- **Sheet scaling makes preview type look smaller.** The reference is an ~868-wide bbox crop and the preview a 900x1250 viewport, both shrunk to one sheet column — so the preview column _appears_ to use smaller type. Judge type size from the raw PNGs only. `PrismCode` looked like a font regression at sheet scale and is pixel-identical at full res.
- **`PrismCode`'s `viewport: 900x1250` override is load-bearing** — its SQL story is ~1050px tall and would clip at the 700 default.
- **`Item` has NO play functions** (`grep -c 'play:' Item.stories.tsx` → 0). An earlier fan-out brief wrongly listed it; the play functions are in the neighbouring `ItemButton` story file.
- **The copy components have no copy-feedback hazard.** None of the 12 captured `CopySnippet`/`CopyPasteBlock` stories has a `play()`, so there is no "Copied!" end-state to miss.
- **Color fidelity verified numerically — no hue regression exists.** `#7A4DBF`, `#26FCB2`, `#6D71B0`, `#888DDA`, `#23D99B` appear on both panels with _identical pixel counts_ (e.g. 284px of `#26FCB2` on each side of `ColorPicker / With Label`). `ColorPicker`, `ColorInput`, `ColorSwatch` were the designated color canaries; they pass.
- **`ItemTable`'s `viewport: 900x1050` is load-bearing** — `Appearance` trims to 983px and `States` to 932px; both clip at the 700 default. Same for `PrismCode` (900x1250) and `PrismDiffCode` (900x1700). Don't tidy these away.
- **`DataTable / Pivot` clips horizontally on BOTH panels** — identical each side, grades `match`, no overflow warning fired. Nothing is broken; only a wider viewport would show the full pivot.
- **`defaultOpen: true` args DO render statically** — unlike play-driven opens. `ColorInput / Open` and `ColorPicker / Open` use plain args and would grade normally if captured. Useful discriminator when triaging an "open overlay" story: check whether the open state is an ARG or a play.
- **Timezone normalisation shifts rendered date literals on BOTH panels — not clock drift.** `DateRangeSeparatedPicker / WithSecondGranularity` passes `new Date('2020-09-10 18:19')` through `parseAbsoluteDate` and both panels render `16:19:00` (and `12:12:00` for the `14:12` end). Identical on each side = correct absolute-time conversion. The frozen capture clock holds: every date string was character-identical across panels on both pickers.
- **Monospace cannot suffer `[FONT_MISSING]`.** `--font-mono` (`src/components/GlobalStyles.tsx`) is a pure _system_ stack with no webfont dependency. Only Inter is network-loaded. So the mono presets (`m1`-`m3`, `s2`-`s4`), `PrismCode`, `CopySnippet` and `HotKeys` glyphs render from local fonts on both panels by construction.

## [GENERAL] The card wrapper's zero height has TWO faces

`.ds-single` (and `.ds-cell`) carry `transform: translateZ(0)` and **no height**, and the emitted card sets no `html,body{height:100%}`. That single defect shows up two different ways. Both are converter-level — **never** fix either with an owned preview (mirroring the JSX reproduces the blank; adding a height fakes the render). Bundle both into the upstream report.

**Face 1 — fixed overlays collapse (needs `position:fixed`).** See the section below: a full-viewport underlay resolves against a `900x0` containing block.

**Face 2 — stretched-height stories render COMPLETELY BLANK (no `position:fixed` involved).** `ResizablePanel / Resize Bottom` and `/ Resize Top` previews are flat white: both raws are 900x700 with **1 unique colour, mean = 1.0**, against references showing the divider and grip at y=197.

The discriminator is a property of the **story**, not the component: `TemplateRight` / `TemplateLeft` / `Disabled` set `height="min 30x"` on the outer Panel and render fine (top-240 overlap AE = 20/216000 = 0.009%; AE=0 for Disabled), while `TemplateBottom` / `TemplateTop` set **no height at all** on their stretched column Panel and collapse to zero.

> **Diagnostic: `colors=1` / `mean=1.0` on a preview raw is NEVER a framing trap.** Grep the story root for an explicit height; if its only sizing is `isStretched` or a percentage, this is the bug.

## [GENERAL] Full-viewport `position:fixed` overlays collapse to 0 height

**This one affects the SHIPPED card, not just grading.** Diagnosed on `Menu / Inside Modal`: the reference shows an AlertDialog over a grey `#black.30` backdrop; the preview shows the same dialog on plain white — the underlay is missing.

Mechanism (probed live on `components/actions/Menu/Menu.html?story=InsideModal`): the card page mounts into `div#r0.ds-single`, and both `.ds-single` and `.ds-cell` carry `transform: translateZ(0)` in the emitted `<Name>.html`. A transform makes that element the **containing block for `position:fixed` descendants**. When a story's only content is fixed-positioned, the wrapper has no in-flow content, so it is `900x0` — and the underlay (`position:fixed; inset:0`) resolves against `900x0`. The element IS in the DOM with `opacity: 0.9999` and `background: oklch(0 0 0 / 0.3)`; its `getBoundingClientRect()` is literally `[0, 0, 900, 0]`.

The transform is **deliberate** — it is how the converter stops overlay bleed from painting across sibling grid cells (see the comment in the emitted card JS). So this is a designed trade-off with an unhandled edge case, not a typo.

**Scope:** the per-story `?story=` capture path builds `div.ds-single` regardless of `cardMode`, so it applies to every component, not only `cardMode:"single"` ones. In practice it only bites a story that renders an **open** overlay; the common case (a closed trigger) is unaffected, and most open-overlay stories are play-gated and therefore can't render statically anyway.

**Do NOT fix this per-component.** An owned preview that works around it would shadow the real fix forever, and the skill forbids forking `emit.mjs` / `bundle.mjs` (app-contract surface). The fix is converter-level — give the single/cell wrapper a real height, or contain overlays without a transform. **Report it upstream.** Locally, skip the affected story.

## Known-benign warnings (triaged — do not re-chase)

- **`[CSS_PLACEHOLDER]`** — expected and correct. This DS styles through tasty (runtime CSS-in-JS); the converter itself writes `_ds_bundle.css` as `/* @ds-css-runtime: no extracted CSS — styles are runtime-generated */`. Do **not** set `cfg.cssEntry` chasing this. The real font dependency (Inter) arrives via the `@import` in `styles.css`, which is the closure designs get.
- **7 × `[DOCS_UNMAPPED]`** (`DateInput`, `DateRangePicker`, `DateRangeSeparatedPicker`, `FieldWrapper`, `Notification`, `RangeSlider`, `TimeInput`) — these genuinely have no `.docs.mdx` anywhere. Not fixable by config; only by writing docs upstream.
- **`[RENDER_THIN]` `NoDataIcon`, `Tooltip`** — 0px rendered height. Plausibly legitimate (Tooltip needs hover to appear; NoDataIcon is a bare icon), but **not yet visually confirmed** — see Re-sync risks.

## Conventions header: validated, not rewritten

`.design-sync/conventions.md` was recovered from the 0.173.0 build and re-validated against 0.185.1 on 2026-09-28. Everything it enumerates still resolves: 16 component names, 19 color tokens, 26 typography presets, 51 style props, the `Root` provider with `fontDisplay="auto"`, and both unit values (`$gap: 8px` → `1x`, `$radius: 6px` → `1r`, from `src/tokens/base.ts`). Zero drift. Note `#dark-02`/`#dark-03` are _alias_ tokens declared in `src/tokens/colors.ts` as `'#dark-02': '#surface-text-soft'` — they do not emit `--dark-02-color` CSS vars, so a naive grep for the CSS var reports them missing. They are real. Re-validate against each build; do not rewrite (it is the prior author's content).

## Re-sync risks

- **`titleMap` is unverified** (see table above). If the fresh build reports fewer than 90 components or prints `[TITLE_UNMAPPED]`, the lost `titleMap` is the first suspect — not a new upstream regression.
- **`viewport` overrides at the 900x700 default could not be distinguished** from unset. `[GRID_OVERFLOW]` on a component that the prior run shipped clean points here.
- **The DS jumped 0.173.0 → 0.185.1** between syncs. Grades carried from the old cache only survive where the story file's fingerprint is unchanged; anything else re-grades. Do not read a wave of cleared grades as breakage. In practice **nothing** carried (`unchanged: 0`): the version jump plus a changed `scriptsSha` moved every source key.
- **`ButtonSplit`'s root pin is load-bearing and fails silently.** If the subcomponent heuristic changes, `ButtonSplit` drops out of the roster with no warning. Assert the component count and that `ButtonSplit` has its own card.
- **`cfg.storyImports.shim` is load-bearing for 3 components.** If `useAlertDialogAPI`, `useEventBus`/`EventBusProvider`, or the `overlays/Notifications` barrel ever stop being public exports, the shim silently resolves to `undefined` instead of erroring loudly. Re-check those exports after a major bump.
- **`[RENDER_THIN]` on `NoDataIcon` and `Tooltip` was never visually confirmed** this run — they are _assumed_ legitimately-short. Confirm from the compare sheets and either record them here as permanently-thin or author owned previews.
- **Story caps hide tail stories.** `CommandMenu` (20 stories) and `Notification` (9) are capped at 6 by default, so their tail stories ship verified-by-upload without ever being graded individually. Raise with `--max-stories` if those tails carry distinct variants worth proving.

## The compare harness clamps its capture viewport to 2000px

`compare.mjs:443` builds the capture viewport as `{ width: Math.min(w, 2000), height: Math.min(h, 2000) }` from the card's declared `viewport="WxH"`. A card taller than 2000px is therefore **screenshot clipped during verification only** — the shipped card is unaffected.

This bit `Content`, whose override is `900x2600`. In-sheet the preview trimmed to 1976px against storybook's 2535px and looked truncated, while the overlapping region scored AE 0.00 — the signature of a clamp, not a defect (a real truncation would not be pixel-perfect above the cut).

**Confirm it out-of-band rather than guessing**: serve `ds-bundle/` and screenshot `components/<g>/<N>/<N>.html?story=<Story>` at the card's real declared viewport. Content then trims to `900x2535` — exactly storybook's 2535 — at **AE 0.001%**. Note playwright resolves from `.ds-sync/node_modules`, so the probe script must live under `.ds-sync/` (an ESM import of `playwright` from the scratchpad fails; `NODE_PATH` does not help ESM).

**Do not raise a viewport above 2000 expecting the sheet to show it** — there is no config knob for the clamp. Verify tall cards with the probe instead.

## Any `cfg.overrides` change needs a FULL rebuild

`lib/preview-rebuild.mjs` is the cheap single-component inner loop, but it refuses an override edit outright:

```
✗ [CONFIG_STALE] cfg.overrides/cfg.titleMap for a target component changed
  since the stamped build — run package-build.mjs first
```

It re-stamps grade keys from the build manifest, so it cannot honour a config slice the build never stamped. Consequence: **batch every skip/viewport decision into one rebuild** — an override discovered late costs a full build (hours on a loaded machine), not a targeted one.

## DEFERRED to the next sync: `ComboBox / Allows Custom Value No Items`

Graded `close` (play-gated, preview correct). The open issue is not fidelity but **stability**: `play()` types "Custom value example" with `delay:100`, so the reference captures a mid-typing frame whose substring depends on capture timing ("Cu" this run). The reference pixels are therefore unstable and this component will land in `pendingGrade` on **every** future sync.

`cfg.overrides.ComboBox.skip = ["forms-combobox--allows-custom-value-no-items"]` would settle it. Not applied here because it needs a full rebuild (see above) and would drop a story from the card for a preview that is already correct. **Apply it at the start of the next sync**, where a rebuild happens anyway.

## Expect one harmless README diff on the next sync

This repo's `lint-staged` runs prettier on `*.md`, so committing `conventions.md` reformatted it (102 -> 75 lines: prose rewrapped, the prop-family table separator padded from `|---|---|` to `| --- | --- |`). A word-level diff against the uploaded `README.md` header shows **that separator row as the only difference** — the content is identical and both render the same.

The uploaded README was built from the pre-prettier file. The next build regenerates it from the committed (prettier) version, so `README.md` will show up as changed once and then stay stable. Nothing to fix.

## STATE AT HANDOFF: uploaded 0.185.1, repo moved to 0.185.3

The 92 components uploaded to the design system were built from **0.185.1** (`e5065210`). While this run was finishing, `main` advanced 6 commits to `f4697301` — **v0.185.2 and v0.185.3** — touching **76 src files (+1937/-1728)** across ~30 component directories, including a React-Compiler-driven `refactor: drop manual memoization` (#1441), `fix(useFocus)` (#1439), `fix(Form)` (#1438) and `fix(fields)` (#1436).

What this does and does not mean:

- **Grades survive.** No `*.stories.tsx` changed, so every `srcSha` — and therefore every `sourceKey`/`gradeKey` — is unchanged. A re-sync will carry all 92 grades forward rather than re-grading from scratch.
- **`.design-sync/sb-reference/` IS NOW GENUINELY STALE.** The `[REFERENCE_STALE?]` false-alarm finding above was verified against the 0.185.1 tree only. `src/` has since moved, so the precondition no longer holds: **rebuild the reference before grading anything** — `npx storybook build -c .storybook -o "$(git rev-parse --show-toplevel)/.design-sync/sb-reference"` (~2 min). Grading against the old reference would compare 0.185.3 previews to a 0.185.1 reference and read every internals change as a regression.
- **The uploaded bundle is one patch line behind.** Component internals changed, so the live design system renders 0.185.1 behaviour until a re-sync. Nothing is broken; it is simply not current.

Next sync: rebuild the reference first, then apply the deferred ComboBox skip (see above) in the same rebuild.
