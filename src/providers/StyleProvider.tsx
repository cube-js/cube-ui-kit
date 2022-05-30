import { createContext, useContext, ReactNode } from 'react';
import { Styles } from '../tasty';

export const StyleContext = createContext<any>({});

interface StyleProviderProps {
  children?: ReactNode;
  [key: string]: any;
}

/**
 * @deprecated
 */
export function StyleProvider({ children, ...props }: StyleProviderProps) {
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

/**
 * @deprecated
 */
export function useContextStyles(
  name: string,
  props?: Record<string, any>,
): Styles | null {
  const contextStyles = useContext(StyleContext);

  if (!name) return null;

  const styles = {};

  if (contextStyles[name]) {
    contextStyles[name].forEach((handler: Function | Styles) => {
      Object.assign(
        styles,
        typeof handler === 'function' ? handler(props) : handler,
      );
    });
  }

  return styles;
}
