// @ts-check
const webpack = require('webpack');

/**
 * @readonly
 * @type {import('@swc/core').Config}
 */
const swcConfig = {
  jsc: {
    target: 'es2021',
    loose: true,
    parser: { syntax: 'typescript', tsx: true },
    transform: { react: { runtime: 'automatic' } },
  },
  env: {
    targets: 'last 2 Safari major versions',
  },
};

/** @type {import('@storybook/core-common').StorybookConfig} */
const config = {
  staticDirs: ['../public'],
  framework: '@storybook/react',
  core: {
    builder: {
      name: 'webpack5',
      options: { fsCache: true, lazyCompilation: true },
    },
    disableTelemetry: true,
  },
  features: {
    postcss: false,
    emotionAlias: false,
    buildStoriesJson: true,
    interactionsDebugger: true,
    argTypeTargetsV7: true,
    storyStoreV7: true,
    modernInlineRender: true,
  },
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    {
      name: 'storybook-addon-turbo-build',
      options: {
        esbuildMinifyOptions: { target: 'es2022' },
        managerTranspiler: () => ({ loader: 'swc-loader', options: swcConfig }),
        previewTranspiler: () => ({ loader: 'swc-loader', options: swcConfig }),
      },
    },
  ],
  webpackFinal: (config) => {
    config.plugins.push(new webpack.DefinePlugin({ SC_DISABLE_SPEEDY: true }));
    config.performance.hints = false;

    return config;
  },
};

module.exports = config;
