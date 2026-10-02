import { createContext, useContext, useMemo, useRef, useState } from 'react';
import invariant from 'tiny-invariant';

import { AlertDialogZone } from './AlertDialogZone';
import {
  AlertDialogConfirmStatus,
  AlertDialogResolveStatus,
  Dialog,
  DialogProps,
} from './types';

const DialogApiContext = createContext<AlertDialogApi | null>(null);

export interface AlertDialogApi {
  /**
   * Opens the dialog. Resolves with the action the user picked; rejects with
   * `undefined` when the dialog closes without one (Cancel, dismissal or an
   * aborted `cancelToken`).
   */
  open: (
    dialogProps: DialogProps,
    params?: AlertDialogApiParams,
  ) => Promise<AlertDialogResolveStatus>;
  /**
   * Opens the dialog like `open`, but a dialog closed without an action
   * resolves `'cancel'` instead of rejecting. It rejects only when the dialog
   * cannot open, or when `content` calls `reject` with a reason.
   */
  confirm: (
    dialogProps: DialogProps,
    params?: AlertDialogApiParams,
  ) => Promise<AlertDialogConfirmStatus>;
}

export interface AlertDialogApiParams {
  /** Closes the dialog when aborted, which settles it as a cancel. */
  cancelToken?: AbortSignal;
}

/**
 * @internal Do not use it in your code!
 */
export function AlertDialogApiProvider(props) {
  const [openedDialog, setOpenedDialog] = useState<Dialog | null>(null);
  const id = useRef(0);

  // The API object is a context value, so its identity is the contract.
  const api = useMemo<AlertDialogApi>(() => {
    /**
     * A rejection without a reason is a cancel: the Cancel action, a dismissal,
     * an aborted `cancelToken`, or `content` calling `reject()`. With
     * `resolveOnCancel` it resolves `'cancel'` instead.
     */
    const show = (
      dialogProps: DialogProps,
      params: AlertDialogApiParams,
      resolveOnCancel: boolean,
    ): Promise<AlertDialogConfirmStatus> => {
      const { onDismiss, ...restProps } = dialogProps;
      const { cancelToken } = params;

      if (cancelToken?.aborted) {
        return resolveOnCancel
          ? Promise.resolve('cancel')
          : Promise.reject(undefined);
      }

      const currentId = ++id.current;
      const currentDialog = {
        props: null,
        meta: { id: currentId, isClosed: false, isVisible: true },
      } as unknown as Dialog;

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

      currentDialog.meta.promise = new Promise((resolve, reject) => {
        currentDialog.meta.resolve = (status) => {
          close();
          resolve(status);
        };
        currentDialog.meta.reject = (reason) => {
          close();

          if (reason === undefined && resolveOnCancel) {
            resolve('cancel');
          } else {
            reject(reason);
          }
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
    };

    return {
      // Never resolves `'cancel'`: a cancel rejects instead.
      open: (dialogProps, params = {}) =>
        show(dialogProps, params, false) as Promise<AlertDialogResolveStatus>,
      confirm: (dialogProps, params = {}) => show(dialogProps, params, true),
    };
  }, []);

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
 * Prefer `confirm`: it resolves `'cancel'` when the user closes the dialog
 * without an action, so a forgotten `.catch` can't leave an unhandled
 * rejection. `'cancel'` is truthy, so compare the status, never test it.
 * `open` rejects with `undefined` in that case instead.
 *
 * ***Important*** it's commonly a bad practice when you open multiple dialogs in a row;
 * that means this api will reject all dialogs when there is already open one
 *
 * @example opening dialog on Button click.
 * const { confirm } = useAlertDialogAPI();
 *
 * const onPress = async () => {
 *   const status = await confirm({
 *     title: 'Delete the item?',
 *     danger: true,
 *     actions: { confirm: { children: 'Delete' }, cancel: true },
 *   });
 *
 *   if (status !== 'confirm') return;
 *
 *   // Handle confirm
 * };
 *
 * return <Button onPress={onPress}>Delete</Button>
 *
 * @example closing the dialog from a side effect
 * const { confirm } = useAlertDialogAPI();
 *
 * useEffect(() => {
 *   const abortDialog = new AbortController();
 *
 *   confirm({
 *     title: 'Are you sure?',
 *     content: <Paragraph>Test content</Paragraph>
 *   }, {
 *     cancelToken: abortDialog.signal
 *   }).then((status) => {
 *     // 'cancel' when the user cancelled, dismissed or the effect cleaned up
 *   });
 *
 *   return () => {
 *     abortDialog.abort();
 *   }
 * }, [])
 */
export function useAlertDialogAPI(): AlertDialogApi {
  const api = useContext(DialogApiContext);

  invariant(
    api !== null,
    "You can't use DialogApi outside of <Root /> component. Please, check if your component is descendant of <Root/> component",
  );

  return api;
}
