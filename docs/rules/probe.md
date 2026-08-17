# Inspecting Rendered HTML & CSS — `pnpm probe`

Detail behind the summary in [`AGENTS.md`](../../AGENTS.md#inspecting-rendered-html--css--pnpm-probe). Read that first — it carries the rule you must follow. This file covers the modes, the two tiers, and what each can and cannot answer.

Answering "what CSS does this actually produce?" used to mean hand-writing a throwaway vitest spec, running it, reading the output and deleting the file. `pnpm probe` does it in one call, with the real config loaded — the `configure()` (units, recipes) and `setGlobalPredefinedStates()` (`@dark` / `@hc`) from `src/components/Root.tsx`, plus the live Glaze palette. That is exactly what a bare `@tenphi/tasty` import misses.

```bash
pnpm probe styles '{"fill":"#purple","padding":"2x","preset":"t3"}'
pnpm probe tokens --scheme dark --filter surface
pnpm probe globals
pnpm probe render <<'TSX'
import { Button } from '@cube-dev/ui-kit';

<Button type="primary">Hello</Button>
TSX
```

`@cube-dev/ui-kit` is aliased to this working copy's `src`, so a snippet reads exactly like consumer code — and the same snippet runs unchanged through Cube Cloud's `yarn probe`, where the package is a real dependency.

**Use the probe as freely as you like** — either tier, as often as you want. It is a throwaway question-answering tool, not a suite anyone maintains, so there is no budget to protect and nothing to justify. It should be the first thing you reach for on a styling question; a separate spec file, permanent or temporary, is for the complex cases it cannot express.

## The modes

**`styles '<json>'`** — the CSS one tasty styles object produces, rendered against `.probe-target`. This is the arbiter for a style rewrite, and it is the only one: the tasty docs are wrong in at least one place (`padding` / `inset` claim unnamed sides go to `0`), so check rather than trust. At-rules are printed nested around the rule, because a `@media` or `@container` condition is usually the whole point of the question.

**`tokens`** — two shapes of the same palette, labelled rather than merged:

- `resolved` is `renderColorTokens()`: flat literal values for **one** variant, chosen with `--scheme light|dark` and `--hc`. The legacy aliases come back **by reference** (`'#dark': '#surface-text'`) rather than resolved — deliberately, so a region preview re-resolves them against its own tokens — and the probe labels them so you cannot read one as a color.
- `palette` is `getPaletteTokens()`: one tasty state map per token, keyed by scheme (`''` / `'@dark'` / `'@hc'` / `'@dark & @hc'`). This is the **four-variant view**, and it is the one a palette change has to be diffed across — see [`docs/glaze/`](../glaze/) on why light mode alone is misleading.

```bash
pnpm probe tokens --json > /tmp/tokens-before.json
# …change the palette…
pnpm probe tokens --json > /tmp/tokens-after.json
diff <(jq -S .palette /tmp/tokens-before.json) <(jq -S .palette /tmp/tokens-after.json)
```

**`render`** — module-level code, then a trailing JSX expression (or an explicit `export default`). It reports the markup plus **only the CSS that snippet caused**: the harness renders `<Root>` empty, captures, mounts the snippet, captures again and subtracts. Overlays are reported under `PORTALS` — `<Root>` is the `PortalProvider` target, so a `Dialog` renders as its *sibling* and never appears in the inline markup. `--full-css` keeps the baseline; `--canonical` normalises tasty's class hashes and React's `useId` counters so two renders can be diffed byte-for-byte.

**`globals`** — everything on the page with only `<Root>` mounted: the `:root` token block, the body styles, `@font-face`, the keyframes. Note that only a handful of those rules are attributed to a node, and **those** are all `render` subtracts; the token block reaches the page through `useGlobalStyles` / `injectRawCSS`, so it lives on a global sheet that no per-node dump can see and `render` never had to exclude it. (Cube Cloud's console-ui hands its palette to `<Root>` through a tasty `tokens` prop instead, so there the same block *is* node-attributed and the subtraction is what keeps ~119KB out of every answer. Same command, different reason for the same clean output.)

## The two tiers

jsdom is the default only because it is quicker: it reports the CSS tasty generated, which is what most questions are actually about. Know its two blind spots so you can recognise when an answer is jsdom's rather than the truth — it does not resolve custom properties (`backgroundColor` comes back as the literal `var(--surface-2-color)`, `--gap` as empty), and it *discards* `@container style()` and `@property` rules rather than degrading them, which the probe warns about when it happens.

**`pnpm probe:browser`** answers the four things jsdom cannot: computed values, geometry, pointer behaviour, and screenshots. It runs real Chromium, so it costs a browser binary and a slower start — that is the only reason it is not the default. `pnpm install` does **not** fetch that binary, so the first run on a fresh checkout needs a one-time `pnpm exec playwright install chromium`. Playwright says so itself if you skip it, but the message arrives at the bottom of a long stack.

```bash
pnpm probe:browser render --computed '[data-qa="Card"]' backgroundColor padding
pnpm probe:browser render --scheme dark --screenshot
pnpm probe:browser render --rect '[data-qa="Card"]'
```

The same component, both tiers: `var(--surface-2-color)` / `calc(3 * var(--gap))` under `probe`, versus `rgb(248, 248, 249)` / `24px` under `probe:browser`. `--computed` and `--rect` take a CSS selector, so give the component a `qa` prop and select on `[data-qa="…"]`.

`--computed`, `--rect` and `--screenshot` are **rejected** on the jsdom tier rather than silently ignored: asking for computed values and getting none back reads as "no styles applied", which is the opposite of the truth. `probe:browser` likewise refuses every mode but `render` — a browser would not change what `styles`, `tokens` or `globals` report.

Notes: the snippet is **not** typechecked (oxc strips types without checking them); `--json` gives machine-readable output, with the jsdom version recorded in it (Cube Cloud's probe runs a different major against this same `@cube-dev/ui-kit/probe` code, and the two disagree about which CSS rules survive).

## What this shares, and with whom

The CSS capture/diff pair and the canonicalisers live in `src/probe/` and ship as the **`@cube-dev/ui-kit/probe`** entry. Cube Cloud's probe imports them from there rather than keeping a copy, so the two repos cannot drift on exactly the thing a probe exists to answer. Changing anything in `src/probe/` is a change to published API — treat it as such.

The harness itself is `src/test/probe/`, named `*.probe.tsx` so it cannot match vitest's default `**/*.{test,spec}.*` include and never runs under `pnpm test`. Its two projects — `vitest.probe.config.ts` and `vitest.probe.browser.config.ts` — extend `vitest.config.ts` and `vitest.browser.config.ts` and narrow `include` to the one harness file. The browser one has to **delete** the base project's `include` before merging: `mergeConfig` concatenates arrays, so merging over it would leave both globs in place and every browser spec in the repo would run on each probe.

## Not the same thing as `pnpm test:browser`

The browser tier shares its Chromium and its `src/test/setup.browser.ts` with the `*.browser.test.tsx` specs that `pnpm test:browser` runs — the home for drag-and-drop and other layout- or pointer-dependent tests. **The freedom above applies to the probe, not to that suite**, and for a reason: a spec is a permanent artefact someone maintains and re-runs, while a probe run ends when you read it. Keep that suite small, and write a browser spec only when jsdom *cannot* answer — not merely when a browser would be more realistic. Ordinary specs stay in jsdom.

Unlike Cube Cloud's equivalent, that suite **is** wired into CI (the `browser-tests` job in `pull-request.yml` installs Chromium and runs it), so a green PR does say something about it.
