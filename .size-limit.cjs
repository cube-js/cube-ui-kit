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
    // 467.87 kB at the time of writing. Two features stack here:
    //
    // - Board selection and group movement raised it from 462 kB: ~3.5 kB of
    //   engine (a rigid multi-item move primitive, selection state, marquee
    //   hit-testing, a live region) plus ~0.5 kB for the six `board.*` strings
    //   across twelve locales, which are all registered eagerly. Measured by
    //   building with and without the locale keys.
    // - `ColorPicker` adds ~3.8 kB of component, color model and channel
    //   definitions.
    //
    // The Button budget below is unchanged, which is the check that matters:
    // none of this reaches a consumer who imports neither.
    //
    // Headroom is deliberately small so real bloat still trips the budget.
    //
    // Note when checking locally: `size-limit` bundles the built `./dist`, it
    // does not build. Run `pnpm build` first or you will measure a stale bundle.
    limit: '469kB',
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
