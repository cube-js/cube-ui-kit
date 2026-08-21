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
    // 510 kB, raised from 505 kB for ItemTable/DataTable tree rows. The shared
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
    limit: '510kB',
  },
  {
    name: 'Tree shaking (just a Button)',
    path: './dist/index.js',
    webpack: true,
    import: '{ Button }',
    // 124.03 kB in CI (124,026 B, 26 bytes over the previous 124 kB), and all of
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
