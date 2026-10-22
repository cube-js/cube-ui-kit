import tastyConfig from '../../tasty.config';

import { renderColorTokens } from './colors';
import { getPaletteTokens } from './palette';

describe('tasty.config.ts', () => {
  // The ESLint plugin validates color tokens against this list, so a palette
  // token missing from it is reported as unknown wherever it is used.
  it('lists every color token the palette emits', () => {
    const listed = new Set<string>(tastyConfig.tokens);
    const emitted = Object.keys({
      ...getPaletteTokens(),
      ...renderColorTokens(),
    }).filter((name) => name.startsWith('#'));

    expect(emitted.filter((name) => !listed.has(name))).toEqual([]);
  });
});
