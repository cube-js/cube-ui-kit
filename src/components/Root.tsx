import {
  BASE_STYLES,
  BaseProps,
  BLOCK_STYLES,
  configure,
  extractStyles,
  filterBaseProps,
  tasty,
} from '@tenphi/tasty';
import { useEffect, useRef, useState } from 'react';
import { ModalProvider } from 'react-aria';

import { Provider } from '../provider';
import { NavigationAdapter } from '../providers/navigation.types';
import { TrackingProps, TrackingProvider } from '../providers/TrackingProvider';
import { EventBusProvider } from '../utils/react/useEventBus';
import { VERSION } from '../version';

import { GlobalStyles } from './GlobalStyles';
import { AlertDialogApiProvider } from './overlays/AlertDialog';
import { OverlayProvider } from './overlays/Notifications/OverlayProvider';
import { PortalProvider } from './portal';

configure({
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
      '@autofill': ':-webkit-autofill',
      '-webkit-text-fill-color': {
        '': 'currentColor',
        '@autofill | (@autofill & :hover) | (@autofill & :focus)': '#primary',
      },
      caretColor: {
        '@autofill | (@autofill & :hover) | (@autofill & :focus)': '#primary',
      },
      shadow: {
        '@autofill | (@autofill & :hover) | (@autofill & :focus)':
          '0 0 0 9999rem rgb(255 255 255) inset',
      },
      preset: {
        '@autofill | (@autofill & :hover) | (@autofill & :focus)': 'inherit',
      },
      '-webkit-opacity': {
        '': false,
        '[disabled]': '1',
      },
    },
    'input-placeholder': {
      '-webkit-text-fill-color': 'var(--placeholder-color, initial)',
      color: 'var(--placeholder-color, initial)',
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
    ...props
  } = allProps;

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
    <Provider navigation={navigation} root={rootRef}>
      <TrackingProvider event={tracking?.event}>
        <RootElement
          ref={ref}
          data-tasty={VERSION}
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
                  <AlertDialogApiProvider>{children}</AlertDialogApiProvider>
                </OverlayProvider>
              </EventBusProvider>
            </PortalProvider>
          </ModalProvider>
        </RootElement>
      </TrackingProvider>
    </Provider>
  );
}
