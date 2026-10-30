import { Styles } from '@tenphi/tasty';
import { Children, isValidElement, ReactNode, useState } from 'react';

import { Modal } from '../Modal/Modal';
import { Tray } from '../Modal/Tray';
import { WithCloseBehavior } from '../Modal/types';

import { DialogContext } from './context';
import {
  DiscardChangesDialog,
  useDismissConfirmation,
} from './use-dismiss-confirmation';

export interface CubeDialogContainerProps extends WithCloseBehavior {
  /** The Dialog to display, if any. */
  children?: ReactNode;
  /** Handler that is called when the 'x' button of a dismissible Dialog is clicked. */
  onDismiss?: (arg?: any) => void;
  /**
   * The type of Dialog that should be rendered. See the visual options below for examples of each.
   * @default 'modal'
   */
  type?: 'modal' | 'tray' | 'fullscreen' | 'fullscreenTakeover' | 'panel';
  /** Styles for the overlay content shell. Style the child Dialog separately. */
  styles?: Styles;
  /** Whether the Dialog is dismissible. See the [Dialog docs](Dialog.html#dismissable-dialogs) for more details. */
  isDismissable?: boolean;
  /**
   * This prop allows you to configure whenever the modal is open or not
   */
  isOpen?: boolean;
  /** Whether pressing the escape key to close the dialog should be disabled. */
  isKeyboardDismissDisabled?: boolean;
  /**
   * Whether Escape, an outside click and the close button ask "Discard
   * changes?" before they close the dialog. Unset, they ask while a form
   * inside (a `DialogForm`, or a modern `Form`) has unsaved edits. Explicit
   * actions (submit, Cancel, closing it from code) never ask.
   */
  confirmDismiss?: boolean;
}

/**
 * A DialogContainer accepts a single Dialog as a child, and manages to show and hide
 * it in a modal.
 * Useful in cases where there is no trigger element
 * or when the trigger unmounts while the dialog is open.
 */
export function DialogContainer(props: CubeDialogContainerProps) {
  const {
    children,
    type = 'modal',
    onDismiss,
    isDismissable = true,
    isKeyboardDismissDisabled,
    isOpen,
    hideOnClose,
    styles,
    confirmDismiss,
  } = props;

  const childArray = Children.toArray(children);
  if (childArray.length > 1) {
    throw new Error('Only a single child can be passed to DialogContainer.');
  }

  const child = isValidElement(childArray[0]) ? childArray[0] : null;
  const isActuallyOpened = typeof isOpen !== 'boolean' ? !!child : isOpen;
  const [lastDialog, setLastDialog] = useState({ children, child });

  // Children.toArray clones elements, so compare the source when retaining
  // the last dialog to keep hideOnClose from remounting it or looping renders.
  if ((child || isActuallyOpened) && children !== lastDialog.children) {
    setLastDialog({ children, child });
  }

  const { requestDismiss, registerUnsavedChanges, confirmationProps } =
    useDismissConfirmation(confirmDismiss, isActuallyOpened);

  const context = {
    type,
    onClose: onDismiss,
    isDismissable,
    isOpen: isActuallyOpened,
    requestDismiss,
    registerUnsavedChanges,
  };
  const OverlayComponent = type === 'tray' ? Tray : Modal;

  return (
    <>
      {/*
        The exit animation preserves its children. Keep live open state outside
        that snapshot so forms cancel immediately when the container closes.
      */}
      <DialogContext.Provider value={context}>
        <OverlayComponent
          isOpen={isActuallyOpened}
          type={type === 'tray' ? undefined : type}
          styles={styles}
          hideOnClose={hideOnClose}
          isDismissable={isDismissable}
          isKeyboardDismissDisabled={isKeyboardDismissDisabled}
          onClose={
            isDismissable && onDismiss
              ? () => requestDismiss(() => onDismiss())
              : undefined
          }
        >
          <>
            {child ??
              (hideOnClose && !isActuallyOpened ? lastDialog.child : null)}
          </>
        </OverlayComponent>
      </DialogContext.Provider>
      {confirmationProps && (
        <DialogContainer {...confirmationProps}>
          <DiscardChangesDialog />
        </DialogContainer>
      )}
    </>
  );
}
