// @ts-check
import remarkGfm from 'remark-gfm';

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

  stories: ['../src/**/*.docs.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],

  addons: [
    '@storybook/addon-links',
    {
      name: 'storybook-addon-turbo-build',
      options: {
        esbuildMinifyOptions: {
          target: 'es2021',
        },
      },
    },
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
  ],
};
export default config;
