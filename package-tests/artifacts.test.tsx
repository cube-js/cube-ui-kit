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

/** Runs the packed `uikit:tokens` and returns its JSON. */
const tokens = (...args: string[]) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      [
        join(packageRoot, 'harness/dev.harnesspm/scripts/tokens.mjs'),
        ...args,
        '--json',
      ],
      { encoding: 'utf8' },
    ),
  );

it('ships the harness: uikit:tokens runs from the tarball and the docs index links resolve', () => {
  expect(
    tokens('danger-accent-text').map((t: { token: string }) => t.token),
  ).toContain('#danger-accent-text');
  // The tool reads the aliases from the packed `dist/tokens/colors.js` too.
  expect(tokens('dark-02')[0]).toMatchObject({
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

it("ships the setup the Tasty patch names: tasty:styles loads UI Kit's config from the tarball", () => {
  const patch = readFileSync(
    join(packageRoot, 'harness/dev.harnesspm/patches/tasty-usage.patch.md'),
    'utf8',
  );
  const setup = patch.match(/--setup @cube-dev\/ui-kit\/(\S+?)`/)?.[1];

  expect(setup).toBeDefined();

  const result = JSON.parse(
    execFileSync(
      process.execPath,
      [
        resolve(
          'node_modules/@tenphi/tasty/harness/dev.harnesspm/scripts/styles.mjs',
        ),
        '{"padding":"2x","fill":"#surface"}',
        '--setup',
        join(packageRoot, setup!),
        '--json',
      ],
      { encoding: 'utf8' },
    ),
  );

  expect(result.config.units.x).toBe('var(--gap)');
  expect(result.css).toContain('padding: calc(2 * var(--gap))');
  expect(result.warnings).toEqual([]);
});
