import React, { createContext, useContext } from 'react';
import { StylesProvider } from './providers/Styles';
import ResponsiveProvider from './providers/Responsive';

const Context = createContext({
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
  styles,
}) {
  if (styles) {
    children = <StylesProvider {...styles}>{children}</StylesProvider>;
  }

  if (breakpoints) {
    children = (
      <ResponsiveProvider value={breakpoints}>{children}</ResponsiveProvider>
    );
  }

  const parentContext = useContext(Context);
  const props = {
    breakpoints,
    insideForm,
    isQuiet,
    isEmphasized,
    isDisabled,
    isReadOnly,
    isRequired,
    validationState,
  };
  const newValue = Object.assign({}, parentContext);

  Object.keys(props).forEach((key) => {
    if (props[key] != null) {
      newValue[key] = props[key];
    }
  });

  return <Context.Provider value={newValue}>{children}</Context.Provider>;
}

export function useProviderProps(props) {
  return { ...useContext(Context), ...props };
}
