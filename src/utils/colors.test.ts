import {
  parseColorFunction,
  parseSrgbColor,
  readAlpha,
  readComponent,
  readHue,
} from './colors';

/**
 * The grammar layer under both the color fields and `toLegacyColor()`. What is
 * pinned here is the *contract between them*: which literals are readable, and
 * how a component's unit is reported — because the two consumers scale
 * percentages differently and only they know what `100%` means in a position.
 */
describe('parseColorFunction()', () => {
  it('separates the name, the components and alpha', () => {
    expect(parseColorFunction('oklch(0.55 0.21 285 / 0.4)')).toEqual({
      name: 'oklch',
      args: ['0.55', '0.21', '285'],
      alpha: '0.4',
    });
  });

  it('reports a missing alpha as null rather than as a default', () => {
    // `1` would be a lie for a space where the caller wants to know whether the
    // author wrote one at all.
    expect(parseColorFunction('oklch(0.55 0.21 285)')?.alpha).toBeNull();
  });

  it('reads the legacy comma syntax, alpha included', () => {
    expect(parseColorFunction('rgba(97, 71, 214, 0.4)')).toEqual({
      name: 'rgba',
      args: ['97', '71', '214'],
      alpha: '0.4',
    });
  });

  it('keeps each component unit, so the caller can scale it', () => {
    expect(parseColorFunction('oklch(55% 52.5% 285deg / 40%)')).toEqual({
      name: 'oklch',
      args: ['55%', '52.5%', '285deg'],
      alpha: '40%',
    });
  });

  it('lowercases and trims', () => {
    expect(parseColorFunction('  RGB(1 2 3)  ')?.name).toBe('rgb');
  });

  it('accepts `none` as a component', () => {
    expect(parseColorFunction('oklch(0.5 none 200 / none)')).toEqual({
      name: 'oklch',
      args: ['0.5', 'none', '200'],
      alpha: 'none',
    });
  });

  it.each([
    ['a nested function', 'oklch(calc(1 * 2) 0.21 285)'],
    ['relative syntax over a var()', 'oklch(from var(--x) l c h)'],
    ['color-mix()', 'color-mix(in oklab, #fff 40%, #000)'],
    ['a non-numeric component', 'oklch(from #fff l c h)'],
    ['two slashes', 'oklch(0.5 0.2 200 / 0.4 / 0.2)'],
    ['alpha given twice', 'rgba(1, 2, 3, 0.4 / 0.2)'],
    ['a non-numeric alpha', 'rgb(1 2 3 / auto)'],
    ['a bare keyword', 'transparent'],
    ['a bare number', '285'],
    ['an unclosed call', 'oklch(0.5 0.2 200'],
  ])('refuses %s', (_label, value) => {
    expect(parseColorFunction(value)).toBeNull();
  });

  it('does not care about arity — that is the space’s business', () => {
    // `parseSrgbColor()` is what requires three components; the grammar only
    // reports what it found, so a space with a different arity can reuse it.
    expect(parseColorFunction('rgb(1 2)')?.args).toEqual(['1', '2']);
  });
});

describe('readComponent()', () => {
  it('scales a percentage by what 100% means in this position', () => {
    expect(readComponent('50%', 255)).toBe(127.5);
    expect(readComponent('52.5%', 0.4)).toBeCloseTo(0.21, 12);
  });

  it('takes a bare number as written', () => {
    expect(readComponent('0.21', 0.4)).toBe(0.21);
  });

  it('reads scientific notation', () => {
    expect(readComponent('1e-7', 1)).toBe(1e-7);
    expect(readComponent('-1.5e2', 1)).toBe(-150);
  });

  it('resolves `none` to zero', () => {
    expect(readComponent('none', 255)).toBe(0);
  });

  it('refuses an angle where a number belongs', () => {
    expect(readComponent('50deg', 100)).toBeNaN();
  });

  it('stays linear on a long run of unit characters', () => {
    // Reading the unit back with an unanchored `/[a-z%]+$/` is quadratic here
    // (CodeQL `js/polynomial-redos`): every start position re-walks the run of
    // `%` before failing at `$`. The unit is a capture group of the anchored
    // NUMBER_RE instead, so this is one pass.
    //
    // The trailing `!` is what makes the input pathological rather than merely
    // long — the old scan matched a run that reached the end of the string
    // immediately, and only blew up (~2s at this size) once the match had to
    // fail. Unparseable either way; what is asserted is that it returns.
    const pathological = `1${'%'.repeat(60_000)}!`;
    const started = Date.now();

    expect(readComponent(pathological, 100)).toBeNaN();
    expect(readHue(pathological)).toBeNaN();
    expect(readAlpha(pathological)).toBeNaN();
    expect(parseColorFunction(`rgb(1 2 ${pathological})`)).toBeNull();

    expect(Date.now() - started).toBeLessThan(1000);
  });
});

describe('readHue()', () => {
  it('normalizes into 0–360', () => {
    expect(readHue('-75')).toBe(285);
    expect(readHue('645')).toBe(285);
    expect(readHue('360')).toBe(0);
  });

  it('converts every angle unit a <hue> accepts', () => {
    expect(readHue('90deg')).toBe(90);
    expect(readHue('0.25turn')).toBe(90);
    expect(readHue('100grad')).toBe(90);
    expect(readHue('1.5707963267948966rad')).toBeCloseTo(90, 9);
  });

  it('refuses a percentage, which is not an angle', () => {
    expect(readHue('50%')).toBeNaN();
  });

  it('resolves `none` to zero', () => {
    expect(readHue('none')).toBe(0);
  });
});

describe('readAlpha()', () => {
  it('treats an absent alpha as opaque', () => {
    expect(readAlpha(null)).toBe(1);
  });

  it('reads both the fraction and the percentage form', () => {
    expect(readAlpha('0.4')).toBe(0.4);
    expect(readAlpha('40%')).toBeCloseTo(0.4, 12);
  });

  it('clamps out of range', () => {
    expect(readAlpha('2')).toBe(1);
    expect(readAlpha('-1')).toBe(0);
  });

  it('resolves `none` to fully transparent', () => {
    expect(readAlpha('none')).toBe(0);
  });

  it('reports an unreadable alpha rather than guessing', () => {
    expect(readAlpha('30deg')).toBeNaN();
  });
});

describe('parseSrgbColor()', () => {
  it('reports channels in 0–1 and alpha separately', () => {
    expect(parseSrgbColor('#ff000080')).toEqual({
      rgb: [1, 0, 0],
      alpha: 128 / 255,
    });
  });

  it('defaults a missing alpha to opaque', () => {
    expect(parseSrgbColor('rgb(255 0 0)')).toEqual({
      rgb: [1, 0, 0],
      alpha: 1,
    });
  });

  it('clamps channels into the gamut', () => {
    expect(parseSrgbColor('rgb(300 -20 0)')).toEqual({
      rgb: [1, 0, 0],
      alpha: 1,
    });
  });

  it('reads `transparent`, the one named color the kit declares', () => {
    expect(parseSrgbColor('transparent')).toEqual({
      rgb: [0, 0, 0],
      alpha: 0,
    });
  });

  it('requires three components', () => {
    expect(parseSrgbColor('rgb(1 2)')).toBeNull();
  });

  it('refuses a space it cannot convert', () => {
    expect(parseSrgbColor('color(display-p3 0.4 0.3 0.8)')).toBeNull();
    expect(parseSrgbColor('lab(50% 40 30)')).toBeNull();
  });
});
