import {
  Children,
  ReactNode,
  useRef,
  isValidElement,
  ReactElement,
} from 'react';

import { WithCloseBehavior, Modal } from '../Modal';

import { DialogContext } from './context';

export interface CubeDialogContainerProps extends WithCloseBehavior {
  /** The Dialog to display, if any. */
  children?: ReactNode;
  /** Handler that is called when the 'x' button of a dismissible Dialog is clicked. */
  onDismiss?: (arg?: any) => void;
  /**
   * The type of Dialog that should be rendered. See the visual options below for examples of each.
   * @default 'modal'
   */
  type?: 'modal' | 'fullscreen' | 'fullscreenTakeover' | 'panel';
  /** Whether the Dialog is dismissible. See the [Dialog docs](Dialog.html#dismissable-dialogs) for more details. */
  isDismissable?: boolean;
  /**
   * This prop allows you to configure whenever the modal is open or not
   */
  isOpen?: boolean;
  /** Whether pressing the escape key to close the dialog should be disabled. */
  isKeyboardDismissDisabled?: boolean;
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
    isDismissable,
    isKeyboardDismissDisabled,
    isOpen,
    hideOnClose,
  } = props;

  const childArray = Children.toArray(children);
  if (childArray.length > 1) {
    throw new Error('Only a single child can be passed to DialogContainer.');
  }

  const lastChild = useRef<ReactElement>();
  const child = isValidElement(childArray[0]) ? childArray[0] : null;

  if (child) {
    lastChild.current = child;
  }

  const isActuallyOpened = typeof isOpen !== 'boolean' ? !!child : isOpen;

  const context = {
    type,
    onClose: onDismiss,
    isDismissable,
    isOpen,
  };

  return (
    <Modal
      isOpen={isActuallyOpened}
      type={type}
      hideOnClose={hideOnClose}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      onClose={isDismissable ? onDismiss : undefined}
    >
      <DialogContext.Provider value={context}>{child}</DialogContext.Provider>
    </Modal>
  );
}
