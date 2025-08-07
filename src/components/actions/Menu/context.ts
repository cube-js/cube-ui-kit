import { FocusStrategy } from '@react-types/shared';
import React, { HTMLAttributes, MutableRefObject, useContext } from 'react';

export interface MenuContextValue
  extends Omit<HTMLAttributes<HTMLElement>, 'autoFocus'> {
  onClose?: () => void;
  closeOnSelect?: boolean;
  shouldFocusWrap?: boolean;
  autoFocus?: boolean | FocusStrategy;
  ref?: MutableRefObject<HTMLUListElement>;
  mods?: {
    popover?: boolean;
    tray?: boolean;
  };
  isClosing?: boolean;
}

export const MenuContext = React.createContext<MenuContextValue>({});

export function useMenuContext(): MenuContextValue {
  return useContext(MenuContext);
}
