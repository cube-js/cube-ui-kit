import {
  BASE_STYLES,
  BaseProps,
  BLOCK_STYLES,
  configure,
  filterBaseProps,
  setGlobalPredefinedStates,
  tasty,
  TastyBatchProvider,
} from '@tenphi/tasty';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ModalProvider } from 'react-aria';

import { I18nProvider } from '../i18n';
import { Provider } from '../provider';
import { NavigationAdapter } from '../providers/navigation.types';
import { TrackingProps, TrackingProvider } from '../providers/TrackingProvider';
import { PaletteConfig, setPaletteConfig } from '../tokens/palette-config';
import { EventBusProvider } from '../utils/react/useEventBus';
import { extractStyles } from '../utils/styles';
import { TASTY_VERSION, VERSION } from '../version';

import { GlobalStyles } from './GlobalStyles';
import { AlertDialogApiProvider } from './overlays/AlertDialog';
import { OverlayProvider } from './overlays/Notifications/OverlayProvider';
import { PortalProvider } from './portal';

import type { i18n as I18nInstance } from 'i18next';

// Color-scheme aliases for the Glaze-generated palette (see `src/tokens/palette.ts`).
// Attribute opt-in wins over system preference:
//   <html data-schema="dark">    → forces dark scheme
//   <html data-contrast="high">  → forces high-contrast scheme
// Otherwise falls back to the user's `prefers-color-scheme` / `prefers-contrast`.
setGlobalPredefinedStates({
  '@dark':
    '@root(schema=dark) | (!@root(schema) & @media(prefers-color-scheme: dark))',
  '@hc':
    '@root(contrast=high) | (!@root(contrast) & @media(prefers-contrast: more))',
});

configure({
  colorSpace: 'rgb',
  // Collapse the kit's stylesheet writes into one style invalidation per commit
  // instead of one per component. Only takes effect inside a
  // `<TastyBatchProvider>` window, and windows have to be opened per portal
  // boundary because a commit that mounts a portal does not re-render `<Root>`.
  // The kit opens three: here, in `<Portal>` (tooltips) and in `<Overlay>`
  // (popovers, modals, trays — i.e. Dialog and Menu). Writes in any commit
  // without a window go straight through exactly as before, so a
  // `useLayoutEffect` can never measure an element whose rules have not landed.
  batchInjection: true,
  units: {
    x: 'var(--gap)',
    r: 'var(--radius)',
    cr: 'var(--card-radius)',
    bw: 'var(--border-width)',
    ow: 'var(--outline-width)',
  },
  recipes: {
    reset: {
      margin: 0,
      padding: 0,
      border: 0,
      outline: 0,
      boxSizing: 'border-box',
    },
    button: {
      appearance: 'none',
      touchAction: 'manipulation',
      textDecoration: 'none',
      '-webkit-tap-highlight-color': 'transparent',
      fill: '#clear',
      color: 'inherit',
      cursor: {
        '': 'default',
        ':is(a)': 'pointer',
        ':is(button)': '$pointer',
        disabled: 'not-allowed',
      },
    },
    input: {
      appearance: 'none',
      wordSpacing: 'initial',
      color: 'inherit',
      fill: '#clear',
    },
    'input-autofill': {
      '@autofill': ':-webkit-autofill | :autofill',
      appearance: {
        '@autofill': 'none',
      },
      '-webkit-text-fill-color': {
        '': 'currentColor',
        '@autofill': '#primary-text',
      },
      caretColor: {
        '@autofill': '#primary-text',
      },
      shadow: {
        '@autofill': '0 0 0 9999rem #surface inset',
      },
      preset: {
        '@autofill': 'inherit',
      },
      '-webkit-opacity': {
        '': false,
        '[disabled]': '1',
      },
    },
    'input-placeholder': {
      '-webkit-text-fill-color': '#placeholder',
      color: '#placeholder',
    },
    'input-search-cancel-button': {
      hide: true,
      appearance: 'none',
    },
  },
});

const RootElement = tasty({
  id: 'cube-ui-kit-root',
  styles: {
    display: 'contents',
    color: '#dark-02',
    preset: 't3',
  },
});

const STYLES = [...BASE_STYLES, ...BLOCK_STYLES];

export interface CubeRootProps extends BaseProps {
  tokens?: { [key: string]: string };
  /**
   * Tune the generated color palette. Every zone — `accent`, `base` and each status
   * theme — takes the same seed: a color, or `{ hue, saturation }`. Plus the global
   * `surfaceMode`, `pastel` and `contrastLevel`. Omitted fields take their default, so
   * this prop describes the whole palette and dropping a field from it drops the
   * customization.
   *
   * Removing the prop entirely is the one thing that does *not* reset the
   * palette, so `<Root>` with no `palette` cannot clobber a host's imperative
   * `setPaletteConfig()` call. Pass `{}` to ask for the default.
   *
   * The palette is global process state, so this is a declarative wrapper over
   * `setPaletteConfig()`; both drive the same store, and the last write wins.
   * See `Getting Started/Theming` in Storybook.
   */
  palette?: PaletteConfig;
  bodyStyles?: { [key: string]: string };
  fontDisplay?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  fonts?: boolean;
  publicUrl?: string;
  navigation?: NavigationAdapter;
  font?: string;
  monospaceFont?: string;
  /** @deprecated Tokens are now always applied via GlobalStyles */
  applyLegacyTokens?: boolean;
  tracking?: TrackingProps;
  cursorStrategy?: 'web' | 'native';
  /**
   * i18next instance for this tree. During SSR, pass a request-local instance
   * created with `createUIKitI18n(locale)`.
   */
  i18n?: I18nInstance;
  /** Override the React Aria formatting locale. */
  locale?: string;
}

export function Root(allProps: CubeRootProps) {
  let {
    children,
    /** Raw css styles for body element */
    bodyStyles,
    fontDisplay = 'swap',
    fonts,
    publicUrl,
    navigation,
    font,
    monospaceFont,
    applyLegacyTokens: _applyLegacyTokens, // deprecated, ignored
    tracking,
    cursorStrategy = 'web',
    style,
    tokens,
    palette,
    i18n,
    locale,
    ...props
  } = allProps;

  // Applied during render, not in an effect, so the first paint already uses the
  // tuned palette instead of flashing the default. `setPaletteConfig` is a no-op
  // when the resolved config is unchanged, so an inline object literal and
  // StrictMode's double render both cost nothing. `GlobalStyles` is rendered
  // below in the same pass and reads the new version directly.
  useMemo(() => {
    if (palette) setPaletteConfig(palette);
  }, [palette]);

  const ref = useRef(null);

  const [rootRef, setRootRef] = useState();

  useEffect(() => {
    if (!rootRef) {
      // @ts-ignore
      setRootRef(ref?.current);
    }
  }, []);

  const styles = extractStyles(props, STYLES);

  return (
    <TastyBatchProvider>
      <I18nProvider i18n={i18n} locale={locale}>
        <Provider navigation={navigation} root={rootRef}>
          <TrackingProvider event={tracking?.event}>
            <RootElement
              ref={ref}
              data-uikit={VERSION}
              data-tasty={TASTY_VERSION}
              data-font-display={fontDisplay}
              {...filterBaseProps(props, { eventProps: true })}
              styles={styles}
              style={{
                '--pointer': cursorStrategy === 'web' ? 'pointer' : 'default',
                ...style,
              }}
              tokens={tokens}
            >
              <GlobalStyles
                bodyStyles={bodyStyles}
                publicUrl={publicUrl}
                fonts={fonts}
                font={font}
                monospaceFont={monospaceFont}
                fontDisplay={fontDisplay}
              />
              <ModalProvider>
                <PortalProvider value={ref}>
                  <EventBusProvider>
                    <OverlayProvider>
                      <AlertDialogApiProvider>
                        {children}
                      </AlertDialogApiProvider>
                    </OverlayProvider>
                  </EventBusProvider>
                </PortalProvider>
              </ModalProvider>
            </RootElement>
          </TrackingProvider>
        </Provider>
      </I18nProvider>
    </TastyBatchProvider>
  );
}
