import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  ReactNode,
} from 'react';

import { useEvent } from '../../../_internal/index';

import { DialogContainer } from './DialogContainer';

// Define a context type to handle dialog operations
interface DialogContextType {
  addDialog: (element: React.ReactNode) => number;
  removeDialog: (id: number) => void;
  updateDialog: (id: number, element: React.ReactNode) => void;
}

// Create a context for dialogs
const DialogContext = createContext<DialogContextType | null>(null);

// Provider component that renders dialogs outside the normal tree
export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialogs, setDialogs] = useState<
    Array<{ id: number; element: React.ReactNode }>
  >([]);

  const addDialog = useCallback((element: React.ReactNode) => {
    // Create a unique id for the dialog
    const id = Date.now() + Math.random();

    setDialogs((prev) => [...prev, { id, element }]);

    return id;
  }, []);

  const removeDialog = useCallback((id: number) => {
    setDialogs((prev) => prev.filter((dialog) => dialog.id !== id));
  }, []);

  const updateDialog = useCallback((id: number, element: React.ReactNode) => {
    setDialogs((prev) =>
      prev.map((dialog) => (dialog.id === id ? { id, element } : dialog)),
    );
  }, []);

  return (
    <DialogContext.Provider value={{ addDialog, removeDialog, updateDialog }}>
      {children}
      {dialogs.map(({ id, element }) => (
        <React.Fragment key={id}>{element}</React.Fragment>
      ))}
    </DialogContext.Provider>
  );
};

/**
 * Custom hook to open a dialog using a global context.
 *
 * @param Component - A React component representing the dialog content. It receives props of type P.
 * @returns An object with an `open` function to display the dialog and a generic `close` function.
 */
export function useDialogContainer<P>(Component: React.ComponentType<P>) {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialogContainer must be used within a DialogProvider');
  }
  const { addDialog, removeDialog, updateDialog } = context;

  const [isOpen, setIsOpen] = useState(false);
  const [componentProps, setComponentProps] = useState<P | null>(null);

  const open = useEvent((props: P) => {
    setComponentProps(props);
    setIsOpen(true);
  });

  const close = useEvent(() => {
    setIsOpen(false);
  });

  const renderedElement = useMemo(
    () =>
      componentProps ? (
        <DialogContainer isOpen={isOpen} onDismiss={close}>
          {componentProps && <Component {...componentProps} />}
        </DialogContainer>
      ) : null,
    [isOpen, componentProps],
  );

  const dialogIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Register the dialog on mount
    dialogIdRef.current = addDialog(renderedElement);

    return () => {
      // Remove the dialog on unmount
      if (dialogIdRef.current !== null) {
        removeDialog(dialogIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Update the dialog when the rendered element changes
    if (dialogIdRef.current !== null) {
      updateDialog(dialogIdRef.current, renderedElement);
    }
  }, [renderedElement]);

  return { open, close };
}
