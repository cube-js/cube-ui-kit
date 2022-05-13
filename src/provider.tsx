import {
  createContext,
  ForwardedRef,
  PropsWithChildren,
  useContext,
} from 'react';
import {
  BreakpointsProvider,
  Props,
  ResponsiveStyleValue,
  StyleProvider,
} from './tasty';

export interface ProviderProps extends Props {
  breakpoints?: number[];
  insideForm?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  validationState?: string;
  router?: Function;
  styles?: {
    [key: string]: { [key: string]: ResponsiveStyleValue } | Function;
  };
  ref?: JSX.Element;
  root?: ForwardedRef<any>;
}

export type ProviderInsideProps = Omit<ProviderProps, 'styles' | 'breakpoints'>;

export const UIKitContext = createContext<ProviderInsideProps>({});

export function Provider(allProps: PropsWithChildren<ProviderProps>) {
  let {
    breakpoints,
    children,
    insideForm,
    isDisabled,
    isReadOnly,
    isRequired,
    validationState,
    router,
    styles,
    root,
    ref,
  } = allProps;

  if (styles) {
    children = <StyleProvider {...styles}>{children}</StyleProvider>;
  }

  if (breakpoints) {
    children = (
      <BreakpointsProvider value={breakpoints}>{children}</BreakpointsProvider>
    );
  }

  const parentContext = useContext(UIKitContext);
  const props = {
    ref,
    breakpoints,
    insideForm,
    isDisabled,
    isReadOnly,
    isRequired,
    validationState,
    router,
    root,
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

export function useProviderProps<T extends Props = Props>(props: T): T {
  const contextProps = useContext(UIKitContext);

  return { ...contextProps, ...props } as T;
}
