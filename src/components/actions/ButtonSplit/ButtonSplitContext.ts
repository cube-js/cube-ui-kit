import { createContext, useContext } from 'react';

export interface ButtonSplitContextValue {
  currentKey: string | undefined;
  onAction: ((key: string) => void) | undefined;
  onActionChange: ((key: string) => void) | undefined;
  type?: string;
  theme?: string;
  size?: string | number;
  isDisabled?: boolean;
}

export const ButtonSplitContext = createContext<ButtonSplitContextValue | null>(
  null,
);

export function useButtonSplitContext(): ButtonSplitContextValue | null {
  return useContext(ButtonSplitContext);
}
