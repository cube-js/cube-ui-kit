import React, { forwardRef } from 'react';
import { GlobalStyles } from './GlobalStyles';
import { Base } from './Base';
import { BASE_STYLES, BLOCK_STYLES } from '../styles/list';
import { extractStyles } from '../utils/styles';
import { filterBaseProps } from '../utils/filterBaseProps';
import { Provider } from '../provider';
import { ModalProvider } from '@react-aria/overlays';

const DEFAULT_STYLES = {
  display: 'block',
};
const STYLES = [
  ...BASE_STYLES,
  ...BLOCK_STYLES,
];

export const Root = forwardRef((allProps, ref) => {
  let {
    children,
    tokens,
    fonts,
    legacyCSS,
    publicUrl,
    router,
    font,
    monospaceFont,
    ...props
  } = allProps;

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
        legacy={legacyCSS}
        fonts={fonts}
        font={font}
        monospaceFont={monospaceFont}
      />
      <ModalProvider>
        {children}
      </ModalProvider>
    </Base>
  );

  return (
    router ? <Provider router={router}>
      {root}
    </Provider> : root
  );
});
