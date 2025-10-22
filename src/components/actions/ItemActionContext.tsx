import { createContext, ReactNode, useContext } from 'react';

import { CubeItemBaseProps } from '../content/ItemBase';

interface ItemActionContextValue {
  type?: CubeItemBaseProps['type'];
}

const ItemActionContext = createContext<ItemActionContextValue | undefined>(
  undefined,
);

export interface ItemActionProviderProps {
  type?: CubeItemBaseProps['type'];
  children: ReactNode;
}

export function ItemActionProvider({
  type,
  children,
}: ItemActionProviderProps) {
  return (
    <ItemActionContext.Provider
      value={{ type: type === 'item' ? 'neutral' : type }}
    >
      {children}
    </ItemActionContext.Provider>
  );
}

export function useItemActionContext(): ItemActionContextValue {
  return useContext(ItemActionContext) ?? {};
}
