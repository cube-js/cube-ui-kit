import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

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

/** Runs the packed `uikit:colors` and returns its JSON. */
const tokens = (...args: string[]) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      [
        join(packageRoot, 'harness/dev.harnesspm/scripts/colors.mjs'),
        ...args,
        '--json',
      ],
      { encoding: 'utf8' },
    ),
  );

it('ships the harness: uikit:colors runs from the tarball', () => {
  expect(
    tokens('danger-accent-text').map((t: { token: string }) => t.token),
  ).toContain('#danger-accent-text');
  // The tool reads the aliases from the packed `dist/tokens/colors.js` too.
  expect(tokens('dark-02')[0]).toMatchObject({
    token: '#dark-02',
    aliasOf: '#surface-text-soft',
  });
  // --on measures a token on another surface, held to its own floor.
  expect(tokens('danger-accent-text', '--on', 'surface')[0].on).toMatchObject({
    surface: '#surface',
    metric: 'wcag',
    schemes: { light: { target: 6, pass: true } },
  });
});

it('ships the docs as plain Markdown in docs/, which llms.txt indexes for the harness', () => {
  const manifest = JSON.parse(
    readFileSync(join(packageRoot, 'harness/plugin.json'), 'utf8'),
  );
  const docs = resolve(
    packageRoot,
    'harness',
    manifest.extensions['dev.harnesspm'].docs,
  );
  const pages = readdirSync(docs, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(docs, join(entry.parentPath, entry.name)))
    .filter((page) => page !== 'llms.txt');
  const index = readFileSync(join(docs, 'llms.txt'), 'utf8');
  const linked = [...index.matchAll(/^- \[.*?\]\(([^)]+)\)/gm)].map(
    ([, link]) => link,
  );

  expect(docs).toBe(join(packageRoot, 'docs'));
  expect(pages.length).toBeGreaterThan(100);
  expect(pages).toEqual(
    expect.arrayContaining([
      'Usage.md',
      'components/actions/Button.md',
      'components/form/ModernForm.md',
      'components/form/modern-form-migration.md',
    ]),
  );
  // harnesspm uses llms.txt as the index: it lists every page, once.
  expect(linked.sort()).toEqual(pages.sort());
  // Nothing contributor-only ships: no docs/rules, and no Storybook sources.
  expect(existsSync(join(packageRoot, 'src'))).toBe(false);

  for (const page of pages) {
    const text = readFileSync(join(docs, page), 'utf8');

    // The build fails on a page with Storybook markup or a route left in its
    // prose (`scripts/prepare-docs.mjs`), so here only its title.
    expect(text, page).toMatch(/^# /);
  }
});

it('passes harnesspm check as packed: every docs link leads to a shipped file', () => {
  // `prepack` runs the same check in the repository. This one reads exactly
  // what ships.
  const output = execFileSync(
    resolve('node_modules/.bin/harnesspm'),
    ['check', packageRoot],
    { encoding: 'utf8' },
  );

  expect(output).toContain('harness is valid');
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
