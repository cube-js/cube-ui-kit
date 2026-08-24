import { renderWithRoot } from '../test';

import { resolvePresetValues, resolveTokenValue } from './resolve';

/**
 * The jsdom spec next door covers the logic; this one covers the assumption the
 * logic rests on, which only a real engine can answer.
 *
 * `resolve.ts` treats `rgba(0, 0, 0, 0)`, `0px`, `0deg`, `0s` and `0` as "not
 * declared here", because those are the `initial-value`s tasty auto-registers
 * through `@property`. That set lives in another package. If tasty ever stops
 * registering those rules, or registers them with different initials, the guard
 * silently starts either passing placeholders through or discarding real values
 * — and nothing else in this repo would notice.
 */
describe('token resolution against a real engine', () => {
  it('should read a declared token off the element <Root> declares it on', () => {
    renderWithRoot(<div />);

    const purple = resolveTokenValue('#purple');

    expect(purple).toBeTruthy();
    expect(purple).not.toBe('rgba(0, 0, 0, 0)');

    expect(resolveTokenValue('$space-md')).toBe('8px');
  });

  it('should refuse the @property placeholder <html> hands back', () => {
    renderWithRoot(<div />);

    // The placeholder is real: `<Root>` declares tokens on `<body>`, so `<html>`
    // is outside the block and every token there reads as its registered initial.
    const html = document.documentElement;

    expect(
      getComputedStyle(html).getPropertyValue('--purple-color').trim(),
    ).toBe('rgba(0, 0, 0, 0)');
    expect(
      getComputedStyle(html).getPropertyValue('--t3-font-size').trim(),
    ).toBe('0px');

    expect(resolveTokenValue('#purple', { element: html })).toBe(null);
    expect(resolveTokenValue('$t3-font-size', { element: html })).toBe(null);
    expect(
      resolveTokenValue('#purple', { element: html, fallback: '#000' }),
    ).toBe('#000');
  });

  it('should keep a token whose declared value is placeholder-shaped', () => {
    renderWithRoot(<div />);

    // `#clear` really is `transparent`, so it must survive the guard that the
    // identical-looking placeholder above does not.
    expect(resolveTokenValue('#clear')).toBe('rgba(0, 0, 0, 0)');
    expect(resolveTokenValue('$sharp-radius')).toBe('0px');
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
