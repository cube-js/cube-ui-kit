import { createContext, ReactNode, useContext } from 'react';

import { CubeItemProps } from '../content/Item';

interface ItemActionContextValue {
  type?: CubeItemProps['type'];
  theme?: 'default' | 'danger' | 'success' | 'special' | (string & {});
  disableActionsFocus?: boolean;
}

const ItemActionContext = createContext<ItemActionContextValue | undefined>(
  undefined,
);

export interface ItemActionProviderProps {
  type?: CubeItemProps['type'];
  theme?: 'default' | 'danger' | 'success' | 'special' | (string & {});
  disableActionsFocus?: boolean;
  children: ReactNode;
}

export function ItemActionProvider({
  type,
  theme,
  disableActionsFocus,
  children,
}: ItemActionProviderProps) {
  return (
    <ItemActionContext.Provider
      value={{
        type:
          type === 'item' ||
          type === 'outline' ||
          type === 'title' ||
          type === 'alert'
            ? 'neutral'
            : type === 'secondary'
              ? 'clear'
              : type,
        theme,
        disableActionsFocus,
      }}
    >
      {children}
    </ItemActionContext.Provider>
  );
}

export function useItemActionContext(): ItemActionContextValue {
  return useContext(ItemActionContext) ?? {};
}
