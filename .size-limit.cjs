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
    // 468.46 kB at the time of writing. Raised from 462 kB for `Pagination` and
    // `ItemTable` (including its toolbar and search), which together cost ~8 kB.
    //
    // (An interim bump to 464 kB was measured against a stale `node_modules`
    // still on Tasty 2.11.2, so it read ~4 kB low. Re-baselined on 3.0.1.)
    //
    // Before that: raised from
    // 460 kB for Tasty v3, whose new dev diagnostics ship in every bundle
    // because `isDevEnv()` is evaluated at runtime, so one build serves dev and
    // production. Headroom is deliberately small so real bloat still trips the
    // budget.
    //
    // Expect a larger, deliberate bump when table virtualization lands:
    // `react-virtuoso` is ~94 kB raw. That is a considered trade — it is what
    // buys the native-`<table>` design its sticky header, sticky pinned columns
    // and variable row heights — and Cube Cloud already ships virtuoso, so it
    // costs the main consumer nothing.
    //
    // Note when checking locally: `size-limit` bundles the built `./dist`, it
    // does not build. Run `pnpm build` first or you will measure a stale bundle.
    limit: '470kB',
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
