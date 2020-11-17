import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import replace from 'rollup-plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import postcss from 'rollup-plugin-postcss';
import pkg from './package.json';

const VARIABLES = require('./src/variables');

const LESS_VARIABLES = {};

// Create LESS variable map.
Object.keys(VARIABLES)
  .forEach((key) => {
    LESS_VARIABLES[`@${key}`] = VARIABLES[key];
  });

const DEV = !!process.env.ROLLUP_WATCH;
const ENV = DEV ? 'development' : 'production';
const VERSION = `"${pkg.version}"`;

export default [
  {
    input: 'src/index.js',
    external: ['react', 'react-dom'],
    output: [{
      name: 'Cube Cloud UIKit',
      dir: `./dist/`,
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
        ],
        exclude: /node_modules/,
        babelHelpers: 'bundled',
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify(ENV),
        'process.env.APP_VERSION': VERSION,
      }),
      resolve({
        extensions: ['.jsx', '.js'],
      }),
      commonjs(),
      json(),
      ENV === 'development' ? undefined : terser(),
    ]
  },
  {
    input: 'src/antd.js',
    external: ['react', 'react-dom', 'antd'],
    output: [{
      name: 'Cube Cloud AntD',
      dir: `./dist/`,
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
      resolve({
        extensions: ['.jsx', '.js'],
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
  }];
