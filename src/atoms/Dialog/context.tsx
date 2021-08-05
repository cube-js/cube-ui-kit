import { createContext, HTMLAttributes } from 'react';

export interface DialogContextValue extends HTMLAttributes<HTMLElement> {
  type?: 'modal' | 'popover' | 'tray' | 'fullscreen' | 'fullscreenTakeover';
  isDismissable?: boolean;
  onClose?: () => void;
}

export const DialogContext = createContext<DialogContextValue | null>({});
