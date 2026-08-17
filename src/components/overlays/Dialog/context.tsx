import { createContext, HTMLAttributes, useContext } from 'react';
import invariant from 'tiny-invariant';

export interface DialogContextValue extends HTMLAttributes<HTMLElement> {
  type?:
    | 'modal'
    | 'popover'
    | 'tray'
    | 'fullscreen'
    | 'fullscreenTakeover'
    | 'panel';
  isDismissable?: boolean;
  onClose?: (arg?: string) => void;
  isOpen?: boolean;
  /**
   * Whether closing the dialog restores focus to its trigger. Set by
   * `DialogTrigger`'s `shouldRestoreFocus` prop; consumed by `Dialog`'s
   * `FocusScope` (which owns the restore for popover-type dialogs). Defaults
   * to `true` when absent, so a `Dialog` rendered outside a trigger keeps
   * restoring focus.
   */
  shouldRestoreFocus?: boolean;
}

export const DialogContext = createContext<DialogContextValue | null>({});

export function useDialogContext() {
  const dialogContext = useContext(DialogContext);

  invariant(dialogContext !== null, '');

  return dialogContext;
}
