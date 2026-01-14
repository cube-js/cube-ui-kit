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
    colorize(parsed: StyleDetails[]) {
      // Returns a color value - should be classified as color
      return `rgb(${parsed.map((s) => s.input).join(', ')})`;
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
      '8px', // raw unit: 1 * 8px = 8px
      '16px', // raw unit: 2 * 8px = 16px
      'calc(3 * var(--card-radius))', // non-raw unit: uses calc()
      'var(--border-width)', // non-raw unit: 1x returns base directly
      'calc(4 * var(--outline-width))', // non-raw unit: uses calc()
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
      'var(--my-gap, 16px)', // raw unit: 2 * 8px = 16px
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
      'calc(8px + calc(2 * var(--radius)) + calc(3 * var(--card-radius)))',
      'min(8px, calc(2 * var(--radius)))',
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
    expect(result.groups[0].values[0]).toBe('16px'); // raw unit: 2 * 8px
    expect(result.groups[0].values[1]).toBe(
      'calc(100% - calc(2 * var(--radius)))',
    );
    expect(result.groups[0].values[2]).toBe('max-content');
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
      'drop-shadow(8px 16px 24px rgb(var(--dark-color-rgb) / .5))', // raw units calculated
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
    expect(result.groups[0].values[0]).toBe('6px'); // raw unit: 0.75 * 8px = 6px
  });

  test('parses negative unit values', () => {
    const result = parser.process('-2x -.5r');
    expect(result.groups[0].values).toEqual([
      '-16px', // raw unit: -2 * 8px = -16px
      'calc(-0.5 * var(--radius))', // non-raw unit: uses calc()
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
    expect(r.groups[0].values).toContain('8px'); // raw unit
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
      'var(--custom-margin, 8px)', // raw unit fallback
    ]);
    // $theme-color is now classified as a color since it ends with -color
    expect(result.groups[0].colors).toEqual([
      'var(--theme-color, var(--purple-color))',
    ]);
  });

  test('parses new custom property syntax in complex expressions', () => {
    const result = parser.process('(100% - (2 * ($custom-gap, 1x)))');
    expect(result.groups[0].values).toEqual([
      'calc(100% - calc(2 * var(--custom-gap, 8px)))', // raw unit fallback
    ]);
  });

  test('distinguishes between functions and custom property fallbacks', () => {
    // Test function with custom property as first argument
    const result1 = parser.process('sum($my-prop, 2x)');
    expect(result1.groups[0].values).toEqual([
      'calc(var(--my-prop) + 16px)', // raw unit: 2 * 8px = 16px
    ]);

    // Test custom property with fallback
    const result2 = parser.process('($my-prop, 2x)');
    expect(result2.groups[0].values).toEqual([
      'var(--my-prop, 16px)', // raw unit fallback
    ]);

    // Test multiple scenarios in one expression
    const result3 = parser.process('sum($a, $b) ($fallback-prop, 1x)');
    expect(result3.groups[0].values).toEqual([
      'calc(var(--a) + var(--b))',
      'var(--fallback-prop, 8px)', // raw unit fallback
    ]);

    // Test edge case: function with custom property fallback as argument
    const result4 = parser.process('sum(($prop-a, 1x), ($prop-b, 2x))');
    expect(result4.groups[0].values).toEqual([
      'calc(var(--prop-a, 8px) + var(--prop-b, 16px))', // raw unit fallbacks
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
      'calc(100% - 16px)', // Auto-calc with raw unit
      'var(--gap, 8px)', // Custom property fallback with raw unit
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
      'calc(@invalid-syntax, bad)', // Auto-calc (@ is not valid, only $ is)
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

  test('parses color fallback syntax', () => {
    // Single fallback
    const result1 = parser.process('(#primary, #fallback)');
    expect(result1.groups[0].colors).toEqual([
      'var(--primary-color, var(--fallback-color))',
    ]);
    expect(result1.output).toBe('var(--primary-color, var(--fallback-color))');

    // Hex literal fallback
    const result2 = parser.process('(#primary, #fff)');
    expect(result2.groups[0].colors).toEqual([
      'var(--primary-color, var(--fff-color, #fff))',
    ]);

    // CSS function fallback
    const result3 = parser.process('(#primary, rgb(255 0 0))');
    expect(result3.groups[0].colors).toEqual([
      'var(--primary-color, rgb(255 0 0))',
    ]);

    // Nested fallbacks (2 levels)
    const result4 = parser.process('(#primary, (#secondary, #tertiary))');
    expect(result4.groups[0].colors).toEqual([
      'var(--primary-color, var(--secondary-color, var(--tertiary-color)))',
    ]);

    // Nested fallbacks (3+ levels)
    const result5 = parser.process('(#a, (#b, (#c, #d)))');
    expect(result5.groups[0].colors).toEqual([
      'var(--a-color, var(--b-color, var(--c-color, var(--d-color))))',
    ]);

    // Mixed nesting with literals
    const result6 = parser.process('(#primary, (#secondary, rgb(0 0 0)))');
    expect(result6.groups[0].colors).toEqual([
      'var(--primary-color, var(--secondary-color, rgb(0 0 0)))',
    ]);

    // Verify bucket classification is Color, not Value
    expect(result1.groups[0].values).toEqual([]);
    expect(result1.groups[0].mods).toEqual([]);
  });

  test('color fallback works with existing color tokens', () => {
    // Color fallback with named tokens
    const result1 = parser.process('(#placeholder, #dark-04)');
    expect(result1.groups[0].colors).toEqual([
      'var(--placeholder-color, var(--dark-04-color))',
    ]);

    // Multiple color fallbacks in one expression
    const result2 = parser.process('(#a, #b) (#c, #d)');
    expect(result2.groups[0].colors).toEqual([
      'var(--a-color, var(--b-color))',
      'var(--c-color, var(--d-color))',
    ]);

    // Color fallback with hex literal
    const result3 = parser.process('(#theme, #3366ff)');
    expect(result3.groups[0].colors).toEqual([
      'var(--theme-color, var(--3366ff-color, #3366ff))',
    ]);
  });

  test('distinguishes color fallback from custom property fallback', () => {
    // Color fallback (starts with #)
    const result1 = parser.process('(#primary, #fallback)');
    expect(result1.groups[0].colors).toEqual([
      'var(--primary-color, var(--fallback-color))',
    ]);
    expect(result1.groups[0].values).toEqual([]);

    // Custom property fallback (starts with $)
    const result2 = parser.process('($primary, $fallback)');
    expect(result2.groups[0].values).toEqual([
      'var(--primary, var(--fallback))',
    ]);
    expect(result2.groups[0].colors).toEqual([]);

    // Custom property with -color suffix should be classified as color
    const result3 = parser.process('($primary-color, $fallback-color)');
    expect(result3.groups[0].colors).toEqual([
      'var(--primary-color, var(--fallback-color))',
    ]);
    expect(result3.groups[0].values).toEqual([]);
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

  test('provides input property with original unparsed string for each group', () => {
    // Single group
    const result1 = parser.process('1x 2x #purple');
    expect(result1.groups[0].input).toBe('1x 2x #purple');

    // Multiple groups (comma-separated)
    const result2 = parser.process('1bw top #purple, 1ow right #dark-05');
    expect(result2.groups[0].input).toBe('1bw top #purple');
    expect(result2.groups[1].input).toBe('1ow right #dark-05');

    // With whitespace (normalized in lower-case)
    const result3 = parser.process('  2x   max-content  ');
    expect(result3.groups[0].input).toBe('2x max-content');
  });

  test('custom function receives groups with input property', () => {
    // Create a parser with a custom function that uses input
    const inputCapture: string[] = [];
    const testParser = new StyleParser({
      funcs: {
        capture(parsed: StyleDetails[]) {
          inputCapture.push(...parsed.map((g) => g.input));
          return 'captured';
        },
      },
    });

    testParser.process('capture(foo bar, baz qux)');
    expect(inputCapture).toEqual(['foo bar', 'baz qux']);
  });

  test('custom function returning color is classified as color', () => {
    // colorize function returns rgb(...) which should be classified as color
    // Note: rgb() is a color function, so it processes inner and removes spaces after commas
    const result = parser.process('colorize(100, 200, 50)');
    expect(result.groups[0].colors).toEqual(['rgb(100,200,50)']);
    expect(result.groups[0].values).toEqual([]);
  });

  test('custom function returning value is classified as value', () => {
    // sum function returns calc(...) which should be classified as value
    const result = parser.process('sum(1x, 2x)');
    expect(result.groups[0].values).toEqual([
      'calc(8px + 16px)', // raw units calculated
    ]);
    expect(result.groups[0].colors).toEqual([]);
  });

  test('parses modern RGB syntax with fractional numbers', () => {
    // Fractional comma-separated values
    const result1 = parser.process('rgb(128.5, 64.3, 32.1)');
    expect(result1.groups[0].colors).toEqual(['rgb(128.5,64.3,32.1)']);

    // Space-separated integers
    const result2 = parser.process('rgb(255 128 0)');
    expect(result2.groups[0].colors).toEqual(['rgb(255 128 0)']);

    // Percentage values
    const result3 = parser.process('rgb(50%, 25%, 75%)');
    expect(result3.groups[0].colors).toEqual(['rgb(50%,25%,75%)']);

    // Space-separated with slash alpha
    const result4 = parser.process('rgb(255 128 0 / 0.5)');
    expect(result4.groups[0].colors).toEqual(['rgb(255 128 0 / 0.5)']);

    // Mixed: fractional with alpha
    const result5 = parser.process('rgb(128.5 64.3 32.1 / .75)');
    expect(result5.groups[0].colors).toEqual(['rgb(128.5 64.3 32.1 / .75)']);
  });

  test('raw units are calculated directly instead of using calc()', () => {
    // Create parser with raw unit
    const rawParser = new StyleParser({
      units: {
        px8: '8px', // raw unit
        gap: 'var(--gap)', // non-raw unit (CSS variable)
      },
    });

    // Raw unit: calculated directly
    const result1 = rawParser.process('2px8');
    expect(result1.groups[0].values).toEqual(['16px']); // 2 * 8px = 16px

    // Non-raw unit: uses calc()
    const result2 = rawParser.process('2gap');
    expect(result2.groups[0].values).toEqual(['calc(2 * var(--gap))']);

    // Raw unit with 1x multiplier returns base value
    const result3 = rawParser.process('1px8');
    expect(result3.groups[0].values).toEqual(['8px']); // 1 * 8px = 8px
  });

  test('units can reference other units recursively', () => {
    // Create parser with recursive units
    const recursiveParser = new StyleParser({
      units: {
        x: '8px', // base raw unit
        y: '2x', // references x unit -> 2 * 8px = 16px
        z: '2y', // references y unit -> 2 * 16px = 32px
      },
    });

    // Base unit
    const result1 = recursiveParser.process('1x');
    expect(result1.groups[0].values).toEqual(['8px']);

    // One level of recursion
    const result2 = recursiveParser.process('1y');
    expect(result2.groups[0].values).toEqual(['16px']); // 2 * 8px = 16px

    // Two levels of recursion
    const result3 = recursiveParser.process('1z');
    expect(result3.groups[0].values).toEqual(['32px']); // 2 * 16px = 32px

    // Multiplied recursive unit
    const result4 = recursiveParser.process('3y');
    expect(result4.groups[0].values).toEqual(['48px']); // 3 * 16px = 48px
  });

  test('mixed raw and non-raw units work correctly', () => {
    // Create parser with both types
    // Note: avoid naming custom units after native CSS units (px, rem, etc.)
    // as this shadows the native unit and causes recursive resolution
    const mixedParser = new StyleParser({
      units: {
        sp: '4px', // raw unit (spacing)
        lg: '16px', // raw unit (large)
        gap: 'var(--gap)', // non-raw unit
      },
    });

    const result = mixedParser.process('2sp 3lg 2gap');
    expect(result.groups[0].values).toEqual([
      '8px', // raw: 2 * 4px
      '48px', // raw: 3 * 16px
      'calc(2 * var(--gap))', // non-raw: uses calc()
    ]);
  });
});

describe('Predefined tokens', () => {
  // Import inline to avoid circular dependency issues at module load time
  let setGlobalPredefinedTokens: (tokens: Record<string, string>) => void;
  let resetGlobalPredefinedTokens: () => void;
  let getGlobalPredefinedTokens: () => Record<string, string> | null;

  beforeAll(() => {
    // Dynamic import to get the functions
    const styles = jest.requireActual('../utils/styles');
    setGlobalPredefinedTokens = styles.setGlobalPredefinedTokens;
    resetGlobalPredefinedTokens = styles.resetGlobalPredefinedTokens;
    getGlobalPredefinedTokens = styles.getGlobalPredefinedTokens;
  });

  beforeEach(() => {
    // Reset tokens before each test
    resetGlobalPredefinedTokens();
  });

  afterEach(() => {
    // Cleanup after tests
    resetGlobalPredefinedTokens();
  });

  test('predefined $token is replaced with its value', () => {
    setGlobalPredefinedTokens({
      $spacing: '2x',
    });

    const result = parser.process('$spacing');
    // $spacing = '2x' = 2 * 8px = 16px
    expect(result.output).toBe('16px');
  });

  test('predefined #token is replaced with color value', () => {
    setGlobalPredefinedTokens({
      '#accent': '#purple',
    });

    const result = parser.process('#accent');
    // #accent = '#purple' -> var(--purple-color)
    expect(result.output).toBe('var(--purple-color)');
  });

  test('predefined tokens work in complex expressions', () => {
    setGlobalPredefinedTokens({
      '$card-padding': '4x',
      '#surface': '#white',
    });

    const padding = parser.process('$card-padding');
    expect(padding.output).toBe('32px'); // 4 * 8px

    const fill = parser.process('#surface');
    expect(fill.output).toBe('var(--white-color)');
  });

  test('undefined tokens fall through to default behavior', () => {
    // No tokens configured
    const result = parser.process('$unknown');
    // Should use default $name -> var(--name) behavior
    expect(result.output).toBe('var(--unknown)');
  });

  test('predefined tokens can reference other tokens', () => {
    setGlobalPredefinedTokens({
      '#primary': '#purple.5',
    });

    const result = parser.process('#primary');
    // #primary = '#purple.5' -> rgb(var(--purple-color-rgb) / .5)
    expect(result.output).toBe('rgb(var(--purple-color-rgb) / .5)');
  });

  test('opacity suffix works with predefined color tokens', () => {
    setGlobalPredefinedTokens({
      '#accent': '#purple',
    });

    // #accent.5 should resolve #accent to #purple, then apply .5 opacity
    const result = parser.process('#accent.5');
    expect(result.output).toBe('rgb(var(--purple-color-rgb) / .5)');
  });

  test('opacity suffix works with predefined rgb() color tokens', () => {
    setGlobalPredefinedTokens({
      '#brand': 'rgb(100 150 200)',
    });

    // #brand.5 should resolve to rgb(100 150 200) with .5 opacity
    const result = parser.process('#brand.5');
    expect(result.output).toBe('rgb(100 150 200 / .5)');
  });

  test('opacity suffix works with predefined rgba() color tokens', () => {
    setGlobalPredefinedTokens({
      '#overlay': 'rgba(0, 0, 0, 0.8)',
    });

    // #overlay.5 should apply .5 opacity to rgba color
    const result = parser.process('#overlay.5');
    // Opacity is replaced, normalized to modern rgb syntax
    expect(result.output).toBe('rgb(0 0 0 / .5)');
  });

  test('opacity suffix works with predefined okhsl() color tokens', () => {
    setGlobalPredefinedTokens({
      '#okhsl-color': 'okhsl(250 80% 60%)',
    });

    // #okhsl-color.5 should apply .5 opacity, preserving okhsl color space
    const result = parser.process('#okhsl-color.5');
    expect(result.output).toBe('okhsl(250 80% 60% / .5)');
  });

  test('opacity suffix works with predefined hsl() color tokens', () => {
    setGlobalPredefinedTokens({
      '#primary': 'hsl(220 90% 50%)',
    });

    // #primary.5 should apply .5 opacity, preserving hsl color space
    const result = parser.process('#primary.5');
    expect(result.output).toBe('hsl(220 90% 50% / .5)');
  });

  test('opacity suffix works with predefined oklch() color tokens', () => {
    setGlobalPredefinedTokens({
      '#oklch-color': 'oklch(70% 0.15 250)',
    });

    // #oklch-color.5 should apply .5 opacity, preserving oklch color space
    const result = parser.process('#oklch-color.5');
    expect(result.output).toBe('oklch(70% 0.15 250 / .5)');
  });

  test('opacity suffix normalizes hsla to hsl', () => {
    setGlobalPredefinedTokens({
      '#legacy': 'hsla(180, 50%, 50%, 0.8)',
    });

    // Should normalize to modern hsl syntax with new alpha
    const result = parser.process('#legacy.5');
    expect(result.output).toBe('hsl(180 50% 50% / .5)');
  });

  test('legacy comma syntax rgb() is normalized to modern syntax', () => {
    setGlobalPredefinedTokens({
      '#legacy-rgb': 'rgb(100, 150, 200)',
    });

    const result = parser.process('#legacy-rgb.5');
    expect(result.output).toBe('rgb(100 150 200 / .5)');
  });

  test('legacy comma syntax hsl() is normalized to modern syntax', () => {
    setGlobalPredefinedTokens({
      '#legacy-hsl': 'hsl(220, 80%, 50%)',
    });

    const result = parser.process('#legacy-hsl.5');
    expect(result.output).toBe('hsl(220 80% 50% / .5)');
  });

  test('opacity suffix replaces percentage alpha in color tokens', () => {
    setGlobalPredefinedTokens({
      '#semi-transparent': 'rgb(0 0 0 / 50%)',
    });

    // Should replace 50% alpha with .3, not produce invalid CSS
    const result = parser.process('#semi-transparent.3');
    expect(result.output).toBe('rgb(0 0 0 / .3)');
  });

  test('opacity suffix replaces percentage alpha in legacy rgba', () => {
    setGlobalPredefinedTokens({
      '#white-overlay': 'rgba(255, 255, 255, 80%)',
    });

    const result = parser.process('#white-overlay.5');
    expect(result.output).toBe('rgb(255 255 255 / .5)');
  });

  test('opacity suffix handles rgba() without alpha (3 values)', () => {
    setGlobalPredefinedTokens({
      '#no-alpha': 'rgba(0, 0, 0)',
    });

    // Should add alpha, not strip the blue channel
    const result = parser.process('#no-alpha.5');
    expect(result.output).toBe('rgb(0 0 0 / .5)');
  });

  test('opacity suffix handles hsla() without alpha (3 values)', () => {
    setGlobalPredefinedTokens({
      '#hsl-no-alpha': 'hsla(220, 80%, 50%)',
    });

    // Should add alpha, not strip the lightness value
    const result = parser.process('#hsl-no-alpha.5');
    expect(result.output).toBe('hsl(220 80% 50% / .5)');
  });

  test('multiple predefined tokens in one expression', () => {
    setGlobalPredefinedTokens({
      $gap: '1x',
      $padding: '2x',
    });

    const result = parser.process('$gap $padding');
    expect(result.output).toBe('8px 16px');
  });

  test('predefined tokens with number values', () => {
    setGlobalPredefinedTokens({
      $size: '100',
    });

    const result = parser.process('$size');
    expect(result.output).toBe('100');
  });

  test('getGlobalPredefinedTokens returns null when not configured', () => {
    expect(getGlobalPredefinedTokens()).toBeNull();
  });

  test('getGlobalPredefinedTokens returns configured tokens', () => {
    setGlobalPredefinedTokens({
      $test: '10px',
    });

    expect(getGlobalPredefinedTokens()).toEqual({
      $test: '10px',
    });
  });

  test('setGlobalPredefinedTokens merges with existing tokens', () => {
    // First call
    setGlobalPredefinedTokens({
      $a: '10px',
      $b: '20px',
    });

    // Second call should merge, not replace
    setGlobalPredefinedTokens({
      $b: '30px', // Override existing
      $c: '40px', // New token
    });

    expect(getGlobalPredefinedTokens()).toEqual({
      $a: '10px', // Preserved from first call
      $b: '30px', // Overridden by second call
      $c: '40px', // Added by second call
    });
  });

  test('resetGlobalPredefinedTokens clears global parser cache', () => {
    // Import the global parser to test cache clearing
    const { getGlobalParser } = jest.requireActual('../utils/styles');
    const globalParser = getGlobalParser();

    // Set a token and parse it (caches the result)
    setGlobalPredefinedTokens({
      $spacing: '2x',
    });

    const resultWithToken = globalParser.process('$spacing');
    expect(resultWithToken.output).toBe('16px'); // 2x = 2 * 8px

    // Reset tokens
    resetGlobalPredefinedTokens();

    // Parse the same input - should NOT return cached result
    // Without cache clear, this would incorrectly return '16px'
    const resultAfterReset = globalParser.process('$spacing');
    expect(resultAfterReset.output).toBe('var(--spacing)'); // Default $ behavior
  });
});
