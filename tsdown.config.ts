import { readFileSync } from 'node:fs';

import { defineConfig } from 'tsdown';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

const banner = {
  js: `/** @license ${pkg.license} | ${pkg.name} v${pkg.version} | ${pkg.author} */`,
};

const define = {
  __UIKIT_VERSION__: JSON.stringify(pkg.version),
};

export default defineConfig({
  entry: {
    index: 'src/index.ts',
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
