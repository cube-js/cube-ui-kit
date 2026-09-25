import { getCSSText } from '@tenphi/tasty';
import { act, render } from '@testing-library/react';

import { Root } from '../components/Root';

import { ColorTheme, getColorTheme, useColorTheme } from './color-theme';
import {
  resetPaletteConfig,
  ResolvedPaletteConfig,
  setPaletteConfig,
  usePaletteConfig,
} from './palette-config';

// These run under `pnpm test:compiled` too, which is the point: the published
// build runs React Compiler, and a palette hook that subscribed to the version
// without reading it kept serving its first render's value there while passing
// uncompiled.

/** The value of a custom property in the injected CSS, or `undefined`. */
function injected(property: string): string | undefined {
  const match = getCSSText().match(new RegExp(`${property}:\\s*([^;}]+)`));

  return match?.[1].trim();
}

const ACCENT = '--primary-accent-surface-color';

afterEach(() => {
  act(() => resetPaletteConfig());
});

describe('runtime palette changes', () => {
  it('re-inject the body tokens after setPaletteConfig', () => {
    render(<Root />);

    const before = injected(ACCENT);

    expect(before).toMatch(/^oklch\(/);

    act(() => setPaletteConfig({ accent: { hue: 30 } }));

    expect(injected(ACCENT)).toMatch(/^oklch\(/);
    expect(injected(ACCENT)).not.toBe(before);

    act(() => resetPaletteConfig());

    expect(injected(ACCENT)).toBe(before);
  });

  it('re-inject the body tokens when the Root palette prop changes', () => {
    const { rerender } = render(<Root palette={{}} />);
    const before = injected(ACCENT);

    rerender(<Root palette={{ accent: { hue: 30 } }} />);

    expect(injected(ACCENT)).not.toBe(before);
  });

  it('reach usePaletteConfig', () => {
    let seen: ResolvedPaletteConfig | undefined;

    function Reader() {
      [seen] = usePaletteConfig();

      return null;
    }

    render(<Reader />);

    const initialHue = seen?.hue;

    act(() => setPaletteConfig({ accent: { hue: 30 } }));

    expect(initialHue).not.toBe(30);
    expect(seen?.hue).toBe(30);
  });

  it('reach a useColorTheme whose config is unchanged', () => {
    // The same object on every render, like a caller's module-level config. The
    // theme takes its saturation from the palette, so a re-seed changes it.
    const config = { hue: 150 };
    let theme: ColorTheme | undefined;

    function Theme() {
      theme = useColorTheme(config);

      return null;
    }

    render(<Theme />);

    const initial = theme;

    act(() => setPaletteConfig({ accent: { saturation: 40 } }));

    expect(theme).not.toBe(initial);
    expect(theme).toBe(getColorTheme(config));
    expect(injected(`--${theme?.name}-surface-color`)).toMatch(/^oklch\(/);
  });
});
