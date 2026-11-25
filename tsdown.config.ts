import { readFileSync } from 'node:fs';

import { defineConfig } from 'tsdown';

import { reactCompilerPlugin } from './scripts/compiler/transform.mjs';

import type { UserConfig } from 'tsdown';

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

/** The library build. Exported for the spec that builds one file with it. */
export const library: UserConfig = {
  plugins:
    process.env.UIKIT_REACT_COMPILER === 'off' ? [] : [reactCompilerPlugin()],
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
  deps: { onlyBundle: false },
  banner,
  define,
  copy: ['README.md', 'CHANGELOG.md'],
};

export default defineConfig([
  library,
  {
    // `uikit:colors` loads this one file: Glaze, its measuring module and the
    // palette, with everything they import bundled in. It may import nothing,
    // so the tool runs from a package that harnesspm fetched without an install.
    entry: { 'harness/colors-deps': 'src/harness/colors-deps.ts' },
    format: 'esm',
    outDir: 'dist',
    platform: 'node',
    target: 'es2022',
    // `.js`, which `files` in package.json ships, not the node platform's `.mjs`.
    fixedExtension: false,
    dts: false,
    minify: true,
    clean: true,
    deps: { alwaysBundle: [/./], onlyBundle: false, onlyImport: [] },
    banner,
  },
]);
