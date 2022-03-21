import { useContext, createContext, useMemo, useRef, useState } from 'react';
import invariant from 'tiny-invariant';
import { AlertDialogZone } from './AlertDialogZone';
import { Dialog, DialogProps } from './types';

const DialogApiContext = createContext<DialogApi | null>(null);

interface DialogApi {
  open: (dialogProps: DialogProps) => Promise<void>;
}

/**
 *
 * @internal Do not use it in your code!
 */
export function AlertDialogApiProvider(props) {
  const [dialogList, setDialogList] = useState<Dialog[]>([]);
  const id = useRef(0);

  const api = useMemo<DialogApi>(
    () => ({
      open: (dialogProps) => {
        let currentIndex: null | number = null;
        const currentId = ++id.current;
        const currentDialog = {
          props: dialogProps,
          meta: { id: currentId, isClosed: false, isVisible: true },
        } as Dialog;

        const close = () => {
          if (currentDialog.meta.isClosed) return;

          currentDialog.meta.isClosed = true;

          setDialogList((currentState) => {
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
            setDialogList((currentState) => {
              currentIndex = null;
              currentDialog.meta.resolve();

              return currentState.filter(
                (dialog) => currentId !== dialog.meta.id,
              );
            });
          }, 300);
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

        setDialogList((currentState) => {
          currentIndex = currentState.length;
          return [...currentState, currentDialog];
        });

        return currentDialog.meta.promise;
      },
    }),
    [],
  );

  return (
    <DialogApiContext.Provider value={api}>
      <AlertDialogZone dialogs={dialogList} />
      {props.children}
    </DialogApiContext.Provider>
  );
}

export function useAlertDialogAPI(): DialogApi {
  const api = useContext(DialogApiContext);

  invariant(
    api !== null,
    'You can\'t use DialogApi outside of <Root /> component. Please, check if your component is descendant of <Root/> component',
  );

  return api;
}
