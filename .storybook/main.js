// @ts-check
const webpack = require('webpack');

const swcConfig = {
  jsc: {
    parser: { syntax: 'typescript', tsx: true },
    target: 'es2019',
    transform: { react: { runtime: 'automatic' } },
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
        managerTranspiler: () => ({ loader: 'swc-loader', options: swcConfig }),
        previewTranspiler: () => ({ loader: 'swc-loader', options: swcConfig }),
      },
    },
  ],
  webpackFinal: async (config) => {
    config.plugins.push(new webpack.DefinePlugin({ SC_DISABLE_SPEEDY: true }));
    return config;
  },
};

module.exports = config;
