import { createContext, useContext } from 'react';
import { Styles } from '../styles/types';

export const StyleContext = createContext<any>({});

export function StyleProvider({ children, ...props }) {
  const styles = Object.assign({}, useContext(StyleContext));

  Object.keys(props).forEach((propName) => {
    if (styles[propName]) {
      styles[propName] = [...styles[propName], props[propName]];
    } else {
      styles[propName] = [props[propName]];
    }
  });

  // @ts-ignore
  return (
    <StyleContext.Provider value={styles}>{children}</StyleContext.Provider>
  );
}

export function useContextStyles(name, props?): Styles {
  const contextStyles = useContext(StyleContext);
  const styles = {};

  if (contextStyles[name]) {
    contextStyles[name].forEach((handler) => {
      Object.assign(
        styles,
        typeof handler === 'function' ? handler(props) : handler,
      );
    });
  }

  return styles;
}
