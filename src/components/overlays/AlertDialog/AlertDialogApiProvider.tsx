import { createContext, useContext, useMemo, useRef, useState } from 'react';
import invariant from 'tiny-invariant';

import { AlertDialogZone } from './AlertDialogZone';
import { AlertDialogResolveStatus, Dialog, DialogProps } from './types';

const DialogApiContext = createContext<AlertDialogApi | null>(null);

export interface AlertDialogApi {
  /**
   * Opens the dialog. Resolves with the action the user picked. Rejects with
   * `undefined` when the dialog closes without one (Cancel, dismissal or an
   * aborted `cancelToken`), and with an `Error` when it cannot open.
   */
  open: (
    dialogProps: DialogProps,
    params?: AlertDialogApiParams,
  ) => Promise<AlertDialogResolveStatus>;
}

export interface AlertDialogApiParams {
  /** Closes the dialog when aborted, rejecting the promise with `undefined`. */
  cancelToken?: AbortSignal;
}

/**
 * @internal Do not use it in your code!
 */
export function AlertDialogApiProvider(props) {
  const [openedDialog, setOpenedDialog] = useState<Dialog | null>(null);
  const id = useRef(0);

  // A context value: consumers rely on its identity staying the same.
  const api = useMemo<AlertDialogApi>(
    () => ({
      open: (dialogProps, params = {}) => {
        const { onDismiss, ...restProps } = dialogProps;
        const { cancelToken } = params;
        const currentId = ++id.current;
        const currentDialog = {
          props: null,
          meta: { id: currentId, isClosed: false, isVisible: true },
        } as unknown as Dialog;

        // Aborting is a cancel, so it settles the promise the way Cancel does.
        const onAbort = () => currentDialog.meta.reject(undefined);

        const close = () => {
          if (currentDialog.meta.isClosed) return;

          currentDialog.meta.isClosed = true;
          cancelToken?.removeEventListener('abort', onAbort);

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

        if (cancelToken?.aborted) return Promise.reject(undefined);

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

        cancelToken?.addEventListener('abort', onAbort, { once: true });

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
 * `open` resolves with the action the user picked. It rejects with `undefined`
 * when the user cancels or dismisses the dialog, or its `cancelToken` aborts,
 * and with an `Error` when the dialog cannot open. Handle the rejection, and
 * tell the two apart: a cancel is not a failure.
 *
 * Configure `actions.confirm` explicitly. The default Ok button, shown when it
 * is omitted, rejects with `undefined` instead of resolving `'confirm'`.
 *
 * ***Important*** only one alert dialog can be open at a time. `open` rejects
 * while another one is open, and for about 300 ms after one closes.
 *
 * @example opening dialog on Button click.
 * const { open } = useAlertDialogAPI();
 *
 * const onPress = async () => {
 *   let status;
 *
 *   try {
 *     status = await open({
 *       title: 'Delete the item?',
 *       danger: true,
 *       actions: { confirm: { children: 'Delete' }, cancel: true },
 *     });
 *   } catch (reason) {
 *     // Cancel or dismissal
 *     if (reason === undefined) return;
 *
 *     // A real failure, e.g. another dialog is already open
 *     throw reason;
 *   }
 *
 *   if (status === 'confirm') {
 *     // Handle confirm
 *   }
 * };
 *
 * return <Button onPress={onPress}>Delete</Button>
 *
 * @example closing the dialog from code with a cancel token.
 * const { open } = useAlertDialogAPI();
 * const controllerRef = useRef<AbortController | null>(null);
 *
 * const onPress = () => {
 *   // A signal stays aborted, so every dialog needs a fresh controller.
 *   controllerRef.current = new AbortController();
 *
 *   open(
 *     { title: 'Waiting for approval', actions: { confirm: { children: 'Hide' } } },
 *     { cancelToken: controllerRef.current.signal },
 *   ).catch((reason) => {
 *     // Aborting rejects with `undefined`, like Cancel does
 *     if (reason !== undefined) throw reason;
 *   });
 * };
 *
 * // Later, e.g. when the approval arrives:
 * controllerRef.current?.abort();
 */
export function useAlertDialogAPI(): AlertDialogApi {
  const api = useContext(DialogApiContext);

  invariant(
    api !== null,
    "You can't use DialogApi outside of <Root /> component. Please, check if your component is descendant of <Root/> component",
  );

  return api;
}
