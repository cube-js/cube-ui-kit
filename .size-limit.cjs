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
    // 487.19 kB at the time of writing, up from 466.64 kB on the commit this
    // branched from. The +20.55 kB is `Pagination`, `ItemTable` (with its
    // toolbar, search and bulk bar), `DataTable`, and the `TableBase` engine
    // they share.
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
    limit: '490kB',
  },
  {
    name: 'Tree shaking (just a Button)',
    path: './dist/index.js',
    webpack: true,
    import: '{ Button }',
    // 121.79 kB at the time of writing, measured on this branch merged with main.
    // Raised from main's 119 kB for Tasty v3. Two increases stack here: main had
    // already gone 118 -> 119 kB for the ~400 B that `@tenphi/tasty` 2.11.0 ->
    // 2.11.2 added, and v3 costs a further ~3.8 kB — its new dev diagnostics
    // (directional syntax, handler displacement, chunk conflicts) ship in every
    // bundle, because `isDevEnv()` is evaluated at runtime so one build serves
    // dev and production. Headroom stays small so real bloat still trips.
    limit: '123kB',
  },
];
