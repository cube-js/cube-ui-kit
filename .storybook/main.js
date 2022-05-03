// @ts-check
const webpack = require('webpack');

/** @type {import('@storybook/core-common').StorybookConfig} */
const config = {
  staticDirs: ['../public'],
  framework: '@storybook/react',
  features: {
    postcss: false,
    emotionAlias: false,
    buildStoriesJson: true,
    interactionsDebugger: true,
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
