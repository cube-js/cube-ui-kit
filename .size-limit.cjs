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
    // 117.63 kB at the time of writing — only ~370 B of headroom, so this
    // one is likely to trip next even though it passes today.
    limit: '118kB',
  },
];
