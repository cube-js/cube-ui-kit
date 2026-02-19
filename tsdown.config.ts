import { readFileSync } from 'node:fs';

import { defineConfig } from 'tsdown';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

const banner = {
  js: `/** @license ${pkg.license} | ${pkg.name} v${pkg.version} | ${pkg.author} */`,
};

const define = {
  __UIKIT_VERSION__: JSON.stringify(pkg.version),
};

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      'tasty/static/index': 'src/tasty/static/index.ts',
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
    copy: ['README.md', 'CHANGELOG.md', 'tasty.config.ts'],
  },
  {
    entry: {
      'tasty/zero/index': 'src/tasty/zero/index.ts',
      'tasty/zero/babel': 'src/tasty/zero/babel.ts',
      'tasty/zero/next': 'src/tasty/zero/next.ts',
    },
    format: 'esm',
    outDir: 'dist',
    unbundle: true,
    dts: true,
    platform: 'node',
    target: 'es2022',
    fixedExtension: false,
    sourcemap: true,
    clean: false,
    inlineOnly: false,
    banner,
    define,
  },
]);
