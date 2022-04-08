import { useEffect, useRef, useState } from 'react';
import { GlobalStyles } from './GlobalStyles';
import { Base } from './Base';
import { PortalProvider } from './portal';
import { BASE_STYLES, BLOCK_STYLES } from '../styles/list';
import { extractStyles } from '../utils/styles';
import { filterBaseProps } from '../utils/filterBaseProps';
import { Provider } from '../provider';
import { ModalProvider } from '@react-aria/overlays';
import { BaseProps } from './types';
import { StyleSheetManager } from 'styled-components';
import { TOKENS } from '../tokens';
import { AlertDialogApiProvider } from './overlays/AlertDialog';

const DEFAULT_STYLES = {
  display: 'block',
  preset: 't3',
  ...Object.keys(TOKENS).reduce((map, key) => {
    map[`@${key}`] = TOKENS[key];

    return map;
  }, {}),
};
const STYLES = [...BASE_STYLES, ...BLOCK_STYLES];

export interface CubeRootProps extends BaseProps {
  tokens?: { [key: string]: string };
  bodyStyles?: { [key: string]: string };
  fonts?: boolean;
  publicUrl?: string;
  router?: any;
  font?: string;
  monospaceFont?: string;
  applyLegacyTokens?: boolean;
}

export const Root = (allProps: CubeRootProps) => {
  let {
    children,
    /** Raw css styles for body element */
    bodyStyles,
    fonts,
    publicUrl,
    router,
    font,
    monospaceFont,
    applyLegacyTokens,
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

  const styles = extractStyles(props, STYLES, DEFAULT_STYLES);

  return (
    <Provider router={router} root={rootRef}>
      <StyleSheetManager disableVendorPrefixes>
        <Base
          ref={ref}
          id="cube-ui-kit-root"
          className="root"
          {...filterBaseProps(props, { eventProps: true })}
          styles={styles}
        >
          <GlobalStyles
            bodyStyles={bodyStyles}
            applyLegacyTokens={applyLegacyTokens}
            publicUrl={publicUrl}
            fonts={fonts}
            font={font}
            monospaceFont={monospaceFont}
          />
          <ModalProvider>
            <PortalProvider value={ref}>
              <AlertDialogApiProvider>{children}</AlertDialogApiProvider>
            </PortalProvider>
          </ModalProvider>
        </Base>
      </StyleSheetManager>
    </Provider>
  );
};
