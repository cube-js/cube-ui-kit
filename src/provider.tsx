import { createContext, useContext } from 'react';
import { StyleProvider } from './providers/Styles';
import { ResponsiveProvider } from './providers/Responsive';

export const UIKitContext = createContext({
  breakpoints: [980],
});

export function Provider({
  breakpoints,
  children,
  insideForm,
  isQuiet,
  isEmphasized,
  isDisabled,
  isReadOnly,
  isRequired,
  validationState,
  router,
  styles,
  ref,
}) {
  if (styles) {
    children = <StyleProvider {...styles}>{children}</StyleProvider>;
  }

  if (breakpoints) {
    children = (
      <ResponsiveProvider value={breakpoints}>{children}</ResponsiveProvider>
    );
  }

  const parentContext = useContext(UIKitContext);
  const props = {
    ref,
    breakpoints,
    insideForm,
    isQuiet,
    isEmphasized,
    isDisabled,
    isReadOnly,
    isRequired,
    validationState,
    router,
  };
  const newValue = Object.assign({}, parentContext);

  Object.keys(props).forEach((key) => {
    if (props[key] != null) {
      newValue[key] = props[key];
    }
  });

  return (
    <UIKitContext.Provider value={newValue}>{children}</UIKitContext.Provider>
  );
}

export function useProviderProps(props) {
  return { ...useContext(UIKitContext), ...props };
}
