import {
  createContext,
  ForwardedRef,
  PropsWithChildren,
  ReactElement,
  useContext,
  useMemo,
} from 'react';

import { NavigationAdapter } from './providers/navigation.types';
import { defaultNavigationAdapter } from './providers/navigationAdapter.default';
import { Props } from './tasty';
import { EventBusProvider } from './utils/react/useEventBus';

export interface ProviderProps extends Props {
  insideForm?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  validationState?: string;
  navigation?: NavigationAdapter;
  ref?: ReactElement;
  root?: ForwardedRef<any>;
}

export type ProviderInsideProps = Omit<ProviderProps, 'styles'>;

export const UIKitContext = createContext<ProviderInsideProps>({
  navigation: defaultNavigationAdapter,
});

export function Provider(allProps: PropsWithChildren<ProviderProps>) {
  let {
    children,
    insideForm,
    isDisabled,
    isReadOnly,
    isRequired,
    validationState,
    navigation,
    root,
    ref,
  } = allProps;

  const parentContext = useContext(UIKitContext);

  // Wrap with EventBusProvider for menu synchronization
  children = <EventBusProvider>{children}</EventBusProvider>;

  const props = useMemo(
    () => ({
      ref,
      insideForm,
      isDisabled,
      isReadOnly,
      isRequired,
      validationState,
      navigation: navigation || defaultNavigationAdapter,
      root,
    }),
    [
      ref,
      insideForm,
      isDisabled,
      isReadOnly,
      isRequired,
      validationState,
      navigation,
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
