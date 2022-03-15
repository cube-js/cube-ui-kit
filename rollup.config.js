import { terser } from 'rollup-plugin-terser';
import visualizer from 'rollup-plugin-visualizer';
import replace from 'rollup-plugin-replace';
import localResolve from 'rollup-plugin-local-resolve';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import postcss from 'rollup-plugin-postcss';
import typescript from '@rollup/plugin-typescript';

import pkg from './packages/cube-ui-kit/package.json';

const src = './packages/cube-ui-kit';
const author = pkg.author;
const moduleName = pkg.name;
const banner = `
  /**
   * @license
   * author: ${author}
   * ${moduleName} v${pkg.version}
   * Released under the ${pkg.license} license.
   */
`;
const DEV = !!process.env.ROLLUP_WATCH;
const ENV = DEV ? 'development' : 'production';
const VERSION = `"${pkg.version}"`;
const getPlugins = (type) => [
  visualizer(),
  postcss({
    minimize: true,
    use: {
      sass: null,
      stylus: null,
      less: null,
    },
  }),
  replace({
    'process.env.NODE_ENV': JSON.stringify(ENV),
    'process.env.APP_VERSION': VERSION,
  }),
  typescript({
    tsconfig: `tsconfig.${type}.json`,
  }),
  commonjs(),
  nodeResolve(),
  localResolve({
    extensions: ['.jsx', '.js', '.tsx', '.ts'],
  }),
  json(),
  ENV === 'development' ? undefined : terser(),
];
const external = ['react', 'react-dom', 'styled-components'];

export default [
  {
    input: `${src}/src/index.ts`,
    output: [
      {
        name: 'Cube Cloud UIKit',
        dir: 'dist/mjs',
        format: 'es',
        sourcemap: true,
        banner,
      },
    ],
    external,
    inlineDynamicImports: true,
    plugins: getPlugins('mjs'),
  },
].concat(
  !process.env.ESM_BUILD_ONLY
    ? [
        {
          input: `${src}/src/index.ts`,
          output: [
            {
              name: 'Cube Cloud UIKit',
              dir: 'dist/cjs',
              format: 'cjs',
              sourcemap: true,
              banner,
            },
          ],
          external,
          inlineDynamicImports: true,
          plugins: getPlugins('cjs'),
        },
      ]
    : [],
);
