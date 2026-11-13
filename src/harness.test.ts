/**
 * UI Kit's harness for coding agents (`harness/`, shared through harnesspm).
 * `pnpm check:harness` (`harnesspm check`, in CI) validates the harness. These
 * specs guard what it cannot see: the packages the manifest extends, the Glaze
 * and Tasty rule sections UI Kit patches, which must match the pinned
 * releases, and the `uikit:tokens` tool, which builds on Glaze's measuring
 * module.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as glazeModule from '@tenphi/glaze';

import {
  listTokens,
  loadMeasure,
  sourceFrom,
} from '../harness/dev.harnesspm/scripts/tokens.mjs';

import { getColorTokens } from './tokens/colors';
import { getCodeTheme, getPalette, getPaletteTokens } from './tokens/palette';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HARNESS = join(ROOT, 'harness');
const manifest = JSON.parse(readFileSync(join(HARNESS, 'plugin.json'), 'utf8'))
  .extensions['dev.harnesspm'];

// The same reading the tool does on `dist/`, done on `src/`.
const source = () =>
  sourceFrom({ getPalette, getCodeTheme, getPaletteTokens, getColorTokens });

const headingsOf = (text: string) =>
  text.split('\n').filter((line) => line.startsWith('## '));

describe('harness', () => {
  it('extends only packages that a consumer gets with UI Kit', () => {
    // harnesspm resolves `extends` from UI Kit's own dependencies, and skips
    // an optional peer quietly when the project does not install it. Any other
    // missing package would warn in every consumer.
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

    expect(manifest.extends).toEqual([
      '@tenphi/glaze',
      '@tenphi/tasty',
      '@tenphi/eslint-plugin-tasty',
    ]);

    for (const name of manifest.extends) {
      const optionalPeer =
        pkg.peerDependencies?.[name] !== undefined &&
        pkg.peerDependenciesMeta?.[name]?.optional === true;

      expect(pkg.dependencies?.[name] !== undefined || optionalPeer, name).toBe(
        true,
      );
    }
  });

  it('names files that exist', () => {
    for (const script of Object.values<{ file: string }>(manifest.scripts)) {
      expect(existsSync(join(HARNESS, script.file))).toBe(true);
    }

    for (const file of Object.values<string>(manifest.patch)) {
      expect(existsSync(join(HARNESS, file))).toBe(true);
    }
  });

  it('patches sections that the pinned upstream rules have', () => {
    // harnesspm replaces each `##` section of a patch by heading. A section
    // Glaze or Tasty renames stops applying, so pin the names here.
    const packageOf: Record<string, string> = {
      glaze: '@tenphi/glaze',
      tasty: '@tenphi/tasty',
    };

    expect(Object.keys(manifest.patch).sort()).toEqual([
      'glaze:rules/colors',
      'tasty:rules/usage',
    ]);

    for (const [id, file] of Object.entries<string>(manifest.patch)) {
      const [plugin, unit] = id.split(':');
      const rule = readFileSync(
        join(
          ROOT,
          'node_modules',
          packageOf[plugin],
          'harness/dev.harnesspm',
          `${unit}.md`,
        ),
        'utf8',
      );
      const patch = readFileSync(join(HARNESS, file), 'utf8');

      expect(headingsOf(patch).length, id).toBeGreaterThan(0);

      for (const heading of headingsOf(patch)) {
        expect(headingsOf(rule), id).toContain(heading);
      }
    }
  });
});

describe('uikit:tokens', () => {
  it("loads Glaze's public measuring module from the pinned Glaze", async () => {
    const measure = await loadMeasure();

    expect(typeof measure.inspectTheme).toBe('function');
    expect(measure.SCHEMES.map((s: { key: string }) => s.key)).toEqual([
      'light',
      'dark',
      'lightContrast',
      'darkContrast',
    ]);
  });

  it('lists every emitted token once, by its Tasty name', async () => {
    const measure = await loadMeasure();
    const { tokenNames, ...rest } = source();
    const tokens = listTokens(glazeModule, measure, { tokenNames, ...rest });
    const names = tokens
      .filter((t: { aliasOf?: string }) => !t.aliasOf)
      .map((t: { token: string }) => t.token);

    expect(new Set(names).size).toBe(names.length);
    expect(new Set(names)).toEqual(tokenNames);
    // The default theme is unprefixed, the others carry their name, and the
    // code theme adds only its `code-*` colors.
    expect(names).toContain('#surface');
    expect(names).toContain('#danger-accent-text');
    expect(names).toContain('#code-keyword');
  });

  it('shows what an alias resolves to, with its values', async () => {
    const measure = await loadMeasure();
    const byName = new Map<string, { aliasOf?: string; values: object }>(
      listTokens(glazeModule, measure, source()).map(
        (t: { token: string; aliasOf?: string; values: object }) => [
          t.token,
          t,
        ],
      ),
    );
    const soft = byName.get('#surface-text-soft')!.values;

    expect(byName.get('#dark-02')).toMatchObject({
      aliasOf: '#surface-text-soft',
      values: soft,
    });
    // An alias at an opacity shows its token's values; a value Glaze cannot
    // parse, such as `transparent`, shows itself.
    expect(byName.get('#minor')).toMatchObject({
      aliasOf: '#surface-text-soft.65',
      values: soft,
    });
    expect(byName.get('#clear')!.values).toMatchObject({ dark: 'transparent' });
    // A literal color follows the format: `#pink` is `okhsl(5 100% 67%)`.
    expect(byName.get('#pink')!.values).toMatchObject({
      light: expect.stringMatching(/^#[0-9a-f]{6}$/),
    });
    // A context hook shows its default.
    expect(byName.get('#current-fill')).toMatchObject({ aliasOf: '#surface' });
  });

  it('keeps tokens whose name has every part, with or without #', async () => {
    const measure = await loadMeasure();
    const tokens = listTokens(glazeModule, measure, source(), {
      filters: ['#Danger', 'accent-text'],
    });

    expect(tokens.map((t: { token: string }) => t.token)).toEqual([
      '#danger-accent-text',
      '#danger-accent-text-soft',
    ]);
  });

  it("measures each token against its base the way Glaze's solver does", async () => {
    const measure = await loadMeasure();
    const [text] = listTokens(glazeModule, measure, source(), {
      filters: ['danger-accent-text'],
    });

    // The base is named as a token of the same theme.
    expect(text.contrast).toMatchObject({
      base: '#danger-accent-selected-fill',
      metric: 'wcag',
    });
    expect(text.contrast.schemes.light).toMatchObject({
      target: 6,
      pass: true,
    });
    expect(text.contrast.schemes.darkContrast).toMatchObject({
      target: 11,
      pass: true,
    });
  });
});
