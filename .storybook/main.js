// @ts-check
import { readFileSync } from 'node:fs';

import react from '@vitejs/plugin-react';
import remarkGfm from 'remark-gfm';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

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

  viteFinal(config) {
    const REACT_PLUGIN_NAMES = ['vite:react-babel', 'vite:react-refresh'];
    const existingPlugins = (config.plugins ?? [])
      .flat()
      .filter(
        (p) =>
          p &&
          typeof p === 'object' &&
          !REACT_PLUGIN_NAMES.includes(/** @type {any} */ (p).name),
      );

    config.plugins = [...existingPlugins, react({ jsxRuntime: 'automatic' })];

    config.define = {
      ...config.define,
      __UIKIT_VERSION__: JSON.stringify(pkg.version),
    };

    return config;
  },
};
export default config;
