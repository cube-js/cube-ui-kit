import { Portal } from '../../portal';
import { DialogContainer } from '../Dialog/DialogContainer';

import { AlertDialog, CubeAlertDialogActionsProps } from './AlertDialog';
import { AlertDialogResolveStatus, Dialog } from './types';

import type { CubeButtonProps } from '../../actions/Button/Button';
import type { PendingAction } from './AlertDialogApiProvider';

export interface DialogZoneProps {
  openedDialog: Dialog | null;
  pendingAction?: PendingAction | null;
}

const PORTAL_KEY = 'AlertDialogZone';

/**
 * @internal Do not use it
 */
export function AlertDialogZone(props: DialogZoneProps) {
  const { openedDialog, pendingAction } = props;

  if (openedDialog === null) return <Portal key={PORTAL_KEY} />;

  const {
    type,
    isDismissable = true,
    actions,
    onDismiss,
    content,
    ...options
  } = openedDialog.props;
  const { id, resolve, reject, act, isVisible, dialogType } = openedDialog.meta;
  // While an action's handler runs, its button shows loading and the rest
  // of the dialog is locked.
  const pending = pendingAction?.id === id ? pendingAction.status : null;
  const lock = (status?: AlertDialogResolveStatus) =>
    pending ? { isLoading: pending === status, isDisabled: true } : null;

  const _actions: CubeAlertDialogActionsProps = (() => {
    const mergeActionProps = <
      T extends
        | CubeAlertDialogActionsProps['confirm']
        | CubeAlertDialogActionsProps['secondary'],
    >(
      action: T,
      status: AlertDialogResolveStatus,
    ): T => {
      if (typeof action === 'undefined') {
        return undefined as unknown as T;
      }

      if (typeof action === 'boolean') {
        return (action
          ? { ...lock(status), onPress: () => act(status) }
          : false) as unknown as T;
      }

      const { onPress } = action as CubeButtonProps;

      return {
        ...(action as CubeButtonProps),
        ...lock(status),
        // The same as the dialog's `onConfirm` / `onSecondary`: awaited, with
        // the dialog kept open while it runs.
        onPress: (e) => act(status, onPress && (() => onPress(e))),
      } as unknown as T;
    };

    // `AlertDialog` shows the confirm button unless it is `false`, so an
    // omitted one has to resolve too, not fall through to the dismissal.
    const { confirm = true, secondary, cancel } = actions ?? {};

    return {
      confirm: mergeActionProps(confirm, 'confirm'),
      secondary: mergeActionProps(secondary, 'secondary'),
      cancel:
        typeof cancel === 'undefined'
          ? undefined
          : typeof cancel === 'boolean'
            ? cancel
              ? { ...lock(), onPress: () => reject(undefined) }
              : false
            : {
                ...(cancel as CubeButtonProps),
                ...lock(),
                onPress: (e) => {
                  (cancel as CubeButtonProps).onPress?.(e);
                  reject(undefined);
                },
              },
    };
  })();

  return (
    <Portal key={PORTAL_KEY}>
      <DialogContainer
        isOpen={isVisible}
        isDismissable={isDismissable && !pending}
        type={type}
        onDismiss={onDismiss}
      >
        <AlertDialog
          noActions={dialogType === 'form'}
          actions={_actions}
          isHidden={!isVisible}
          content={
            typeof content === 'function'
              ? content({ resolve, reject })
              : content
          }
          {...options}
        />
      </DialogContainer>
    </Portal>
  );
}
