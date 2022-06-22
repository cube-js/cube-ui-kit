const StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default;
const { join } = require('path');

const reportFolder = process.env.REPORT_FOLDER ?? './size-limit-report';

module.exports = [
  {
    name: 'All',
    path: './dist/__measure.js',
    webpack: true,
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
    limit: '220kB',
  },
  {
    name: 'Tree shaking (just a Button)',
    path: './dist/es/index.js',
    webpack: true,
    import: '{ Button }',
    limit: '40 kB',
  },
];
