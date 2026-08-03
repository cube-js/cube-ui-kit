import { readFileSync } from 'node:fs';

import { defineConfig } from 'tsdown';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const tastyPkg = JSON.parse(
  readFileSync('./node_modules/@tenphi/tasty/package.json', 'utf-8'),
);

const banner = {
  js: `/** @license ${pkg.license} | ${pkg.name} v${pkg.version} | ${pkg.author} */`,
};

const define = {
  __UIKIT_VERSION__: JSON.stringify(pkg.version),
  __TASTY_VERSION__: JSON.stringify(tastyPkg.version),
};

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    // Second entry so `@cube-dev/ui-kit/eslint-plugin` stays version-locked to
    // the components its defaults registry describes. It imports only the
    // registry and its types, so linting never pulls React into the lint
    // process.
    'eslint-plugin/index': 'src/eslint-plugin/index.ts',
  },
  format: 'esm',
  outDir: 'dist',
  unbundle: true,
  dts: true,
  platform: 'browser',
  target: 'es2022',
  sourcemap: true,
  clean: true,
  inlineOnly: false,
  banner,
  define,
  copy: ['README.md', 'CHANGELOG.md'],
});
