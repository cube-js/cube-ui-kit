import React, { createContext, useContext } from 'react';

export const StyleContext = createContext({});

export function StylesProvider({ children, ...props }) {
  const styles = Object.assign({}, useContext(StyleContext));

  Object.keys(props).forEach((propName) => {
    if (styles[propName]) {
      styles[propName] = [...styles[propName], props[propName]];
    } else {
      styles[propName] = [props[propName]];
    }
  });

  return (
    <StyleContext.Provider value={styles}>{children}</StyleContext.Provider>
  );
}

export function useContextStyles(name, props) {
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
