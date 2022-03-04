import { useContext, createContext, useMemo, useRef, useState } from 'react';
import invariant from 'tiny-invariant';
import { AlertDialogZone } from './AlertDialogZone';
import { Dialog, DialogProps } from './types';

const DialogApiContext = createContext<DialogApi | null>(null);

interface DialogApi {
  open: (dialogProps: DialogProps) => {
    promise: Promise<void>;
    close: () => void;
  };
}

/**
 *
 * @internal Do not use it in your code!
 */
export function AlertDialogApiProvider(props) {
  const [dialogsList, setDialogsList] = useState<Dialog[]>([]);
  const id = useRef(0);

  const api = useMemo<DialogApi>(
    () => ({
      open: (dialogProps) => {
        let currentIndex: null | number = null;
        const currentId = ++id.current;
        const currentDialog = {
          props: dialogProps,
          meta: { id: currentId, closed: false, isVisible: true },
        } as Dialog;

        const close = () => {
          if (currentDialog.meta.closed) return;

          currentDialog.meta.closed = true;

          setDialogsList((currentState) => {
            if (currentIndex === null) return currentState;

            if (currentState[currentIndex]?.meta.id !== currentId)
              return currentState;

            currentState[currentIndex].meta = {
              ...currentState[currentIndex].meta,
              isVisible: false,
            };
            return [...currentState];
          });

          setTimeout(() => {
            setDialogsList((currentState) => {
              currentIndex = null;
              currentDialog.meta.resolve();

              return currentState.filter(
                (dialog) => currentId !== dialog.meta.id,
              );
            });
          }, 10000);
        };

        currentDialog.meta.promise = new Promise<void>((resolve, reject) => {
          currentDialog.meta.resolve = () => {
            close();
            resolve();
          };
          currentDialog.meta.reject = () => {
            close();
            reject();
          };
        });

        setDialogsList((currentState) => {
          currentIndex = currentState.length;
          return [...currentState, currentDialog];
        });

        return {
          promise: currentDialog.meta.promise,
          close: close,
        };
      },
    }),
    [],
  );

  return (
    <DialogApiContext.Provider value={api}>
      <AlertDialogZone dialogs={dialogsList} />
      {props.children}
    </DialogApiContext.Provider>
  );
}

export function useAlertDialogApi(): DialogApi {
  const api = useContext(DialogApiContext);

  invariant(
    api !== null,
    'You can\'t use DialogApi outside of <Root /> component. Please, check if your component is descendant of <Root/> component',
  );

  return api;
}
