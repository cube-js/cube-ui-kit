// @vitest-environment node
import { moduleSpecifiers } from './check-package.mjs';

it('checks actual module imports without matching comments or arbitrary strings', () => {
  expect(
    moduleSpecifiers(`
    // import { c } from 'react-compiler-runtime';
    const label = 'react-compiler-runtime';
    import { c } from 'react/compiler-runtime';
    export { value } from './value.js';
    const load = () => import('react-compiler-runtime');
    const legacy = require('legacy-runtime');
  `),
  ).toEqual([
    'react/compiler-runtime',
    './value.js',
    'react-compiler-runtime',
    'legacy-runtime',
  ]);
});
