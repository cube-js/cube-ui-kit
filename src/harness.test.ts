/**
 * UI Kit's harness for coding agents (`harness/`, shared through harnesspm).
 * harnesspm does not run in CI yet, so these specs guard what its `check`
 * would: the files the manifest names, the Glaze rule section UI Kit patches,
 * and the `uikit:tokens` tool, which builds on Glaze's inspector.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as glazeModule from '@tenphi/glaze';

import {
  listTokens,
  loadMeasure,
} from '../harness/dev.harnesspm/scripts/tokens.mjs';

import { getColorTokens } from './tokens/colors';
import { getCodeTheme, getPalette, getPaletteTokens } from './tokens/palette';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HARNESS = join(ROOT, 'harness');
const manifest = JSON.parse(readFileSync(join(HARNESS, 'plugin.json'), 'utf8'))
  .extensions['dev.harnesspm'];

function source() {
  const tokenNames = new Set(Object.keys(getPaletteTokens()));

  return {
    palette: getPalette(),
    codeTheme: getCodeTheme(),
    tokenNames,
    // As the tool reads them: every other `#name` defined by reference.
    aliases: new Map(
      Object.entries(getColorTokens()).filter(
        (entry): entry is [string, string] =>
          typeof entry[1] === 'string' && !tokenNames.has(entry[0]),
      ),
    ),
  };
}

const headingsOf = (text: string) =>
  text.split('\n').filter((line) => line.startsWith('## '));

describe('harness', () => {
  it('names files that exist', () => {
    for (const script of Object.values<{ file: string }>(manifest.scripts)) {
      expect(existsSync(join(HARNESS, script.file))).toBe(true);
    }

    for (const file of Object.values<string>(manifest.patch)) {
      expect(existsSync(join(HARNESS, file))).toBe(true);
    }
  });

  it('patches sections that the pinned Glaze rule has', () => {
    // harnesspm replaces each `##` section of a patch by heading. A section
    // Glaze renames stops applying, so pin the names here.
    const glazeRule = readFileSync(
      join(
        ROOT,
        'node_modules/@tenphi/glaze/harness/dev.harnesspm/rules/colors.md',
      ),
      'utf8',
    );
    const patch = readFileSync(
      join(HARNESS, manifest.patch['glaze:rules/colors']),
      'utf8',
    );

    expect(headingsOf(patch).length).toBeGreaterThan(0);

    for (const heading of headingsOf(patch)) {
      expect(headingsOf(glazeRule)).toContain(heading);
    }
  });
});

describe('uikit:tokens', () => {
  it("finds Glaze's measuring module next to the pinned Glaze", async () => {
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

  it('shows the token a legacy alias stands for, with its values', async () => {
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
    // An alias at an opacity shows its token's values; a literal shows itself.
    expect(byName.get('#minor')).toMatchObject({
      aliasOf: '#surface-text-soft.65',
      values: soft,
    });
    expect(byName.get('#clear')!.values).toMatchObject({ dark: 'transparent' });
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
