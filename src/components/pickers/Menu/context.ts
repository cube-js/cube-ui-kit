import { FocusStrategy } from '@react-types/shared';
import React, { HTMLAttributes, MutableRefObject, useContext } from 'react';

export interface MenuContextValue extends HTMLAttributes<HTMLElement> {
  onClose?: () => void;
  closeOnSelect?: boolean;
  shouldFocusWrap?: boolean;
  autoFocus?: boolean | FocusStrategy;
  ref?: MutableRefObject<HTMLUListElement>;
}

export const MenuContext = React.createContext<MenuContextValue>({});

export function useMenuContext(): MenuContextValue {
  return useContext(MenuContext);
}
