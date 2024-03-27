// @ts-check

/** @type {import('@storybook/core-common').StorybookConfig} */
const config = {
  staticDirs: ['../public'],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  features: {
    postcss: false,
    emotionAlias: false,
    buildStoriesJson: true,
    interactionsDebugger: true,
    argTypeTargetsV7: false,
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
        esbuildMinifyOptions: {
          target: 'es2021',
        },
      },
    },
  ],

  docs: {
    autodocs: true,
  },
};
export default config;
