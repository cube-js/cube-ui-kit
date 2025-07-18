import {
  createContext,
  ForwardedRef,
  PropsWithChildren,
  ReactElement,
  useContext,
  useMemo,
} from 'react';

import { BreakpointsProvider, Props } from './tasty';
import { EventBusProvider } from './utils/react/useEventBus';

export interface ProviderProps extends Props {
  breakpoints?: number[];
  insideForm?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  validationState?: string;
  router?: any;
  ref?: ReactElement;
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
    root,
    ref,
  } = allProps;

  const parentContext = useContext(UIKitContext);

  if (breakpoints) {
    children = (
      <BreakpointsProvider value={breakpoints}>{children}</BreakpointsProvider>
    );
  }

  // Wrap with EventBusProvider for menu synchronization
  children = <EventBusProvider>{children}</EventBusProvider>;

  const props = useMemo(
    () => ({
      ref,
      breakpoints,
      insideForm,
      isDisabled,
      isReadOnly,
      isRequired,
      validationState,
      router,
      root,
    }),
    [
      ref,
      breakpoints,
      insideForm,
      isDisabled,
      isReadOnly,
      isRequired,
      validationState,
      router,
      root,
    ],
  );

  const newValue = useMemo(() => {
    let newValue = Object.assign({}, parentContext);

    Object.keys(props).forEach((key) => {
      if (props[key] != null) {
        newValue[key] = props[key];
      }
    });

    return newValue;
  }, [parentContext, props]);

  return (
    <UIKitContext.Provider value={newValue}>{children}</UIKitContext.Provider>
  );
}

export function useProviderProps<T extends ProviderProps = Props>(props: T): T {
  const contextProps = useContext(UIKitContext);

  return { ...contextProps, ...props } as T;
}
