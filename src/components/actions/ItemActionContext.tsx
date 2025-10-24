import { createContext, ReactNode, useContext } from 'react';

import { CubeItemBaseProps } from '../content/ItemBase';

interface ItemActionContextValue {
  type?: CubeItemBaseProps['type'];
  theme?: 'default' | 'danger' | 'success' | 'special' | (string & {});
}

const ItemActionContext = createContext<ItemActionContextValue | undefined>(
  undefined,
);

export interface ItemActionProviderProps {
  type?: CubeItemBaseProps['type'];
  theme?: 'default' | 'danger' | 'success' | 'special' | (string & {});
  children: ReactNode;
}

export function ItemActionProvider({
  type,
  theme,
  children,
}: ItemActionProviderProps) {
  return (
    <ItemActionContext.Provider
      value={{
        type:
          type === 'item' || type === 'outline'
            ? 'neutral'
            : type === 'secondary'
              ? 'clear'
              : type,
        theme,
      }}
    >
      {children}
    </ItemActionContext.Provider>
  );
}

export function useItemActionContext(): ItemActionContextValue {
  return useContext(ItemActionContext) ?? {};
}
