import {
  createContext,
  ForwardedRef,
  PropsWithChildren,
  useContext,
} from 'react';
import { StyleProvider } from './providers/StylesProvider';
import { BreakpointsProvider } from './providers/BreakpointsProvider';
import { ResponsiveStyleValue } from './utils/styles';
import { Props } from './components/types';

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

export interface ProviderInsideProps
  extends Omit<ProviderProps, 'styles' | 'breakpoints'> {}

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

  console.log('! context', newValue.root);

  return (
    <UIKitContext.Provider value={newValue}>{children}</UIKitContext.Provider>
  );
}

export function useProviderProps<T extends Props = Props>(props: T): T {
  const contextProps = useContext(UIKitContext);

  return { ...contextProps, ...props } as T;
}
