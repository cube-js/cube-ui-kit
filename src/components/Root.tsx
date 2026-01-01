import { useEffect, useRef, useState } from 'react';
import { ModalProvider } from 'react-aria';
import { StyleSheetManager } from 'styled-components';

import { Provider } from '../provider';
import { NavigationAdapter } from '../providers/navigation.types';
import { TrackingProps, TrackingProvider } from '../providers/TrackingProvider';
import {
  BASE_STYLES,
  BaseProps,
  BLOCK_STYLES,
  extractStyles,
  filterBaseProps,
  tasty,
} from '../tasty';
import { EventBusProvider } from '../utils/react/useEventBus';
import { VERSION } from '../version';

import { GlobalStyles } from './GlobalStyles';
import { AlertDialogApiProvider } from './overlays/AlertDialog';
import { NotificationsProvider } from './overlays/NewNotifications/NotificationsContext/NotificationsProvider';
import { PortalProvider } from './portal';

const RootElement = tasty({
  id: 'cube-ui-kit-root',
  styles: {
    display: 'block',
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
        <StyleSheetManager>
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
                  <NotificationsProvider rootRef={ref}>
                    <AlertDialogApiProvider>{children}</AlertDialogApiProvider>
                  </NotificationsProvider>
                </EventBusProvider>
              </PortalProvider>
            </ModalProvider>
          </RootElement>
        </StyleSheetManager>
      </TrackingProvider>
    </Provider>
  );
}
