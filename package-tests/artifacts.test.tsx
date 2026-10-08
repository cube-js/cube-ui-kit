import { resolve } from 'node:path';

import { checkReactPackage } from '../scripts/compiler/check-package.mjs';

it('ships React 19 peers and the intended native compiler output in the npm tarball', () => {
  const packageRoot = resolve('.cache/compiler-package/package');
  const uncompiled = process.env.UIKIT_TEST_UNCOMPILED === '1';
  checkReactPackage(packageRoot, {
    compiled: !uncompiled,
    dist: uncompiled
      ? resolve('dist-uncompiled')
      : resolve(packageRoot, 'dist'),
  });
});
