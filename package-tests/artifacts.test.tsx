import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { checkReactPackage } from '../scripts/compiler/check-package.mjs';

const packageRoot = resolve('.cache/compiler-package/package');

it('ships React 19 peers and the intended native compiler output in the npm tarball', () => {
  const uncompiled = process.env.UIKIT_TEST_UNCOMPILED === '1';
  checkReactPackage(packageRoot, {
    compiled: !uncompiled,
    dist: uncompiled
      ? resolve('dist-uncompiled')
      : resolve(packageRoot, 'dist'),
  });
});

it('ships the harness: uikit:tokens runs from the tarball and the docs index links resolve', () => {
  const output = execFileSync(
    process.execPath,
    [
      join(packageRoot, 'harness/dev.harnesspm/scripts/tokens.mjs'),
      'danger-accent-text',
      '--json',
    ],
    { encoding: 'utf8' },
  );

  expect(JSON.parse(output).map((t: { token: string }) => t.token)).toContain(
    '#danger-accent-text',
  );

  // The tool reads the aliases from the packed `dist/tokens/colors.js` too.
  const [alias] = JSON.parse(
    execFileSync(
      process.execPath,
      [
        join(packageRoot, 'harness/dev.harnesspm/scripts/tokens.mjs'),
        'dark-02',
        '--json',
      ],
      { encoding: 'utf8' },
    ),
  );

  expect(alias).toMatchObject({
    token: '#dark-02',
    aliasOf: '#surface-text-soft',
  });

  const index = readFileSync(join(packageRoot, 'docs/llms.txt'), 'utf8');
  const links = [...index.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);

  expect(links.length).toBeGreaterThan(100);

  for (const link of links) {
    expect(existsSync(join(packageRoot, 'docs', link)), link).toBe(true);
  }
});
