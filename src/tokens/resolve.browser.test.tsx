import { renderWithRoot } from '../test';

import { resolvePresetValues, resolveTokenValue } from './resolve';

/**
 * The jsdom spec next door covers the logic; this one covers the assumption the
 * logic rests on, which only a real engine can answer.
 *
 * `resolve.ts` decides whether a read is trustworthy from `--tokens-applied`,
 * not from the value, because tasty's `@property` defaults are not all obvious
 * duds — off the token block `--gap` reads `4px`, not `0px`. Those defaults live
 * in another package, and every assertion below is really about them: that they
 * exist, that they are plausible enough to fool value inspection, and that the
 * marker separates them from real values regardless.
 */
describe('token resolution against a real engine', () => {
  it('should read a declared token off the element <Root> declares it on', () => {
    renderWithRoot(<div />);

    const purple = resolveTokenValue('#purple');

    expect(purple).toBeTruthy();
    expect(purple).not.toBe('rgba(0, 0, 0, 0)');

    expect(resolveTokenValue('$space-md')).toBe('8px');
  });

  it('should refuse what <html> hands back, dud or not', () => {
    renderWithRoot(<div />);

    // `<Root>` declares the token block on `<body>`, so `<html>` is outside it
    // and every token there reads as tasty's registered default.
    const html = document.documentElement;
    const read = (name: string) =>
      getComputedStyle(html).getPropertyValue(name).trim();

    // Some defaults are obvious duds...
    expect(read('--purple-color')).toBe('rgba(0, 0, 0, 0)');
    expect(read('--t3-font-size')).toBe('0px');
    // ...and some are entirely plausible values that happen to be wrong. This is
    // the case no value-shape check could ever catch: the kit's gap is 8px.
    expect(read('--gap')).toBe('4px');
    expect(read('--radius')).toBe('6px');
    expect(read('--transition')).toBe('0.08s');

    // Not empty: tasty types the marker like any other token and registers
    // `initial-value: 0` for it. `1` is what the token block declares.
    expect(read('--tokens-applied')).toBe('0');
    expect(
      getComputedStyle(document.body)
        .getPropertyValue('--tokens-applied')
        .trim(),
    ).toBe('1');

    for (const token of ['#purple', '$t3-font-size', '$gap', '$transition']) {
      expect(resolveTokenValue(token, { element: html })).toBe(null);
    }

    expect(resolveTokenValue('$gap', { element: html, fallback: '8px' })).toBe(
      '8px',
    );
    // The same token, read where the tokens actually are.
    expect(resolveTokenValue('$gap')).toBe('8px');
  });

  it('should keep a real value indistinguishable from an unset one', () => {
    renderWithRoot(<div />);

    // Each of these computes to exactly what an undeclared property of the same
    // type would, so they only survive because the marker — not the value — is
    // what the guard reads. `#scrollbar-outline` reaches `transparent` through a
    // reference to `#clear`, and `$h2-letter-spacing` is declared in `em`.
    expect(resolveTokenValue('#clear')).toBe('rgba(0, 0, 0, 0)');
    expect(resolveTokenValue('$sharp-radius')).toBe('0px');
    expect(resolveTokenValue('#scrollbar-outline')).toBe('rgba(0, 0, 0, 0)');
    expect(resolveTokenValue('#scrollbar-corner')).toBe('rgba(0, 0, 0, 0)');
    expect(resolveTokenValue('$h2-letter-spacing')).toBe('0px');
    expect(resolvePresetValues('h2').letterSpacing).toBe('0px');
  });

  it('should resolve a preset to real font descriptors', () => {
    renderWithRoot(<div />);

    expect(resolvePresetValues('t3')).toMatchObject({
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: '400',
    });

    // Only the `s*` family names a family; everything else falls back to the
    // document's `--font-sans`.
    expect(resolvePresetValues('s3').fontFamily).toContain('monospace');
    expect(resolvePresetValues('t3').fontFamily).not.toContain('monospace');
  });
});
