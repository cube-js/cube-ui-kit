import { terser } from 'rollup-plugin-terser';
import visualizer from 'rollup-plugin-visualizer';
import babel from '@rollup/plugin-babel';
import replace from 'rollup-plugin-replace';
import localResolve from 'rollup-plugin-local-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import postcss from 'rollup-plugin-postcss';
import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';

const VARIABLES = require('./src/less-variables');

const LESS_VARIABLES = {};

// Create LESS variable map.
Object.keys(VARIABLES)
  .forEach((key) => {
    LESS_VARIABLES[`@${key}`] = VARIABLES[key];
  });

const DEV = !!process.env.ROLLUP_WATCH;
const ENV = DEV ? 'development' : 'production';
const VERSION = `"${pkg.version}"`;
const plugins = [
  visualizer(),
  postcss({
    minimize: true,
    use: {
      sass: null,
      stylus: null,
      less: null,
    },
  }),
  // babel({
  //   extensions: ['.js', '.jsx', '.ts', '.tsx'],
  //   presets: [
  //     '@babel/react',
  //     '@babel/preset-typescript',
  //     [
  //       '@babel/preset-env',
  //       {
  //         shippedProposals: true,
  //         useBuiltIns: 'usage',
  //         corejs: 3,
  //       },
  //     ],
  //   ],
  //   plugins: [
  //     [
  //       '@babel/plugin-transform-runtime',
  //       {
  //         corejs: false,
  //         helpers: true,
  //         regenerator: true,
  //         useESModules: false,
  //       },
  //     ],
  //     '@babel/plugin-proposal-object-rest-spread',
  //     '@babel/plugin-syntax-dynamic-import',
  //     'transform-react-remove-prop-types',
  //   ],
  //   exclude: ['node_modules/**', /\/core-js\//, /\/dist\//],
  //   babelHelpers: 'runtime',
  // }),
  replace({
    'process.env.NODE_ENV': JSON.stringify(ENV),
    'process.env.APP_VERSION': VERSION,
  }),
  commonjs(),
  localResolve({
    extensions: ['.jsx', '.js', '.tsx', '.ts'],
  }),
  typescript({
    typescript: require('typescript'),
    tsconfig: 'tsconfig.json',
  }),
  json(),
  ENV === 'development' ? undefined : terser(),
];

export default [
  {
    input: 'src/index.ts',
    external: ['react', 'react-dom', 'styled-components'],
    output: [{
      // file: pkg.module,
      name: 'Cube Cloud UIKit',
      dir: './dist/',
      format: 'es',
      sourcemap: true,
    }],
    inlineDynamicImports: true,
    plugins,
  },
  {
    input: 'src/antd.js',
    output: [{
      name: 'Cube Cloud AntD',
      dir: './dist/',
      format: 'es',
    }],
    plugins: [
      babel({
        presets: [
          '@babel/react',
        ],
        plugins: [
          '@babel/plugin-proposal-object-rest-spread',
          '@babel/plugin-syntax-dynamic-import',
          'transform-react-remove-prop-types',
          // ['import', { libraryName: 'antd', style: true }],
        ],
        exclude: /node_modules/,
        babelHelpers: 'bundled',
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify(ENV),
        'process.env.APP_VERSION': VERSION,
      }),
      localResolve({
        extensions: ['.jsx', '.js'],
        preferBuiltins: false,
      }),
      commonjs(),
      json(),
      postcss({
        minimize: true,
        use: {
          sass: null,
          stylus: null,
          less: {
            javascriptEnabled: true,
            modifyVars: LESS_VARIABLES,
          }
        },
      }),
      ENV === 'development' ? undefined : terser(),
    ]
  }
];
