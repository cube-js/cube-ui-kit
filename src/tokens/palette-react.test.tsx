import { getCSSText } from '@tenphi/tasty';
import { act, render } from '@testing-library/react';
import { ReactNode, StrictMode } from 'react';

import { Root } from '../components/Root';

import { ColorTheme, getColorTheme, useColorTheme } from './color-theme';
import {
  getPaletteConfig,
  PaletteConfig,
  resetPaletteConfig,
  ResolvedPaletteConfig,
  setPaletteConfig,
  subscribePaletteConfig,
  usePaletteConfig,
  usePaletteValue,
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

// Kept first in the file on purpose: React reports a render-phase update once
// per rendering component, so only the first palette change a file makes can
// show the console warning. The phase check below does not depend on order.
describe('Root palette prop', () => {
  /** Every console.error call that reports an update during another render. */
  function spyRenderUpdateWarnings() {
    const spy = vi.spyOn(console, 'error');

    return () =>
      spy.mock.calls.filter((args) =>
        args.some(
          (arg) =>
            typeof arg === 'string' &&
            arg.includes('Cannot update a component'),
        ),
      );
  }

  /**
   * Records where each store notification happened. `Before` renders just
   * before `<Root>` and `After` is Root's first child, so a notification
   * between the two came from Root's own render body.
   */
  function trackNotifications() {
    let phase = 'idle';
    const phases: string[] = [];
    const unsubscribe = subscribePaletteConfig(() => phases.push(phase));

    function Before() {
      phase = 'root-render';

      return null;
    }

    function After() {
      phase = 'children';

      return null;
    }

    function App({
      palette,
      children,
    }: {
      palette: PaletteConfig;
      children?: ReactNode;
    }) {
      return (
        <>
          <Before />
          <Root palette={palette}>
            <After />
            {children}
          </Root>
        </>
      );
    }

    return { App, phases, unsubscribe };
  }

  /** A store subscriber that records the hue of every render. */
  function makeHueReader() {
    const hues: number[] = [];

    function HueReader() {
      hues.push(usePaletteValue(getPaletteConfig).hue);

      return null;
    }

    return { hues, HueReader };
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('notifies subscribers after render when the palette changes', () => {
    const warnings = spyRenderUpdateWarnings();
    const { App, phases, unsubscribe } = trackNotifications();
    const { hues, HueReader } = makeHueReader();

    const { rerender } = render(
      <App palette={{ accent: { hue: 30 } }}>
        <HueReader />
      </App>,
    );
    const before = injected(ACCENT);

    phases.length = 0;

    rerender(
      <App palette={{ accent: { hue: 200 } }}>
        <HueReader />
      </App>,
    );
    unsubscribe();

    expect(warnings()).toEqual([]);
    expect(phases).toEqual(['children']);
    expect(hues.at(-1)).toBe(200);
    expect(injected(ACCENT)).not.toBe(before);
  });

  it('applies the palette before the first render of its subscribers', () => {
    const { hues, HueReader } = makeHueReader();

    render(
      <Root palette={{ accent: { hue: 30 } }}>
        <HueReader />
      </Root>,
    );

    // Guard: the first render already sees the tuned palette, so the first
    // paint is branded and never flashes the default.
    expect(hues[0]).toBe(30);
  });

  it('notifies subscribers after render under StrictMode', () => {
    const { App, phases, unsubscribe } = trackNotifications();
    const { hues, HueReader } = makeHueReader();

    const { rerender } = render(
      <StrictMode>
        <App palette={{ accent: { hue: 30 } }}>
          <HueReader />
        </App>
      </StrictMode>,
    );

    expect(hues[0]).toBe(30);

    phases.length = 0;

    rerender(
      <StrictMode>
        <App palette={{ accent: { hue: 200 } }}>
          <HueReader />
        </App>
      </StrictMode>,
    );
    unsubscribe();

    expect(phases).toEqual(['children']);
    expect(hues.at(-1)).toBe(200);
  });

  it('restores the injected tokens when the palette changes back', () => {
    const { App, phases, unsubscribe } = trackNotifications();
    const { rerender } = render(<App palette={{ accent: { hue: 30 } }} />);
    const first = injected(ACCENT);

    phases.length = 0;

    rerender(<App palette={{ accent: { hue: 200 } }} />);

    expect(injected(ACCENT)).not.toBe(first);

    rerender(<App palette={{ accent: { hue: 30 } }} />);
    unsubscribe();

    expect(phases).toEqual(['children', 'children']);
    expect(injected(ACCENT)).toBe(first);
  });

  it('leaves the palette in place after unmount', () => {
    const { unmount } = render(<Root palette={{ accent: { hue: 30 } }} />);

    unmount();

    // Guard: the palette is process state, and unmounting is not a reset.
    expect(getPaletteConfig().hue).toBe(30);
  });
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
