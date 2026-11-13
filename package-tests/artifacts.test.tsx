import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
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

it('ships the harness: uikit:tokens runs from the tarball', () => {
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

it('ships only doc pages in src/, which the harness indexes as its docs', () => {
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
    .map((entry) => relative(docs, join(entry.parentPath, entry.name)));

  expect(docs).toBe(join(packageRoot, 'src'));
  expect(pages.length).toBeGreaterThan(100);
  // harnesspm lists every page in this folder, so nothing contributor-only
  // (AGENTS.md, specs, READMEs) and no code may ship here.
  for (const page of pages) {
    expect(page).toMatch(
      /\.docs\.mdx$|^components\/form\/Form\/modern-form-[a-z-]+\.md$/,
    );
  }
  expect(pages).toContain('stories/Usage.docs.mdx');
  expect(pages).toContain('components/form/Form/modern-form-guide.md');
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
