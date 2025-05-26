import { StyleParser } from './parser';
import { StyleDetails } from './types';

const parser = new StyleParser({
  funcs: {
    sum(parsed: StyleDetails[]) {
      return `calc(${parsed
        .map((s) => s.values[0])
        .filter(Boolean)
        .join(' + ')})`;
    },
  },
  units: {
    x: '8px',
    r: (v) => `calc(${v} * var(--radius))`,
    cr: (v) => `calc(${v} * var(--card-radius))`,
    bw: (v) => `calc(${v} * var(--border-width))`,
    ow: (v) => `calc(${v} * var(--outline-width))`,
  },
});

describe('StyleProcessor', () => {
  test('parses custom units and values', () => {
    const result = parser.process('1x 2x 3cr 1bw 4ow');
    expect(result.groups[0].values).toEqual([
      'var(--gap)',
      'calc(2 * var(--gap))',
      'calc(3 * var(--card-radius))',
      'calc(1 * var(--border-width))',
      'calc(4 * var(--outline-width))',
    ]);
  });

  test('parses color tokens and color functions', () => {
    const result = parser.process(
      '#dark #purple.0 #purple.5 #purple.05 rgb(10,20,30) hsl(10,20%,30%)',
    );
    expect(result.groups[0].colors).toEqual([
      'var(--dark-color)',
      'rgb(var(--purple-color-rgb) / 0)',
      'rgb(var(--purple-color-rgb) / .5)',
      'rgb(var(--purple-color-rgb) / .05)',
      'rgb(10,20,30)',
      'hsl(10,20%,30%)',
    ]);
  });

  test('parses custom properties', () => {
    const result = parser.process('@my-gap @(my-gap, 2x)');
    expect(result.groups[0].values).toEqual([
      'var(--my-gap)',
      'var(--my-gap, calc(2 * var(--gap)))',
    ]);
  });

  test('parses value modifiers', () => {
    const result = parser.process(
      'none auto max-content min-content fit-content stretch',
    );
    expect(result.groups[0].values).toEqual([
      'none',
      'auto',
      'max-content',
      'min-content',
      'fit-content',
    ]);
    expect(result.groups[0].mods).toEqual(['stretch']);
  });

  test('parses modifiers', () => {
    const result = parser.process('styled thin always');
    expect(result.groups[0].mods).toEqual(['styled', 'thin', 'always']);
  });

  test('parses user functions and nested functions', () => {
    const result = parser.process('sum(1x, 2r, 3cr) min(1x, 2r)');
    expect(result.groups[0].values).toEqual([
      'calc(var(--gap) + calc(2 * var(--radius)) + calc(3 * var(--card-radius)))',
      'min(var(--gap), calc(2 * var(--radius)))',
    ]);
  });

  test('splits by top-level comma', () => {
    const result = parser.process('1bw top #purple, 1ow right #dark-05');
    expect(result.groups.length).toBe(2);
    expect(result.groups[0].values).toEqual(['calc(1 * var(--border-width))']);
    expect(result.groups[0].colors).toEqual(['var(--purple-color)']);
    expect(result.groups[1].values).toEqual(['calc(1 * var(--outline-width))']);
    expect(result.groups[1].colors).toEqual(['var(--dark-05-color)']);
    expect(result.output).toEqual(
      'calc(1 * var(--border-width)) top var(--purple-color), calc(1 * var(--outline-width)) right var(--dark-05-color)',
    );
    expect(result.groups[0].mods).toEqual(['top']);
    expect(result.groups[1].mods).toEqual(['right']);
  });

  test('handles edge cases and whitespace', () => {
    const result = parser.process('  2x   (100% - 2r)   max-content  ');
    expect(result.groups[0].values[0]).toContain('calc(2 * var(--gap))');
    expect(result.groups[0].values[1]).toContain(
      'calc(100% - calc(2 * var(--radius)))',
    );
    expect(result.groups[0].values[2]).toContain('max-content');
  });

  test('caches results', () => {
    const a = parser.process('2x 3cr');
    const b = parser.process('2x 3cr');
    expect(a.groups).toBe(b.groups); // should be the same object from cache
  });

  test('parses linear-gradient value', () => {
    const gradients = 'linear-gradient(90deg, #a1b2c3 0%, #000 100%)';
    const result = parser.process(gradients);
    expect(result.groups[0].values[0]).toEqual(
      'linear-gradient(90deg, var(--a1b2c3-color, #a1b2c3) 0%, var(--000-color, #000) 100%)',
    );
  });

  test('parses background value with url and gradient', () => {
    const background =
      'url(image.png) no-repeat center/cover, linear-gradient(45deg, red, blue)';
    const result = parser.process(background);
    expect(result.output).toEqual(background);
    expect(result.groups[0].values).toEqual([
      'url(image.png) no-repeat center/cover',
    ]);
    expect(result.groups[1].values).toEqual([
      'linear-gradient(45deg, red, blue)',
    ]);
  });

  test('parses grid-template-columns value', () => {
    const grid = '1fr 2fr minmax(100px, 1fr)';
    const result = parser.process(grid);
    expect(result.output).toEqual(grid);
    expect(result.groups[0].values).toEqual([
      '1fr',
      '2fr',
      'minmax(100px, 1fr)',
    ]);
  });

  test('parses fractional unit values', () => {
    const result = parser.process('.75x');
    expect(result.groups[0].values[0]).toBe('calc(0.75 * var(--gap))');
  });

  test('parses negative unit values', () => {
    const result = parser.process('-2x -.5r');
    expect(result.groups[0].values).toEqual([
      'calc(-2 * var(--gap))',
      'calc(-0.5 * var(--radius))',
    ]);
  });

  test('treats custom var/@ colors as colors', () => {
    const res = parser.process('@clear-color var(--clear-color)');
    expect(res.groups[0].colors).toEqual([
      'var(--clear-color)',
      'var(--clear-color)',
    ]);
  });

  test('recognises transparent keyword as color', () => {
    const r = parser.process('transparent 1x');
    expect(r.groups[0].colors).toEqual(['transparent']);
    expect(r.groups[0].values).toContain('var(--gap)');
  });

  test('handles hyphenated #color names', () => {
    const r = parser.process('#dark-02');
    expect(r.groups[0].colors).toEqual(['var(--dark-02-color)']);
  });
});
