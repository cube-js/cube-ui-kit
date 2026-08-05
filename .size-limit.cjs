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
    // 451.32 kB at the time of writing. Raised from 450 kB on this branch:
    // the OKHST migration plus the components main added (InfoBadge, the
    // form validation module) pushed it just over. Headroom is deliberately
    // small so real bloat still trips the budget.
    limit: '460kB',
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
