// @ts-check
import { readFileSync } from 'node:fs';

import react from '@vitejs/plugin-react';
import remarkGfm from 'remark-gfm';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const tastyPkg = JSON.parse(
  readFileSync('./node_modules/@tenphi/tasty/package.json', 'utf-8'),
);

const config = {
  staticDirs: ['../public'],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  stories: ['../src/**/*.docs.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],

  addons: [
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
    const isReactPlugin = (/** @type {string} */ name) =>
      name.startsWith('vite:react') || name.startsWith('@vitejs/plugin-react');
    const existingPlugins = (config.plugins ?? [])
      .flat()
      .filter(
        (p) =>
          p &&
          typeof p === 'object' &&
          !isReactPlugin(/** @type {any} */ (p).name ?? ''),
      );

    config.plugins = [...existingPlugins, react({ jsxRuntime: 'automatic' })];

    config.build ??= {};
    config.build.rolldownOptions ??= {};
    config.build.rolldownOptions.experimental = {
      strictExecutionOrder: true,
    };

    config.define = {
      ...config.define,
      __UIKIT_VERSION__: JSON.stringify(pkg.version),
      __TASTY_VERSION__: JSON.stringify(tastyPkg.version),
    };

    return config;
  },
};
export default config;
