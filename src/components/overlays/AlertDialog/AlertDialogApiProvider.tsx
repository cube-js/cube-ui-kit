import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import invariant from 'tiny-invariant';

import { AlertDialogZone } from './AlertDialogZone';
import { AlertDialogResolveStatus, Dialog, DialogProps } from './types';

/**
 * The provider's own `open`. A dialog closes, as a cancel, when any of its
 * signals aborts: the caller's `cancelToken`, and the one that ends with the
 * component that opened it.
 */
interface AlertDialogOpener {
  open: (
    dialogProps: DialogProps,
    signals: AbortSignal[],
  ) => Promise<AlertDialogResolveStatus>;
}

const DialogApiContext = createContext<AlertDialogOpener | null>(null);

export interface AlertDialogApi {
  /**
   * Opens the dialog. Resolves with the action the user picked. Rejects with
   * `undefined` when the dialog closes without one (Cancel, dismissal, an
   * aborted `cancelToken` or the unmount of the component that opened it),
   * and with an `Error` when it cannot open. A cancel is not reported as an
   * unhandled rejection when the promise is ignored.
   */
  open: (
    dialogProps: DialogProps,
    params?: AlertDialogApiParams,
  ) => Promise<AlertDialogResolveStatus>;
}

export interface AlertDialogApiParams {
  /**
   * Closes the dialog when aborted, which settles it as a cancel. A confirm or
   * secondary action that is running finishes first.
   */
  cancelToken?: AbortSignal;
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

/**
 * Runs the button's `onPress` and the dialog's callback for the same action.
 * Returns a promise when either does, so the dialog waits for both.
 */
function runActionHandlers(handlers: ((() => unknown) | undefined)[]) {
  const pending = handlers.map(runHandler).filter(isThenable);

  return pending.length ? Promise.all(pending) : undefined;
}

/** A cancel rejection nobody listens to is not an error worth reporting. */
function ignoreUnhandled<T>(promise: Promise<T>) {
  promise.catch(() => {});

  return promise;
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

  // A context value that never changes: each `useAlertDialogAPI` caller
  // keeps the one it first saw.
  const opener = useMemo<AlertDialogOpener>(
    () => ({
      open: (dialogProps, signals) => {
        const { onDismiss, onConfirm, onSecondary, onCancel, ...restProps } =
          dialogProps;

        // An aborted signal is a cancel: it settles before anything opens.
        if (signals.some((signal) => signal.aborted)) {
          onCancel?.();

          return ignoreUnhandled(Promise.reject(undefined));
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

        // Set by an abort that came while an action ran.
        let isAbortedWhilePending = false;

        // Aborting is a cancel, so it settles the promise the way Cancel does.
        // A running action finishes first, as it does on Escape: cut short, a
        // delete that went through would be reported as cancelled.
        const onAbort = () => {
          if (pending) {
            isAbortedWhilePending = true;

            return;
          }

          currentDialog.meta.reject(undefined);
        };

        const close = () => {
          if (currentDialog.meta.isClosed) return false;

          currentDialog.meta.isClosed = true;

          for (const signal of signals) {
            signal.removeEventListener('abort', onAbort);
          }

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

        let resolvePromise!: (status: AlertDialogResolveStatus) => void;
        let rejectPromise!: (reason: unknown) => void;

        currentDialog.meta.promise = new Promise((resolve, reject) => {
          resolvePromise = resolve;
          rejectPromise = reject;
        });

        currentDialog.meta.resolve = (status) => {
          if (close()) resolvePromise(status);
        };

        // A rejection without a reason is a cancel: the Cancel button, a
        // dismissal, an aborted signal or `content` calling `reject()`.
        // Anything else is a failure.
        currentDialog.meta.reject = (reason) => {
          if (!close()) return;

          if (reason !== undefined) {
            rejectPromise(reason);

            return;
          }

          ignoreUnhandled(currentDialog.meta.promise);
          rejectPromise(undefined);
          onCancel?.();
        };

        // The confirm and secondary buttons: run the handlers, and settle
        // once they have finished. A handler that throws or rejects keeps the
        // dialog open for another try, unless it was aborted meanwhile.
        currentDialog.meta.act = (status, onPress) => {
          const result = runActionHandlers([
            onPress,
            status === 'confirm' ? onConfirm : onSecondary,
          ]);

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

              if (isAbortedWhilePending) currentDialog.meta.reject(undefined);
            },
          );
        };

        for (const signal of signals) {
          signal.addEventListener('abort', onAbort, { once: true });
        }

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
    <DialogApiContext.Provider value={opener}>
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
 * The returned promise resolves with the action the user picked and rejects
 * with `undefined` on a cancel. A caller that runs everything in the callbacks
 * can ignore it: an ignored cancel is not reported as an unhandled rejection.
 *
 * A dialog belongs to the component that calls this hook: when that component
 * unmounts, its dialog closes as a cancel, so no callback runs against a
 * component that is gone. Call the hook in a component that stays mounted
 * while the dialog is open, such as the one that renders a menu, not in the
 * menu item that closes it. A confirm or secondary action that is running
 * finishes first.
 *
 * ***Important*** only one alert dialog can be open at a time: `open` rejects
 * with an `Error` while another one is open. A dialog that is already closing
 * gives way.
 *
 * @example running the action from the dialog.
 * const { open } = useAlertDialogAPI();
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
 *   );
 * };
 *
 * // Later, e.g. when the approval arrives:
 * controllerRef.current?.abort();
 */
export function useAlertDialogAPI(): AlertDialogApi {
  const opener = useContext(DialogApiContext);

  invariant(
    opener !== null,
    "You can't use DialogApi outside of <Root /> component. Please, check if your component is descendant of <Root/> component",
  );

  const [owner] = useState(() => createDialogOwner(opener));

  // A layout effect, so it is in place before any passive effect calls `open`.
  useLayoutEffect(() => owner.attach(), [owner]);

  return owner.api;
}

/**
 * One `useAlertDialogAPI` caller's `open`, whose dialogs close when the
 * caller unmounts. Its identity is the caller's for good: callers put `open`
 * in effect dependencies.
 */
function createDialogOwner(opener: AlertDialogOpener) {
  // Aborted on unmount. Made on first use, so a StrictMode remount, which
  // runs the cleanup once, gets a fresh one.
  let lifetime: AbortController | null = null;
  let isUnmounted = false;

  const api: AlertDialogApi = {
    open: (dialogProps, params = {}) => {
      let owner: AbortSignal;

      if (isUnmounted) {
        // A late call, after an `await`, from a caller that is gone.
        owner = AbortSignal.abort();
      } else {
        lifetime ??= new AbortController();
        owner = lifetime.signal;
      }

      const { cancelToken } = params;

      return opener.open(
        dialogProps,
        cancelToken ? [owner, cancelToken] : [owner],
      );
    },
  };

  /** The effect setup. Its cleanup closes the dialogs the caller opened. */
  const attach = () => {
    isUnmounted = false;

    return () => {
      isUnmounted = true;
      lifetime?.abort();
      lifetime = null;
    };
  };

  return { api, attach };
}
