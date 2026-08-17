import { createContext, ReactNode, useContext } from 'react';

import type { CubeItemProps } from '../content/Item/Item';

/**
 * What an `ItemAction` / `ItemBadge` picks up from the row that hosts it.
 *
 * `type` is deliberately NOT a styling input. Actions default to the `current`
 * type, which derives every color from the row's own `currentcolor`, so they
 * track the host's type without being told what it is — see
 * `CURRENT_ITEM_STYLES`. It is still carried here because its *presence* marks
 * "inside a host", which drives the `context` mod that collapses the action's
 * side margins.
 *
 * `theme` is still consumed: `current` needs to know when it sits on the
 * special theme's dark surface, where the alpha ramp has to step harder to stay
 * visible. `ItemAction` forwards it to `data-theme` for that one purpose.
 */
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
        // Passed through as-is. The mapping that used to fold the row types onto
        // `clear` here existed only to pick an action variant, which `current`
        // now does on its own.
        type,
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
