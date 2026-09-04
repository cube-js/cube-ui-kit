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
  // Identity mapping, on purpose. `platform: 'browser'` makes rolldown inline
  // `process.env.NODE_ENV` as the literal NODE_ENV of *this* build, so every
  // consumer inherited whatever the release machine happened to export -
  // `isDevEnv()` shipped as `"development" !== "test" && ... !== "production"`,
  // i.e. `true` in production. Defining the expression as itself wins over that
  // injection and leaves the read in the output, where the consumer's own
  // bundler (webpack/Vite/Next all define it) or Node resolves it for the
  // environment that is actually running. Keep the canonical
  // `process.env.NODE_ENV` spelling at the read sites: that is the only form
  // those bundlers match.
  'process.env.NODE_ENV': 'process.env.NODE_ENV',
};

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    // Second entry so `@cube-dev/ui-kit/eslint-plugin` stays version-locked to
    // the components its defaults registry describes. It imports only the
    // registry and its types, so linting never pulls React into the lint
    // process.
    'eslint-plugin/index': 'src/eslint-plugin/index.ts',
    // Third entry: DOM-pure helpers for tooling that inspects rendered output
    // (`@cube-dev/ui-kit/probe`). Version-locked for the same reason as above —
    // the class-name pattern it normalises is tasty's, and the CSS it reads is
    // this package's.
    'probe/index': 'src/probe/index.ts',
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
