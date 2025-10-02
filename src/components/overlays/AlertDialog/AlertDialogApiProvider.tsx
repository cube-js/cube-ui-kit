import { createContext, useContext, useMemo, useRef, useState } from 'react';
import invariant from 'tiny-invariant';

import { AlertDialogZone } from './AlertDialogZone';
import { AlertDialogResolveStatus, Dialog, DialogProps } from './types';

const DialogApiContext = createContext<DialogApi | null>(null);

interface DialogApi {
  open: (
    dialogProps: DialogProps,
    params?: DialogApiParams,
  ) => Promise<AlertDialogResolveStatus>;
}

interface DialogApiParams {
  cancelToken?: AbortSignal;
}

/**
 * @internal Do not use it in your code!
 */
export function AlertDialogApiProvider(props) {
  const [openedDialog, setOpenedDialog] = useState<Dialog | null>(null);
  const id = useRef(0);

  const api = useMemo<DialogApi>(
    () => ({
      open: (dialogProps, params = {}) => {
        const { onDismiss, ...restProps } = dialogProps;
        const { cancelToken } = params;
        const currentId = ++id.current;
        const currentDialog = {
          props: null,
          meta: { id: currentId, isClosed: false, isVisible: true },
        } as unknown as Dialog;

        const close = () => {
          if (currentDialog.meta.isClosed) return;

          currentDialog.meta.isClosed = true;
          params.cancelToken?.removeEventListener('abort', close);

          setOpenedDialog((currentState) =>
            currentState?.meta.id !== currentId
              ? currentState
              : {
                  props: currentState.props,
                  meta: { ...currentState.meta, isVisible: false },
                },
          );

          setTimeout(
            () =>
              setOpenedDialog((currentState) =>
                currentState?.meta.id !== currentId ? currentState : null,
              ),
            300,
          );
        };

        if (cancelToken?.aborted)
          return new Promise<AlertDialogResolveStatus>(() => {});
        cancelToken?.addEventListener('abort', close, { once: true });

        currentDialog.meta.promise = new Promise((resolve, reject) => {
          currentDialog.meta.resolve = (status: AlertDialogResolveStatus) => {
            close();
            resolve(status);
          };
          currentDialog.meta.reject = (reason) => {
            close();
            reject(reason);
          };
        });

        currentDialog.props = {
          ...restProps,
          onDismiss: (e) => {
            onDismiss?.(e);
            currentDialog.meta.reject(undefined);
          },
        };

        setOpenedDialog((openedDialog) => {
          // we already have opened dialog, so we reject opening another
          if (openedDialog !== null) {
            currentDialog.meta.reject(
              new Error(
                "Another dialog is already opened. It's a bad practice to open more than one <AlertDialog /> at the same time",
              ),
            );

            return openedDialog;
          }

          return currentDialog;
        });

        return currentDialog.meta.promise;
      },
    }),
    [],
  );

  return (
    <DialogApiContext.Provider value={api}>
      <AlertDialogZone openedDialog={openedDialog} />
      {props.children}
    </DialogApiContext.Provider>
  );
}

/**
 * Hook gives the ability to open `<AlertDialog />` imperatively.
 *
 * ***Important*** it's commonly a bad practice when you open multiple dialogs in a row;
 * that means this api will reject all dialogs when there is already open one
 *
 * @example calling in a side effect
 * const alertDialogAPI = useAlertDialogAPI();
 *
 * useEffect(() => {
 *   const abortDialog = new AbortController();
 *   const openedDialog = alertDialogAPI.open({
 *     title: 'Are you sure?',
 *     content: <Paragraph>Test content</Paragraph>
 *   }, {
 *      cancelToken: abortDialog.signal
 *   });
 *
 *   openedDialog
 *     .then((status) => {
 *       // User confirmed or used secondary action
 *       if (status === 'confirm') {
 *         // Handle confirm
 *       } else if (status === 'secondary') {
 *         // Handle secondary action
 *       }
 *     })
 *     .catch(() => {
 *       // User cancelled or dismissed the dialog
 *       // Handle cancel/dismiss
 *     })
 *
 *   return () => {
 *     abortDialog.abort();
 *   }
 * }, [])
 *
 * @example opening dialog on Button click.
 * const alertDialogAPI = useAlertDialogAPI();
 *
 * const onPress = useCallback(() => {
 *   alertDialogAPI.open({...})
 *     .then((status) => {
 *       if (status === 'confirm') {
 *         // Handle confirm
 *       }
 *     })
 *     .catch(() => {
 *       // Handle cancel/dismiss
 *     })
 * }, [])
 *
 * return <Button onPress={onPress}>New issue</Button>
 */
export function useAlertDialogAPI(): DialogApi {
  const api = useContext(DialogApiContext);

  invariant(
    api !== null,
    "You can't use DialogApi outside of <Root /> component. Please, check if your component is descendant of <Root/> component",
  );

  return api;
}
