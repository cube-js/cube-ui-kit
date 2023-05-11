// @ts-check

/**
 * @readonly
 * @type {import('@swc/core').Config}
 */
const swcConfig = {
  jsc: {
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
  framework: { name: '@storybook/react-vite', options: {} },
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
        esbuildMinifyOptions: { target: 'es2021' },
        managerTranspiler: () => ({ loader: 'swc-loader', options: swcConfig }),
        previewTranspiler: () => ({ loader: 'swc-loader', options: swcConfig }),
      },
    },
  ],
  docs: {
    autodocs: true,
  },
};

export default config;
