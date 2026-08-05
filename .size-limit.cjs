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
    // 118.03 kB at the time of writing. The predicted trip happened: the
    // `@tenphi/tasty` 2.11.0 → 2.11.2 bump added ~400 B here (measured by
    // rebuilding against both versions — nothing in the UI Kit itself moved),
    // which ate the previous 118 kB budget's ~370 B of headroom. Raised to
    // 119 kB, deliberately keeping headroom small so real bloat still trips.
    limit: '119kB',
  },
];
