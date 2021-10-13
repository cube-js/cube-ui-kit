import { useEffect, useRef, useState } from 'react';
import { GlobalStyles } from './GlobalStyles';
import { Base } from './Base';
import { BASE_STYLES, BLOCK_STYLES } from '../styles/list';
import { extractStyles } from '../utils/styles';
import { filterBaseProps } from '../utils/filterBaseProps';
import { Provider } from '../provider';
import { ModalProvider } from '@react-aria/overlays';
import { BaseProps } from './types';

const DEFAULT_STYLES = {
  display: 'block',
  size: 'default',
};
const STYLES = [...BASE_STYLES, ...BLOCK_STYLES];

export interface CubeRootProps extends BaseProps {
  tokens?: { [key: string]: string };
  fonts?: boolean;
  publicUrl?: string;
  router?: Function;
  font?: string;
  monospaceFont?: string;
}

export const Root = (allProps: CubeRootProps) => {
  let {
    children,
    tokens,
    fonts,
    publicUrl,
    router,
    font,
    monospaceFont,
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
  const root = (
    <Base
      ref={ref}
      className="root"
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
    >
      <GlobalStyles
        tokens={tokens}
        publicUrl={publicUrl}
        fonts={fonts}
        font={font}
        monospaceFont={monospaceFont}
      />
      <ModalProvider>{children}</ModalProvider>
    </Base>
  );

  return (
    <Provider router={router} root={rootRef}>
      {root}
    </Provider>
  );
};
