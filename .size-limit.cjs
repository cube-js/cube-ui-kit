const StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default;

const { join } = require('path');

const reportFolder = process.env.REPORT_FOLDER ?? './size-limit-report';

module.exports = [
  {
    name: 'All',
    path: './dist/index.js',
    webpack: true,
    import: '*',
    modifyWebpackConfig: (webpackConfig) => {
      webpackConfig.plugins.push(
        new StatoscopeWebpackPlugin({
          name: 'all',
          normalizeStats: true,
          saveOnlyStats: true,
          saveStatsTo: join(reportFolder, 'stats.json'),
        }),
      );
    },
    // 540 kB for the Dashboard authoring pass on top of the component below.
    // Both sides rebuilt on the same machine: the Dashboard commit (ee836b28)
    // reads 527,936 B and this branch 534,037 B — +6,101 B, so the 530 kB budget
    // it was booked at is 4,037 B over.
    //
    // Attributed, by reverting one half and rebuilding: with the previous commit's
    // locale bundles the branch reads 532,868 B, so 1,137 B is the twelve new
    // `dashboard.*` strings across all twelve locales (net of four the node menu
    // retired) and 4,932 B is code. The code half is the node action menu and its
    // seven size commands with the bounds-plus-occupancy resolution behind them,
    // seven new icons, the collision resolver promoted out of the Playground
    // (`resolveDashboardDrop`, the Grid single-blocker swap, stack reflow,
    // `getLargestFreeRect`), the claimed add region with its free-rectangle trim,
    // and the drag engine's per-gesture geometry snapshot, client-coordinate
    // tracking and Escape handling.
    //
    // The `Tree shaking (just a Button)` entry is BYTE-IDENTICAL across the two
    // commits at 123,062 B, so none of this reaches a consumer that imports one
    // component, and it also rules out the dependency: a change inside Tasty's
    // always-included core moves both entries together, and this moved only one.
    //
    // Rounded to the next 5 kB step ABOVE the platform gap rather than to the
    // next step above the reading: 535 kB would leave 995 B, and the macOS/Linux
    // zlib note below puts the local figure up to ~1.6 kB light. 540 kB leaves
    // 5,963 B locally, which is more headroom than this entry usually carries —
    // fit it back down once CI has reported a number for this branch.
    //
    // Before this: 530 kB for the standalone Dashboard compound component on top of the
    // Board resize-affordance work below. Dashboard measured 526.06 kB locally
    // against its 513.60 kB baseline, i.e. +12.46 kB for the shared 12-column
    // layout, nested container chrome, selection registry, settings affordance,
    // Tabs composition, controlled pointer/keyboard movement, cross-parent hit
    // testing, resizing, occupancy-aware add slots, and registered contextual
    // menus. After rebasing onto main's later Board work, the combined branch
    // measures 527.94 kB locally. The Button-only entry measures 123.06 kB and
    // remained effectively unchanged through both features, confirming that
    // Dashboard and Board tree-shake away for consumers that do not import them.
    // Rounded to the next 5 kB step as the sizing notes below require.
    //
    // 517 kB for the Board resize-affordance rework. CI measured `main`
    // (582c1e0) at 513,743 B and this branch at 515,261 B — +1.52 kB — against a
    // 515 kB budget that `main` had already spent down to 1,257 B of headroom, so
    // it came in 261 B over. A later visual pass (a painted gap on the outside
    // grips, the corner angle in place of a dot, and the dev guards moved to
    // `isDevEnv()`) added a further 180 B, and CI then measured the finished
    // branch at 515,433 B. Set to 517 kB, leaving 1,567 B — about what `main` was
    // carrying, and thin on purpose per the note further down.
    //
    // Another calibration point for the macOS/Linux warning below, since this
    // branch produced two: the local reading was 515,290 B against CI's 515,433 B,
    // a +143 B gap, after +151 B on the previous commit. Small and consistent, not
    // the ~1.6 kB that warning describes — but it IS a gap, and both times it ran
    // the same direction, so a budget fitted to a local reading would have landed
    // just under. Predicting CI from a local delta worked here to 8 bytes; that is
    // a usable technique, not a licence to skip the CI number.
    //
    // The `Tree shaking (just a Button)` entry below is BYTE-IDENTICAL across the
    // two commits: 123,018 B on both. That is the check those comments keep
    // reaching for — none of this reaches a consumer who imports a single
    // component, so all 1.5 kB is Board and all of it tree-shakes. It also rules
    // out the dependency: a change inside Tasty's always-included core moves both
    // entries by the same amount, and this moved only one.
    //
    // What the 1.5 kB is: `OutsideGripElement`'s style map (a third grip
    // placement, with per-axis geometry across nine style maps), placement
    // resolving itself from content, two new `BoardHost` channels and the nesting
    // depth that rides with them, and the `elementsFromPoint` arbitration
    // (`findDeeperHandle` / `forwardPointerDown`).
    //
    // Roughly 0.7 kB of it is the two dev warning strings, raw. They ship now, and
    // deliberately: they used to sit behind `process.env.NODE_ENV !== 'production'`,
    // which the build FOLDS AWAY — it keeps whichever branch the build-time value
    // resolved to, so a guard compiled at a dev NODE_ENV vanished and left the
    // warnings firing in consumers' production bundles. They are on `isDevEnv()`
    // now, evaluated at runtime, so the text is in the bundle and the warning is
    // not. Same trade Tasty makes for its diagnostics, and the same reason. Worth
    // knowing they are the first thing to shorten if this entry needs room, and
    // that the same folding applies to the bare `NODE_ENV` checks elsewhere in the
    // kit (`FieldWrapper`, `TooltipTrigger`, `use-field-props`) — not touched here.
    //
    // Before this: 515 kB on `@tenphi/tasty` 3.5.0: 513.60 kB against `main`'s
    // 512.39 kB with both sides rebuilt here, i.e. +1.21 kB. The Button entry
    // below moved by the same +1.21 kB, and matching deltas on both entries is
    // the signature of a change inside Tasty's always-included core — here the
    // DOM-scanning GC sweep that replaced the reference counting, keyframe
    // ownership, content-addressed local `@keyframes` names, and the fuller
    // `tastyDebug.summary()` accounting. 3.4.0 is pure performance (faster LRU
    // reads, memoized chunk cache keys) and does not show up in either reading.
    //
    // That leaves only 1.40 kB, the thinnest this entry has been, and most of
    // what ate it was not this bump: `main` had already climbed from 508.95 to
    // 512.39 kB on its own (+3.44 kB of Board chrome, `tokens/resolve`,
    // `useScheme`, TextInput `autoComplete` and the batched-injection wiring),
    // leaving 2.61 kB before Tasty was touched. Left at 515 kB rather than
    // rounded up: it fits, and the note further down wants the margin thin
    // enough that real bloat still trips the budget. The NEXT change here
    // almost certainly has to raise it — read the units note below first.
    //
    // Calibration worth keeping, against the macOS/Linux warning below: on the
    // machine that measured this bump, the local reading matched CI EXACTLY on
    // both entries. CI reported `main` at 500.38 KB and 118.96 KB binary, which
    // is 512.39 kB and 121.81 kB decimal, and the local rebuild of the same
    // commit read 512.39 kB and 121.81 kB. CI then measured this branch at
    // 501.56 KB and 120.13 KB binary — 513.60 kB and 123.02 kB — matching the
    // local readings above that the budgets were checked against. So the
    // ~1.6 kB gap that warning describes did not apply here. Two entries on one
    // machine do not retire the warning — still prefer CI's number — but a
    // local reading is not automatically 1.6 kB light either, and assuming it
    // is would have raised this budget for no reason.
    //
    // Before this: 515 kB on 3.3.1 too — 508.53 kB locally against 509.94 kB
    // on 3.1.0 with both sides rebuilt here, i.e. -1.41 kB across the two
    // releases. (508.95 kB after merging `main`'s cols x rows Board matrix,
    // which is that feature's 0.42 kB and not the dependency's.) 3.2.0 added 0.69 kB for batched injection (the write queue and
    // `TastyBatchProvider` sit in the always-included core, so they ship whether
    // or not an app turns batching on), and 3.3.0 gave back 2.10 kB by deleting
    // the colour-space decomposition: a `#name` token no longer emits a
    // `--name-color-rgb`/`-oklch` companion, so the conversion tables and the
    // per-space emit paths go with it. The Button entry below moved by the same
    // amounts, which is the signature of a change inside that core.
    //
    // Before this: 515 kB. 509.94 kB locally with `@tenphi/tasty` 3.1.0, against 509.55 kB
    // for the same code on 3.0.2 — +0.39 kB for the colour-function work, and
    // the Button entry below moved by the same amount, which is what a change
    // inside Tasty's always-included core looks like.
    //
    // The old 510 kB was not this branch's to spend: `main` had already reached
    // 509.55 kB on its own, 450 B under, so any dependency bump was going to
    // trip it. Rounded to the next 5 kB step rather than fitted to the reading,
    // per the note further down about the local figure running low.
    //
    // Before this: 510 kB, raised from 505 kB for ItemTable/DataTable tree rows. The shared
    // immutable hierarchy model, recursive operations, React Aria treegrid
    // wiring, cascading selection and disclosure renderer add 2.97 kB locally
    // (507.97 kB total). The Button-only budget below is unchanged, confirming
    // that consumers which do not import the tables tree-shake the feature.
    // Rounded to the next 5 kB step for the macOS/Linux zlib difference noted
    // below.
    //
    // Previously 505 kB, raised from 501 kB, which the palette branch exceeded by 596 B
    // locally. Measured with both sides rebuilt on the same machine: `main` at
    // 500.29 kB, that branch at 501.60 kB, so the palette work itself is
    // +1.31 kB — the color-seeded accent arrangement, `color-seed.ts`, and
    // `ColorSwatch` as its own component.
    //
    // Still 505 kB on the `current`-theme branch: 504.04 kB against `main`'s
    // 503.76 kB with both sides rebuilt here, i.e. +0.28 kB for the whole theme.
    // Unlike the palette work, this one DOES move the Button budget below —
    // `current` is a theme on `Button` itself, so its seven flavours are in the
    // variants map and reach a `{ Button }`-only import. See that entry.
    //
    // Rounded up to the next 5 kB step rather than set just above the reading:
    // the local figure runs low (see the macOS/Linux note below), so a limit
    // fitted to it lands under the runner's own number.
    //
    // 498.78 kB in CI at the time of writing, 1.78 kB over the previous
    // 497 kB. That is the calendar's month/year navigation: the shared
    // `CalendarPanel` / `CalendarHeader` / `PeriodGrid` that `Calendar`,
    // `RangeCalendar` and `PeriodCalendar` now build on (the three of them
    // previously carried three copies of a header and two of the cell styles,
    // so the net is smaller than the new code), plus the eleven `calendar.*`
    // and `datePicker.select*` strings across twelve locales, which are
    // registered eagerly. Measured against `main` at 496.25 kB with both sides
    // rebuilt: +2.53 kB. Raised to 501 kB.
    //
    // Before this, on the palette branch this merges with: 497.13 kB in CI, 131
    // bytes over the then-current 497 kB, and all of it the dependency —
    // `@tenphi/glaze` gained `from`, which lets a theme color be seeded from a
    // literal value instead of the theme seed. Measured at +325 bytes locally
    // between the two Glaze builds with the kit's own source held constant; the
    // kit's own source got *smaller* over the same commit, since `from` replaced a
    // derive-then-re-seed workaround. That bump asked for 498 kB and is subsumed by
    // the 501 kB above, which was measured after it.
    //
    // Before this: 495.09 kB in CI, 86 bytes over the previous
    // 495 kB. Two things stack into that: `DataTable`'s column menu, adaptive
    // column colors and column reordering, which left `main` itself ~300 bytes
    // under the old budget, and the ~0.4 kB of disabled-state handling that
    // lets `Item` and `Button` keep a tooltip hoverable. Raised to 497 kB.
    //
    // WATCH THE UNITS WHEN READING THE CI COMMENT. `size-limit` parses this
    // `limit` with `bytes-iec`, where `kB` is decimal — `'495kB'` is 495,000
    // bytes. The PR comment is formatted by `scripts/ci/measure-size.js` with
    // the `bytes` package, whose `KB` is binary, so the same bundle reads as
    // "483.48 KB" there. That is why a report can show a number well below the
    // limit and still fail: 483.48 KiB is 495,084 bytes.
    //
    // Before this: 490.30 kB in CI, up from 466.64 kB on the commit that
    // branched from. That growth was `Pagination`, `ItemTable` (with its
    // toolbar, search and bulk bar), `DataTable`, and the `TableBase` engine
    // they share.
    //
    // SET THIS FROM CI'S NUMBER, NOT A LOCAL ONE. `size-limit` gzips with the
    // platform's zlib, and macOS reads roughly 1.6 kB lower than the Linux
    // runner — so a limit chosen against a local measurement can fail in CI by
    // a few hundred bytes while passing on the machine that set it. That is
    // exactly how this one first landed 302 bytes over.
    //
    // MEASURE WITH A FRESH `pnpm build`. `path` below is `./dist/index.js`, so
    // `pnpm size` happily reports the last build's number against the current
    // source — which is how this component was first booked in at ~8 kB, less
    // than half its real cost. Both sides of a comparison have to be rebuilt.
    //
    // (An earlier interim bump to 464 kB was measured against a stale
    // `node_modules` still on Tasty 2.11.2, so it read ~4 kB low. Same class of
    // mistake, different stale artifact.)
    //
    // Before this: 462 kB, itself covering Board selection and group movement
    // (~3.5 kB of engine — a rigid multi-item move primitive, selection state,
    // marquee hit-testing, a live region — plus ~0.5 kB for the six `board.*`
    // strings across twelve locales, which are registered eagerly) and
    // `ColorPicker` (~3.8 kB of component, color model and channel definitions).
    // Before those: 460 kB for Tasty v3, whose dev diagnostics ship in every
    // bundle because `isDevEnv()` is evaluated at runtime, so one build serves
    // dev and production.
    //
    // The Button budget below is unchanged, which is the check that matters:
    // none of this reaches a consumer who imports none of them.
    //
    // Headroom is deliberately small so real bloat still trips the budget.
    //
    // Expect a larger, deliberate bump when table virtualization lands:
    // `react-virtuoso` is ~94 kB raw. That is a considered trade — it is what
    // buys the native-`<table>` design its sticky header, sticky pinned columns
    // and variable row heights — and Cube Cloud already ships virtuoso, so it
    // costs the main consumer nothing.
    //
    // Note when checking locally: `size-limit` bundles the built `./dist`, it
    // does not build. Run `pnpm build` first or you will measure a stale bundle.
    limit: '540kB',
  },
  {
    name: 'Tree shaking (just a Button)',
    path: './dist/index.js',
    webpack: true,
    import: '{ Button }',
    // Still 125 kB on `@tenphi/tasty` 3.5.0: 123.02 kB against `main`'s
    // 121.81 kB, both sides rebuilt here — +1.21 kB, matched by the same
    // +1.21 kB on `All` above, so all of it is Tasty's always-included core and
    // none of it ours. See that entry for what the release changed there, and
    // for why a local reading was trusted here. 1.98 kB left.
    //
    // Before this: 125 kB on 3.3.1 too — 121.76 kB locally against 124.03 kB
    // on 3.1.0, both sides rebuilt here — -2.27 kB, matched by the -1.41 kB on
    // `All` above, so all of it is Tasty's always-included core and none of it
    // ours. 3.2.0's batching cost this entry 0.68 kB; 3.3.0 then removed the
    // colour-space decomposition, which is worth 2.96 kB to a consumer who
    // imports a single component.
    //
    // That leaves 3.25 kB of headroom, the most this entry has had in a while.
    // Left at 125 kB deliberately: the note below wants the margin thin enough
    // that real bloat still trips it, and a budget lowered to fit today's
    // reading would have to move again on the next feature.
    //
    // Before this: 124.03 kB in CI (124,026 B, 26 bytes over the previous 124 kB), and all of
    // it the dependency again — `@tenphi/tasty` 3.0.2 -> the colour-function
    // work. Both sides rebuilt here read 123.63 kB on 3.0.2 and 124.03 kB on the
    // snapshot, +0.40 kB, and `All` moved by the same 0.40 kB (508.98 ->
    // 509.38 kB). Matching deltas on both entries is what a change inside
    // Tasty's always-included core looks like, exactly as the 3.0.1 -> 3.0.2
    // note below describes. The kit's own source is unchanged.
    //
    // Raised to 125 kB rather than shaved, as the note below asks for: the
    // previous entry left 330 B and this needs 400 B. Nothing here is padding —
    // it is `light-dark()`/`contrast-color()` support and the relative-colour
    // opacity path, all in the parser and style handlers every consumer loads.
    //
    // Before this: 123.67 kB, against `main`'s 123.32 kB with both
    // sides rebuilt on the same machine: +0.35 kB for the `current` theme. This
    // is the one entry the theme legitimately moves, and it is worth being clear
    // about why, because the comments above use this budget staying flat as the
    // proof that a feature costs an uninterested consumer nothing. That argument
    // does not apply here: `current` sits on the THEME axis of `Button` itself,
    // so its seven flavours are entries in the variants map and ship with any
    // `import { Button }`. There is nothing to tree-shake — the cost is the
    // feature.
    //
    // 330 B of headroom, which is thin on purpose (see the note at the end of
    // this entry) but worth knowing about: the branch first came in at 124.01 kB,
    // 6 bytes over, and what bought the room back was deleting the `invert` type
    // (-0.34 kB on this entry and on `All`). If the next change here needs more
    // than 330 B, raise this to 125 kB rather than shaving something real.
    //
    // Before this: 123.03 kB, 31 bytes over the previous 123 kB. That was
    // `@tenphi/tasty` 3.0.1 -> 3.0.2 and nothing of ours: both sides rebuilt
    // on this Linux box read 122.47 kB on 3.0.1 and 123.03 kB on 3.0.2, +0.56 kB,
    // and the `All` entry moved by the same 0.55 kB (499.12 -> 499.67 kB), which
    // is what a change inside Tasty's always-included core looks like. The old
    // budget only had ~530 B of headroom. Raised to 124 kB.
    //
    // Before this: 121.79 kB, measured on that branch merged with main.
    // Raised from main's 119 kB for Tasty v3. Two increases stack here: main had
    // already gone 118 -> 119 kB for the ~400 B that `@tenphi/tasty` 2.11.0 ->
    // 2.11.2 added, and v3 costs a further ~3.8 kB — its new dev diagnostics
    // (directional syntax, handler displacement, chunk conflicts) ship in every
    // bundle, because `isDevEnv()` is evaluated at runtime so one build serves
    // dev and production. Headroom stays small so real bloat still trips.
    limit: '125kB',
  },
];
