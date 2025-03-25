import React, { useState, useMemo } from 'react';

import { useEvent } from '../../../_internal/index';

import { DialogContainer } from './DialogContainer';

/**
 * Generic hook to manage a dialog component.
 *
 * @param Component - A React component that represents the dialog content. It must accept props of type P.
 * @returns An object with `open` function to open the dialog with provided props and `rendered` JSX element to include in your component tree.
 */
export function useDialogContainer<P>(Component: React.ComponentType<P>) {
  const [isOpen, setIsOpen] = useState(false);
  const [componentProps, setComponentProps] = useState<P | null>(null);

  // 'open' accepts props required by the Component and opens the dialog
  const open = useEvent((props: P) => {
    setComponentProps(props);
    setIsOpen(true);
  });

  const close = useEvent(() => {
    setIsOpen(false);
  });

  // Render the dialog only when componentProps is set
  const rendered = useMemo(() => {
    if (!componentProps) return null;

    return (
      <DialogContainer isOpen={isOpen} onDismiss={close}>
        <Component {...componentProps} />
      </DialogContainer>
    );
  }, [componentProps, isOpen]);

  return { open, close, rendered };
}
