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
import { TOKENS } from '../tokens';
import { useViewportSize } from '../utils/react';
import { EventBusProvider } from '../utils/react/useEventBus';
import { VERSION } from '../version';

import { GlobalStyles } from './GlobalStyles';
import { AlertDialogApiProvider } from './overlays/AlertDialog';
import { NotificationsProvider } from './overlays/NewNotifications/NotificationsContext/NotificationsProvider';
import { PortalProvider } from './portal';

const RootElement = tasty({
  id: 'cube-ui-kit-root',
});

const DEFAULT_STYLES = {
  display: 'block',
  preset: 't3',
  ...Object.keys(TOKENS).reduce((map, key) => {
    map[`$${key}`] = TOKENS[key];

    return map;
  }, {}),
};
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
  applyLegacyTokens?: boolean;
  tracking?: TrackingProps;
  cursorStrategy?: 'web' | 'native';
}

const IS_DVH_SUPPORTED =
  typeof CSS !== 'undefined' && typeof CSS?.supports === 'function'
    ? CSS.supports('height: 100dvh')
    : false;

export function Root(allProps: CubeRootProps) {
  let {
    children,
    /** Raw css styles for body element */
    bodyStyles,
    breakpoints = [980],
    fontDisplay = 'swap',
    fonts,
    publicUrl,
    navigation,
    font,
    monospaceFont,
    applyLegacyTokens,
    tracking,
    cursorStrategy = 'web',
    style,
    ...props
  } = allProps;

  const ref = useRef(null);

  const [rootRef, setRootRef] = useState();

  // We need to measure the window's height in JS rather than using percentages in CSS
  // so that contents (e.g. menu) can inherit the max-height properly. Using percentages
  // does not work properly because there is nothing to base the percentage on.
  // We cannot use vh units because mobile browsers adjust the window height dynamically
  // when the address bar/bottom toolbars show and hide on scroll and vh units are fixed.
  // Also, the visual viewport is smaller than the layout viewport when the virtual keyboard
  // is up, so use the VisualViewport API to ensure the tray is displayed above the keyboard.
  let viewport = useViewportSize({ isDisabled: IS_DVH_SUPPORTED });
  let [height, setHeight] = useState(
    IS_DVH_SUPPORTED ? undefined : viewport.height,
  );
  let timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (IS_DVH_SUPPORTED && typeof window !== 'undefined') {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // When the height is decreasing, and the keyboard is visible
    // (visual viewport smaller than layout viewport), delay setting
    // the new max height until after the animation is complete
    // so that there isn't an empty space under the tray briefly.
    if (
      viewport.height < (height || 0) &&
      viewport.height < window.innerHeight
    ) {
      timeoutRef.current = setTimeout(() => {
        setHeight(viewport.height);
      }, 500);
    } else {
      setHeight(viewport.height);
    }
  }, [height, viewport.height]);

  useEffect(() => {
    if (!rootRef) {
      // @ts-ignore
      setRootRef(ref?.current);
    }
  }, []);

  const styles = extractStyles(props, STYLES, DEFAULT_STYLES);

  return (
    <Provider navigation={navigation} root={rootRef} breakpoints={breakpoints}>
      <TrackingProvider event={tracking?.event}>
        <StyleSheetManager>
          <RootElement
            ref={ref}
            data-tasty={VERSION}
            data-font-display={fontDisplay}
            {...filterBaseProps(props, { eventProps: true })}
            styles={styles}
            style={{
              '--cube-dynamic-viewport-height': height
                ? height + 'px'
                : '100dvh',
              '--pointer': cursorStrategy === 'web' ? 'pointer' : 'default',
              ...style,
            }}
          >
            <GlobalStyles
              bodyStyles={bodyStyles}
              applyLegacyTokens={applyLegacyTokens}
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
