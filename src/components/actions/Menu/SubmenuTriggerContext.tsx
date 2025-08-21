import React, { RefObject } from 'react';

export interface SubmenuTriggerContextValue {
  triggerRef: RefObject<HTMLElement | null>;
  isOpen?: boolean;
  isDisabled?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onAction?: () => void;
  triggerProps?: any;
}

export const SubmenuTriggerContext =
  React.createContext<SubmenuTriggerContextValue | null>(null);

export function useSubmenuTriggerContext() {
  const context = React.useContext(SubmenuTriggerContext);
  if (!context) {
    throw new Error(
      'useSubmenuTriggerContext must be used within a SubmenuTriggerContext.Provider',
    );
  }
  return context;
}
