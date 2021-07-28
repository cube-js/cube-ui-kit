import { DialogContext } from './context';
import { Modal } from '../Modal/Modal';
import { Children, isValidElement, useRef } from 'react';

/**
 * A DialogContainer accepts a single Dialog as a child, and manages showing and hiding
 * it in a modal. Useful in cases where there is no trigger element
 * or when the trigger unmounts while the dialog is open.
 */
export function DialogContainer(props) {
  let {
    children,
    type = 'modal',
    onDismiss,
    isDismissable,
    isKeyboardDismissDisabled,
  } = props;

  let childArray = Children.toArray(children);
  if (childArray.length > 1) {
    throw new Error('Only a single child can be passed to DialogContainer.');
  }

  let lastChild = useRef(null);
  let child = isValidElement(childArray[0]) ? childArray[0] : null;
  if (child) {
    lastChild.current = child;
  }

  let context = {
    type,
    onClose: onDismiss,
    isDismissable,
  };

  return (
    <Modal
      isOpen={!!child}
      onClose={isDismissable ? onDismiss : null}
      type={type}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
    >
      <DialogContext.Provider value={context}>
        {lastChild.current}
      </DialogContext.Provider>
    </Modal>
  );
}
