import { act, renderHook } from '../test';

import { getTokens } from './all-tokens';
import { resetPaletteConfig, setPaletteConfig } from './palette-config';
import {
  resolvePresetValues,
  resolveTokenValue,
  resolveTokenValues,
  useTokenValue,
} from './resolve';

/**
 * jsdom implements neither `@property` nor its initial values, so the fixture
 * declares them by hand on `<html>` — which is exactly the shape a browser
 * produces: the token block lands on `<body>`, and anything above it reads back
 * the registered placeholder rather than an empty string.
 */
const FIXTURE = `
  html {
    --purple-color: rgba(0, 0, 0, 0);
    --surface-color: rgba(0, 0, 0, 0);
    --space-md: 0px;
    --font-sans: system-ui;
  }

  body {
    --purple-color: #7a2ef6;
    --surface-color: #ffffff;
    --space-md: 8px;
    --clear-color: transparent;
    --sharp-radius: 0px;
    --t3-font-size: 14px;
    --t3-line-height: 20px;
    --s3-font-family: monospace;
    --s3-font-size: 13px;
  }
`;

let style: HTMLStyleElement;

beforeAll(() => {
  style = document.createElement('style');
  style.textContent = FIXTURE;
  document.head.append(style);
});

afterAll(() => {
  style.remove();
});

describe('resolveTokenValue', () => {
  it('should read a token off <body>, where <Root> declares it', () => {
    expect(resolveTokenValue('#purple')).toBe('#7a2ef6');
    expect(resolveTokenValue('$space-md')).toBe('8px');
  });

  it('should accept every spelling of the same token', () => {
    expect(resolveTokenValue('#purple')).toBe('#7a2ef6');
    expect(resolveTokenValue('--purple-color')).toBe('#7a2ef6');
    expect(resolveTokenValue('purple-color')).toBe('#7a2ef6');
  });

  it('should refuse an @property placeholder read off the wrong element', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(
      resolveTokenValue('#purple', { element: document.documentElement }),
    ).toBe(null);

    expect(warn).toHaveBeenCalledWith(
      'CubeUIKit:',
      expect.stringContaining('--purple-color'),
    );

    warn.mockRestore();
  });

  it('should warn about a placeholder only once per token', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    resolveTokenValue('$space-md', { element: document.documentElement });
    resolveTokenValue('$space-md', { element: document.documentElement });

    expect(warn).toHaveBeenCalledTimes(1);

    warn.mockRestore();
  });

  it('should return the fallback instead of a placeholder', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(
      resolveTokenValue('#surface', {
        element: document.documentElement,
        fallback: '#fff',
      }),
    ).toBe('#fff');

    warn.mockRestore();
  });

  it('should return the fallback for a token that is not declared at all', () => {
    expect(resolveTokenValue('$nothing-declares-this')).toBe(null);
    expect(
      resolveTokenValue('$nothing-declares-this', { fallback: '1px' }),
    ).toBe('1px');
  });

  it('should pass through a token whose own value is placeholder-shaped', () => {
    // Both are real values, not misses — the guard has to tell them apart from a
    // placeholder by their declared value.
    expect(getTokens()['#clear']).toBe('transparent');
    expect(getTokens()['$sharp-radius']).toBe('0px');

    expect(resolveTokenValue('#clear')).toBe('transparent');
    expect(resolveTokenValue('$sharp-radius')).toBe('0px');
  });

  it('should reject a name that is not a valid custom property', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(resolveTokenValue('$')).toBe(null);
    expect(warn).toHaveBeenCalledWith(
      'CubeUIKit:',
      expect.stringContaining('not a valid design token name'),
    );

    warn.mockRestore();
  });

  it('should read from the element it is given', () => {
    const node = document.createElement('div');

    node.style.setProperty('--purple-color', '#00ff00');
    document.body.append(node);

    expect(resolveTokenValue('#purple', { element: node })).toBe('#00ff00');
    expect(resolveTokenValue('#purple')).toBe('#7a2ef6');

    node.remove();
  });
});

describe('resolveTokenValues', () => {
  it('should key the result by the tokens as written', () => {
    expect(
      resolveTokenValues(['#purple', '$space-md', '$t3-font-size']),
    ).toEqual({
      '#purple': '#7a2ef6',
      '$space-md': '8px',
      '$t3-font-size': '14px',
    });
  });
});

describe('resolvePresetValues', () => {
  it('should resolve the descriptors a preset declares', () => {
    const preset = resolvePresetValues('t3');

    expect(preset.fontSize).toBe('14px');
    expect(preset.lineHeight).toBe('20px');
  });

  it('should fall back to --font-sans for a preset that does not name a family', () => {
    expect(resolvePresetValues('t3').fontFamily).toBe('system-ui');
    expect(resolvePresetValues('s3').fontFamily).toBe('monospace');
  });

  it('should report an undeclared descriptor as null without warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // No preset declares a `fontStyle`; a preset leaving a descriptor out is
    // ordinary, so unlike a missing token it must not warn.
    expect(resolvePresetValues('t3').fontStyle).toBe(null);
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });
});

describe('useTokenValue', () => {
  // `vitest.config.ts` runs with `isolate: false`, so the palette store is shared
  // with every other file in the worker — reset both sides of the test.
  beforeEach(() => resetPaletteConfig());
  afterEach(() => resetPaletteConfig());

  it('should resolve on the first render', () => {
    const { result } = renderHook(() => useTokenValue('#purple'));

    expect(result.current).toBe('#7a2ef6');
  });

  it('should re-resolve when the palette is re-seeded', () => {
    const { result } = renderHook(() => useTokenValue('#purple'));

    expect(result.current).toBe('#7a2ef6');

    style.textContent = FIXTURE.replace('#7a2ef6', '#0ea5e9');

    act(() => setPaletteConfig({ accent: { hue: 210 } }));

    expect(result.current).toBe('#0ea5e9');

    style.textContent = FIXTURE;
  });
});
