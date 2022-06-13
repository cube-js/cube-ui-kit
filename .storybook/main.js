// @ts-check
const webpack = require('webpack');

/** @type {import('@storybook/core-common').StorybookConfig} */
const config = {
  staticDirs: ['../public'],
  framework: '@storybook/react',
  core: {
    builder: {
      name: 'webpack5',
      options: { fsCache: true, lazyCompilation: true },
    },
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
  ],
  webpackFinal: async (config) => {
    config.plugins.push(new webpack.DefinePlugin({ SC_DISABLE_SPEEDY: true }));
    return config;
  },
};

module.exports = config;
