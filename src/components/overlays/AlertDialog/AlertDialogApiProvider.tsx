import { createContext, useContext, useMemo, useRef, useState } from 'react';
import invariant from 'tiny-invariant';

import { AlertDialogZone } from './AlertDialogZone';
import {
  AlertDialogResolveStatus,
  AlertDialogStatus,
  Dialog,
  DialogProps,
} from './types';

interface AlertDialogController {
  show: (
    dialogProps: DialogProps,
    params: AlertDialogApiParams,
    resolveOnCancel: boolean,
  ) => Promise<AlertDialogStatus>;
}

const DialogApiContext = createContext<AlertDialogController | null>(null);

export interface AlertDialogApi<ResolveOnCancel extends boolean = false> {
  /**
   * Opens the dialog. Resolves with the action the user picked. When the
   * dialog closes without one (Cancel, dismissal or an aborted `cancelToken`)
   * it rejects with `undefined`, or resolves `'cancel'` with `resolveOnCancel`.
   * It rejects with an `Error` when the dialog cannot open.
   */
  open: (
    dialogProps: DialogProps,
    params?: AlertDialogApiParams,
  ) => Promise<
    ResolveOnCancel extends true ? AlertDialogStatus : AlertDialogResolveStatus
  >;
}

export interface AlertDialogApiParams {
  /** Closes the dialog when aborted, which settles it as a cancel. */
  cancelToken?: AbortSignal;
}

export interface AlertDialogApiOptions {
  /**
   * Resolve `'cancel'` instead of rejecting with `undefined` when the dialog
   * closes without an action. Opt-in while callers migrate; it is planned to
   * become the default.
   */
  resolveOnCancel?: boolean;
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return !!value && typeof (value as PromiseLike<unknown>).then === 'function';
}

/** Runs an action handler, turning a throw into a rejected promise. */
function runHandler(handler: (() => unknown) | undefined): unknown {
  if (!handler) return undefined;

  try {
    return handler();
  } catch (error) {
    return Promise.reject(error);
  }
}

/** Reports a failed action handler without throwing into the press. */
function reportActionError(error: unknown) {
  if (typeof globalThis.reportError === 'function') {
    globalThis.reportError(error);
  } else {
    setTimeout(() => {
      throw error;
    });
  }
}

/**
 * The dialog whose action handler is still running, and which action.
 * @internal
 */
export interface PendingAction {
  id: number;
  status: AlertDialogResolveStatus;
}

/**
 * @internal Do not use it in your code!
 */
export function AlertDialogApiProvider(props) {
  const [openedDialog, setOpenedDialog] = useState<Dialog | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const id = useRef(0);

  // A context value: consumers rely on its identity staying the same.
  const controller = useMemo<AlertDialogController>(
    () => ({
      show: (dialogProps, params, resolveOnCancel) => {
        const { onDismiss, onConfirm, onSecondary, onCancel, ...restProps } =
          dialogProps;
        const { cancelToken } = params;

        // An aborted signal is a cancel: it settles before anything opens.
        if (cancelToken?.aborted) {
          onCancel?.();

          return resolveOnCancel
            ? Promise.resolve('cancel')
            : Promise.reject(undefined);
        }

        const currentId = ++id.current;
        const currentDialog = {
          props: null,
          meta: { id: currentId, isClosed: false, isVisible: true },
        } as unknown as Dialog;
        // Set while an action handler's promise runs: the dialog stays open.
        let pending: AlertDialogResolveStatus | null = null;

        const setPending = (status: AlertDialogResolveStatus | null) => {
          pending = status;
          setPendingAction((current) =>
            status
              ? { id: currentId, status }
              : current?.id === currentId
                ? null
                : current,
          );
        };

        // Aborting is a cancel, so it settles the promise the way Cancel does.
        const onAbort = () => currentDialog.meta.reject(undefined);

        const close = () => {
          if (currentDialog.meta.isClosed) return false;

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

          return true;
        };

        let resolvePromise!: (status: AlertDialogStatus) => void;
        let rejectPromise!: (reason: unknown) => void;

        currentDialog.meta.promise = new Promise((resolve, reject) => {
          resolvePromise = resolve;
          rejectPromise = reject;
        });

        currentDialog.meta.resolve = (status) => {
          if (close()) resolvePromise(status);
        };

        // A rejection without a reason is a cancel: the Cancel button, a
        // dismissal, an aborted `cancelToken` or `content` calling `reject()`.
        // Anything else is a failure.
        currentDialog.meta.reject = (reason) => {
          if (!close()) return;

          if (reason !== undefined) {
            rejectPromise(reason);

            return;
          }

          if (resolveOnCancel) {
            resolvePromise('cancel');
          } else {
            rejectPromise(undefined);
          }

          onCancel?.();
        };

        // The confirm and secondary buttons: run the handler, and settle once
        // it has finished. A handler that throws or rejects keeps the dialog
        // open for another try.
        currentDialog.meta.act = (status) => {
          const result = runHandler(
            status === 'confirm' ? onConfirm : onSecondary,
          );

          if (!isThenable(result)) {
            currentDialog.meta.resolve(status);

            return;
          }

          setPending(status);

          result.then(
            () => {
              setPending(null);

              if (currentDialog.meta.isClosed) return;

              currentDialog.meta.resolve(status);
              // The press's own dismissal was held back while it ran.
              onDismiss?.(status);
            },
            (error) => {
              setPending(null);
              reportActionError(error);
            },
          );
        };

        cancelToken?.addEventListener('abort', onAbort, { once: true });

        currentDialog.props = {
          ...restProps,
          // Called with the action's name by the action buttons, and without
          // one by Escape and a click outside.
          onDismiss: (action) => {
            if (pending) return;

            onDismiss?.(action);
            currentDialog.meta.reject(undefined);
          },
        };

        setOpenedDialog((openedDialog) => {
          // Another dialog is open, so this one can't be. One that is only
          // animating out gives way: its cleanup checks the id, so it leaves
          // the new dialog alone.
          if (openedDialog !== null && !openedDialog.meta.isClosed) {
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
    <DialogApiContext.Provider value={controller}>
      <AlertDialogZone
        openedDialog={openedDialog}
        pendingAction={pendingAction}
      />
      {props.children}
    </DialogApiContext.Provider>
  );
}

/**
 * Hook gives the ability to open `<AlertDialog />` imperatively.
 *
 * Pass the action as `onConfirm`. If it returns a promise, the dialog waits
 * for it with the button loading, and stays open if it fails.
 *
 * With `resolveOnCancel`, a dialog closed without an action resolves
 * `'cancel'`, so the returned promise can be ignored. Without it, `open`
 * rejects with `undefined` on a cancel, which callers must tell apart from a
 * real failure. `resolveOnCancel` is planned to become the default.
 *
 * ***Important*** only one alert dialog can be open at a time: `open` rejects
 * with an `Error` while another one is open. A dialog that is already closing
 * gives way.
 *
 * @example running the action from the dialog.
 * const { open } = useAlertDialogAPI({ resolveOnCancel: true });
 *
 * const onPress = () => {
 *   open({
 *     title: 'Delete the item?',
 *     danger: true,
 *     actions: { confirm: { children: 'Delete' }, cancel: true },
 *     onConfirm: () => deleteItem(),
 *   });
 * };
 *
 * return <Button onPress={onPress}>Delete</Button>
 *
 * @example branching on the result.
 * const { open } = useAlertDialogAPI({ resolveOnCancel: true });
 *
 * const onLeave = async () => {
 *   const status = await open({
 *     title: 'Unsaved changes',
 *     actions: {
 *       confirm: { children: 'Save' },
 *       secondary: { children: 'Discard' },
 *       cancel: true,
 *     },
 *     onConfirm: () => save(),
 *   });
 *
 *   // 'cancel' is truthy: compare, don't test it
 *   if (status === 'cancel') return;
 *
 *   navigate('/');
 * };
 */
export function useAlertDialogAPI(): AlertDialogApi;
export function useAlertDialogAPI(
  options: AlertDialogApiOptions & { resolveOnCancel: true },
): AlertDialogApi<true>;
export function useAlertDialogAPI(
  options?: AlertDialogApiOptions,
): AlertDialogApi<boolean>;
export function useAlertDialogAPI(
  options: AlertDialogApiOptions = {},
): AlertDialogApi<boolean> {
  const controller = useContext(DialogApiContext);
  const resolveOnCancel = !!options.resolveOnCancel;

  invariant(
    controller !== null,
    "You can't use DialogApi outside of <Root /> component. Please, check if your component is descendant of <Root/> component",
  );

  // Callers put `open` in effect dependencies, so it has to stay the same.
  return useMemo(
    () => ({
      open: (dialogProps, params = {}) =>
        controller.show(dialogProps, params, resolveOnCancel),
    }),
    [controller, resolveOnCancel],
  );
}
