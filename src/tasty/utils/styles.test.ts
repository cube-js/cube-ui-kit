import {
  computeState,
  extractStyles,
  getRgbValuesFromRgbaString,
  strToRgb,
} from './styles';

describe('computeState', () => {
  function checkNormalization(list) {
    list.forEach((obj, i) => {
      it(`input ${i}`, () => {
        // @ts-ignore
        expect(computeState(...obj.input)).toEqual(obj.output);
      });
    });
  }

  const AND = '&';
  const OR = '|';
  const XOR = '^';

  describe('State normalization', () => {
    checkNormalization([
      {
        input: [
          [XOR, [OR, [AND, 2, 2], 1], 0],
          [1, 0, 1],
        ],
        output: !!(((1 & 1) | 0) ^ 1),
      },
      {
        input: [
          [OR, [AND, [XOR, 2, 2], 1], 0],
          [1, 0, 1],
        ],
        output: !!(((1 ^ 1) & 0) | 1),
      },
      {
        input: [
          [AND, [OR, [XOR, 2, 2], 1], 0],
          [1, 0, 1],
        ],
        output: !!(((1 ^ 1) | 0) & 1),
      },
    ]);
  });
});

describe('extractStyles', () => {
  function checkExtraction(list) {
    list.forEach((obj, i) => {
      it(`to list ${i}`, () => {
        // @ts-ignore
        expect(extractStyles(...obj.input)).toEqual(obj.output);
      });
    });
  }

  describe('Should extract styles from props', () => {
    checkExtraction([
      {
        input: [
          {
            fill: '#black',
            border: false,
            styles: { fill: '#clear', border: true, color: '#dark' },
          },
          ['fill', 'border'],
        ],
        output: {
          fill: '#black',
          border: false,
          color: '#dark',
        },
      },
    ]);
  });
});

describe('getRgbValuesFromRgbaString', () => {
  it('extracts RGB values from comma-separated integers', () => {
    expect(getRgbValuesFromRgbaString('rgb(255, 128, 0)')).toEqual([
      255, 128, 0,
    ]);
    expect(getRgbValuesFromRgbaString('rgba(10, 20, 30)')).toEqual([
      10, 20, 30,
    ]);
  });

  it('extracts RGB values from space-separated integers', () => {
    expect(getRgbValuesFromRgbaString('rgb(255 128 0)')).toEqual([255, 128, 0]);
    expect(getRgbValuesFromRgbaString('rgba(10 20 30)')).toEqual([10, 20, 30]);
  });

  it('extracts RGB values from fractional numbers', () => {
    expect(getRgbValuesFromRgbaString('rgb(128.5, 64.3, 32.1)')).toEqual([
      128.5, 64.3, 32.1,
    ]);
    expect(getRgbValuesFromRgbaString('rgb(128.5 64.3 32.1)')).toEqual([
      128.5, 64.3, 32.1,
    ]);
  });

  it('converts percentage values to 0-255 range', () => {
    expect(getRgbValuesFromRgbaString('rgb(50%, 25%, 75%)')).toEqual([
      127.5, 63.75, 191.25,
    ]);
    expect(getRgbValuesFromRgbaString('rgb(100%, 0%, 50%)')).toEqual([
      255, 0, 127.5,
    ]);
  });

  it('handles slash alpha notation (ignores alpha, returns RGB only)', () => {
    expect(getRgbValuesFromRgbaString('rgb(255 128 0 / 0.5)')).toEqual([
      255, 128, 0,
    ]);
    expect(getRgbValuesFromRgbaString('rgb(255 128 0 / .75)')).toEqual([
      255, 128, 0,
    ]);
    expect(getRgbValuesFromRgbaString('rgba(10 20 30 / 50%)')).toEqual([
      10, 20, 30,
    ]);
  });

  it('handles mixed fractional with alpha', () => {
    expect(getRgbValuesFromRgbaString('rgb(128.5 64.3 32.1 / .75)')).toEqual([
      128.5, 64.3, 32.1,
    ]);
  });

  it('returns empty array for invalid input', () => {
    expect(getRgbValuesFromRgbaString('invalid')).toEqual([]);
    expect(getRgbValuesFromRgbaString('#fff')).toEqual([]);
    expect(getRgbValuesFromRgbaString('')).toEqual([]);
  });
});

describe('strToRgb', () => {
  it('passes through rgb values', () => {
    expect(strToRgb('rgb(255 100 50)')).toBe('rgb(255 100 50)');
    expect(strToRgb('rgba(255, 100, 50, 0.5)')).toBe('rgba(255, 100, 50, 0.5)');
  });

  it('converts hex to rgb', () => {
    // hexToRgb returns comma-separated format
    expect(strToRgb('#ff0000')).toBe('rgb(255 0 0)');
    expect(strToRgb('#fff')).toBe('rgb(255 255 255)');
  });

  it('converts hsl to rgb', () => {
    expect(strToRgb('hsl(0 100% 50%)')).toBe('rgb(255 0 0)');
    expect(strToRgb('hsl(120 100% 50%)')).toBe('rgb(0 255 0)');
    expect(strToRgb('hsl(240 100% 50%)')).toBe('rgb(0 0 255)');
  });

  it('converts okhsl to rgb', () => {
    // Purple: okhsl(280.3 80% 52%) should produce a blueish-purple color
    const result = strToRgb('okhsl(280.3 80% 52%)');
    expect(result).toMatch(/^rgb\(\d+ \d+ \d+\)$/);

    // Extract RGB values and verify they're in the purple range
    const match = result?.match(/rgb\((\d+) (\d+) (\d+)\)/);
    expect(match).toBeTruthy();
    const [, r, g, b] = match!;
    // Purple should have significant blue, lower red, and low green
    expect(parseInt(b)).toBeGreaterThan(parseInt(g));
  });

  it('converts okhsl with alpha to rgba', () => {
    const result = strToRgb('okhsl(280.3 80% 52% / 0.5)');
    expect(result).toMatch(/^rgba\(\d+, \d+, \d+, 0\.5\)$/);
  });

  it('returns null for unknown formats', () => {
    expect(strToRgb('unknown')).toBeNull();
    expect(strToRgb('oklch(50% 0.2 250)')).toBeNull();
  });

  it('returns undefined for falsy input', () => {
    expect(strToRgb('')).toBeUndefined();
    expect(strToRgb(null)).toBeUndefined();
    expect(strToRgb(undefined)).toBeUndefined();
  });
});
