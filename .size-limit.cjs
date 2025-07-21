const StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default;

const { join } = require('path');

const reportFolder = process.env.REPORT_FOLDER ?? './size-limit-report';

module.exports = [
  {
    name: 'All',
    path: './dist/es/index.js',
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
    limit: '273kB',
  },
  {
    name: 'Tree shaking (just a Button)',
    path: './dist/es/index.js',
    webpack: true,
    import: '{ Button }',
    limit: '23 kB',
  },
  {
    name: 'Tree shaking (just an Icon)',
    path: './dist/es/index.js',
    webpack: true,
    import: '{ AiIcon }',
    limit: '12 kB',
  },
];
