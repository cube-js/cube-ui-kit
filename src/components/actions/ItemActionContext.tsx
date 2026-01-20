import { createContext, ReactNode, useContext } from 'react';

import type { CubeItemProps } from '../content/Item/Item';

interface ItemActionContextValue {
  type?: CubeItemProps['type'];
  theme?: 'default' | 'danger' | 'success' | 'special' | (string & {});
  disableActionsFocus?: boolean;
  isDisabled?: boolean;
}

const ItemActionContext = createContext<ItemActionContextValue | undefined>(
  undefined,
);

export interface ItemActionProviderProps {
  type?: CubeItemProps['type'];
  theme?: 'default' | 'danger' | 'success' | 'special' | (string & {});
  disableActionsFocus?: boolean;
  isDisabled?: boolean;
  children: ReactNode;
}

export function ItemActionProvider({
  type,
  theme,
  disableActionsFocus,
  isDisabled,
  children,
}: ItemActionProviderProps) {
  return (
    <ItemActionContext.Provider
      value={{
        type:
          type === 'item' ||
          type === 'outline' ||
          type === 'header' ||
          type === 'card'
            ? 'neutral'
            : type === 'secondary'
              ? 'clear'
              : type,
        theme,
        disableActionsFocus,
        isDisabled,
      }}
    >
      {children}
    </ItemActionContext.Provider>
  );
}

export function useItemActionContext(): ItemActionContextValue {
  return useContext(ItemActionContext) ?? {};
}
