const StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default;

const { join } = require('path');

const reportFolder = process.env.REPORT_FOLDER ?? './size-limit-report';

// No `limit`: UI Kit's own code grows with every feature, and a hard limit only
// made each such PR raise it. CI reports both sizes and their change against
// `main`, and gates what a limit was meant to catch:
//
// - a third-party package entering the bundle or growing, read from the stats
//   below by `scripts/bundle-deps.mjs` against `scripts/bundle-deps-baseline.json`;
// - broken tree-shaking, as the Button-only share of `All`
//   (`scripts/ci/measure-size.js`).
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
  },
  {
    name: 'Tree shaking (just a Button)',
    path: './dist/index.js',
    webpack: true,
    import: '{ Button }',
  },
];
