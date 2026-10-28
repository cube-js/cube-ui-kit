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
import { EventBusProvider } from './utils/react/useEventBus';

import type { Props } from './props';

export interface ProviderProps extends Props {
  insideForm?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  isValid?: boolean;
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
    isInvalid,
    isValid,
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
      isInvalid,
      isValid,
      navigation,
      root,
    }),
    [
      ref,
      insideForm,
      isDisabled,
      isReadOnly,
      isRequired,
      isInvalid,
      isValid,
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

/**
 * The component's props over the provider's values. A prop set to `undefined`
 * counts as not set, so a wrapper that passes an optional `isDisabled` through
 * keeps the state of the enclosing `<Form>` or `<Provider>`.
 */
export function useProviderProps<T extends ProviderProps = Props>(props: T): T {
  const contextProps = useContext(UIKitContext);
  const merged = { ...contextProps, ...props };

  for (const key of Object.keys(contextProps)) {
    if (merged[key] === undefined) {
      merged[key] = contextProps[key];
    }
  }

  return merged as T;
}
