import { OverlayTriggerState } from '@react-stately/overlays';
import { createContext, HTMLAttributes, useContext } from 'react';
import invariant from 'tiny-invariant';

export interface DialogContextValue extends HTMLAttributes<HTMLElement> {
  type?: 'modal' | 'popover' | 'tray' | 'fullscreen' | 'fullscreenTakeover';
  isDismissable?: boolean;
  onClose?: (arg?: string) => void;
}

export const DialogContext = createContext<DialogContextValue | null>({});

export function useDialogContext() {
  const dialogContext = useContext(DialogContext);

  invariant(dialogContext !== null, '');

  return dialogContext;
}
