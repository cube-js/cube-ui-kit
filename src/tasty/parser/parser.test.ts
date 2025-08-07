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
    r: 'var(--radius)',
    cr: 'var(--card-radius)',
    bw: 'var(--border-width)',
    ow: 'var(--outline-width)',
    sf: (v) => `minmax(0, ${v}fr)`, // function handler that returns complete CSS value
  },
});

describe('StyleProcessor', () => {
  test('parses custom units and values', () => {
    const result = parser.process('1x 2x 3cr 1bw 4ow');
    expect(result.groups[0].values).toEqual([
      'var(--gap)',
      'calc(2 * var(--gap))',
      'calc(3 * var(--card-radius))',
      'var(--border-width)',
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
    const result = parser.process('$my-gap ($my-gap, 2x)');
    expect(result.groups[0].values).toEqual([
      'var(--my-gap)',
      'var(--my-gap, calc(2 * var(--gap)))',
    ]);
  });

  test('parses value modifiers', () => {
    const result = parser.process(
      'none auto max-content min-content fit-content stretch space-between',
    );
    expect(result.groups[0].values).toEqual([
      'auto',
      'max-content',
      'min-content',
      'fit-content',
      'stretch',
    ]);
    expect(result.groups[0].mods).toEqual(['none', 'space-between']);
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
    expect(result.groups[0].values).toEqual(['var(--border-width)']);
    expect(result.groups[0].colors).toEqual(['var(--purple-color)']);
    expect(result.groups[1].values).toEqual(['var(--outline-width)']);
    expect(result.groups[1].colors).toEqual(['var(--dark-05-color)']);
    expect(result.output).toEqual(
      'var(--border-width) top var(--purple-color), var(--outline-width) right var(--dark-05-color)',
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

  test('parses drop shadow value', () => {
    const dropShadow = 'drop-shadow(1x 2x 3x #dark.5)';
    const result = parser.process(dropShadow);
    expect(result.groups[0].values[0]).toEqual(
      'drop-shadow(var(--gap) calc(2 * var(--gap)) calc(3 * var(--gap)) rgb(var(--dark-color-rgb) / .5))',
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

  test('treats custom var/$ colors as colors', () => {
    const res = parser.process('$clear-color var(--clear-color)');
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

  test('parses empty string literal', () => {
    const res = parser.process('""');
    expect(res.groups[0].values).toEqual(['""']);
  });

  test('parses calc with custom props inside parentheses', () => {
    const expr = '($slider-range-end - $slider-range-start)';
    const res = parser.process(expr);
    expect(res.groups[0].values).toEqual([
      'calc(var(--slider-range-end) - var(--slider-range-start))',
    ]);
  });

  test('parses new custom property with fallback syntax', () => {
    const result = parser.process(
      '($custom-margin, 1x) ($theme-color, #purple)',
    );
    expect(result.groups[0].values).toEqual([
      'var(--custom-margin, var(--gap))',
      'var(--theme-color, var(--purple-color))',
    ]);
  });

  test('parses new custom property syntax in complex expressions', () => {
    const result = parser.process('(100% - (2 * ($custom-gap, 1x)))');
    expect(result.groups[0].values).toEqual([
      'calc(100% - calc(2 * var(--custom-gap, var(--gap))))',
    ]);
  });

  test('distinguishes between functions and custom property fallbacks', () => {
    // Test function with custom property as first argument
    const result1 = parser.process('sum($my-prop, 2x)');
    expect(result1.groups[0].values).toEqual([
      'calc(var(--my-prop) + calc(2 * var(--gap)))',
    ]);

    // Test custom property with fallback
    const result2 = parser.process('($my-prop, 2x)');
    expect(result2.groups[0].values).toEqual([
      'var(--my-prop, calc(2 * var(--gap)))',
    ]);

    // Test multiple scenarios in one expression
    const result3 = parser.process('sum($a, $b) ($fallback-prop, 1x)');
    expect(result3.groups[0].values).toEqual([
      'calc(var(--a) + var(--b))',
      'var(--fallback-prop, var(--gap))',
    ]);

    // Test edge case: function with custom property fallback as argument
    const result4 = parser.process('sum(($prop-a, 1x), ($prop-b, 2x))');
    expect(result4.groups[0].values).toEqual([
      'calc(var(--prop-a, var(--gap)) + var(--prop-b, calc(2 * var(--gap))))',
    ]);

    // Test color functions with custom properties
    const result5 = parser.process('rgb($red, $green, $blue)');
    expect(result5.groups[0].colors).toEqual([
      'rgb(var(--red),var(--green),var(--blue))',
    ]);

    // Test generic function (not user-defined)
    const result6 = parser.process('min($width, 100%)');
    expect(result6.groups[0].values).toEqual(['min(var(--width), 100%)']);

    // Test critical edge case: ensure no ambiguity in parsing order
    // Function name 'sum' vs custom property fallback starting with 'sum'
    const result7 = parser.process('sum($a, $b) ($sum, fallback)');
    expect(result7.groups[0].values).toEqual([
      'calc(var(--a) + var(--b))', // Function call
      'var(--sum, fallback)', // Custom property fallback (not a function)
    ]);
  });

  test('validates CSS custom property names correctly', () => {
    // Valid names
    const result1 = parser.process(
      '$valid-name $_underscore $hyphen-ok $abc123',
    );
    expect(result1.groups[0].values).toEqual([
      'var(--valid-name)',
      'var(--_underscore)',
      'var(--hyphen-ok)',
      'var(--abc123)',
    ]);

    // Invalid names (should become modifiers)
    const result2 = parser.process('$123invalid $-123invalid $0test $-');
    expect(result2.groups[0].mods).toEqual([
      '$123invalid',
      '$-123invalid',
      '$0test',
      '$-',
    ]);

    // Edge case: single character names
    const result3 = parser.process('$a $_ $1');
    expect(result3.groups[0].values).toEqual(['var(--a)', 'var(--_)']);
    expect(result3.groups[0].mods).toEqual(['$1']);
  });

  test('comprehensive collision testing for edge cases', () => {
    // Test 1: Auto-calc vs custom property fallback - similar patterns
    const result1 = parser.process('(100% - 2x) ($gap, 1x)');
    expect(result1.groups[0].values).toEqual([
      'calc(100% - calc(2 * var(--gap)))', // Auto-calc
      'var(--gap, var(--gap))', // Custom property fallback
    ]);

    // Test 2: URL with comma vs custom property fallback
    // NOTE: URLs merge with following tokens for background layers
    const result2 = parser.process(
      'url("img,with,comma.png") ($fallback, auto)',
    );
    expect(result2.groups[0].values).toEqual([
      'url("img,with,comma.png") var(--fallback, auto)', // URL merges with following token
    ]);

    // Test 3: Quoted strings that look like custom properties
    const result3 = parser.process(
      '"($not-a-prop, value)" ($real-prop, fallback)',
    );
    expect(result3.groups[0].values).toEqual([
      '"($not-a-prop, value)"', // Quoted string (not processed)
      'var(--real-prop, fallback)', // Custom property fallback
    ]);

    // Test 4: Color function with similar pattern
    const result4 = parser.process(
      'rgb($red, $green, $blue) ($color-fallback, #fff)',
    );
    expect(result4.groups[0].colors).toEqual([
      'rgb(var(--red),var(--green),var(--blue))',
    ]);
    expect(result4.groups[0].values).toEqual([
      'var(--color-fallback, var(--fff-color, #fff))',
    ]);

    // Test 5: Nested parentheses with custom properties
    const result5 = parser.process('(($outer, 10px) + ($inner, 5px))');
    expect(result5.groups[0].values).toEqual([
      'calc(var(--outer, 10px) + var(--inner, 5px))',
    ]);

    // Test 6: Invalid custom property patterns (should not match)
    const result6 = parser.process(
      '(not-a-prop, value) (@invalid-syntax, bad)',
    );
    expect(result6.groups[0].values).toEqual([
      'calc(not-a-prop, value)', // Auto-calc (no $ prefix)
      'var(--invalid-syntax, bad)', // @ is valid custom property prefix
    ]);

    // Test 7: Edge case with spaces and special characters
    // NOTE: Extra spaces cause the pattern to not match, falling back to auto-calc
    const result7 = parser.process('( $spaced , fallback ) ($compact,nospace)');
    expect(result7.groups[0].values).toEqual([
      'calc(var(--spaced), fallback)', // Extra spaces -> auto-calc, not custom property
      'var(--compact, nospace)', // No spaces are fine
    ]);

    // Test 8: Edge cases with regex boundaries
    // Now properly validates CSS custom property names
    const result8 = parser.process(
      '($123invalid, fallback) ($valid-name, fallback) ($_underscore, fallback) ($hyphen-ok, fallback)',
    );
    expect(result8.groups[0].values).toEqual([
      'calc($123invalid, fallback)', // Invalid (starts with number) -> auto-calc
      'var(--valid-name, fallback)', // Valid
      'var(--_underscore, fallback)', // Valid (underscore allowed)
      'var(--hyphen-ok, fallback)', // Valid (letter followed by hyphen)
    ]);

    // Test 9: Comma separation in complex scenarios
    const result9 = parser.process('($prop1, fallback), ($prop2, fallback)');
    expect(result9.groups.length).toBe(2); // Should create two groups
    expect(result9.groups[0].values).toEqual(['var(--prop1, fallback)']);
    expect(result9.groups[1].values).toEqual(['var(--prop2, fallback)']);
  });

  test('skips invalid functions while parsing (for example missing closing parenthesis)', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const expr =
      'blur(10px) drop-shadow(0 0 1px rgb(var(--dark-color-rgb) / 20%)';
    const res = parser.process(expr);

    expect(res.groups[0].values).toEqual(['blur(10px)']);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  test('parses function unit handlers correctly without double wrapping in calc()', () => {
    const result = parser.process('1sf 2sf');
    expect(result.groups[0].values).toEqual([
      'minmax(0, 1fr)', // should NOT be calc(minmax(0, 1fr))
      'minmax(0, 2fr)', // should NOT be calc(minmax(0, 2fr))
    ]);
  });

  test('handles string vs function unit handlers correctly', () => {
    // Test existing function handlers that return calc() expressions
    const result1 = parser.process('2r 3cr');
    expect(result1.groups[0].values).toEqual([
      'calc(2 * var(--radius))', // function returns complete calc() expression
      'calc(3 * var(--card-radius))', // function returns complete calc() expression
    ]);

    // Test parser with string unit (should be wrapped in calc())
    const customParser = new StyleParser({
      units: {
        gap: 'var(--my-gap)', // string unit, should be wrapped for multiplication
        func: (v) => `${v} * 10px`, // function unit, returns expression as-is
      },
    });
    const result2 = customParser.process('2gap 3func');
    expect(result2.groups[0].values).toEqual([
      'calc(2 * var(--my-gap))', // string unit gets calc() wrapping
      '3 * 10px', // function unit returns expression as-is
    ]);
  });
});
