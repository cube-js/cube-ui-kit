import { Portal } from '../../portal';
import { DialogContainer } from '../Dialog';

import { AlertDialog, CubeAlertDialogActionsProps } from './AlertDialog';
import { AlertDialogResolveStatus, Dialog } from './types';

import type { CubeButtonProps } from '../../actions/Button/Button';

export interface DialogZoneProps {
  openedDialog: Dialog | null;
}

const PORTAL_KEY = 'AlertDialogZone';

/**
 * @internal Do not use it
 */
export function AlertDialogZone(props: DialogZoneProps) {
  const { openedDialog } = props;

  if (openedDialog === null) return <Portal key={PORTAL_KEY} />;

  const {
    type,
    isDismissable = true,
    actions,
    onDismiss,
    content,
    ...options
  } = openedDialog.props;
  const { resolve, reject, isVisible, dialogType } = openedDialog.meta;

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
          ? { onPress: () => resolve(status) }
          : false) as unknown as T;
      }

      const onPress = action.onPress;

      return {
        ...(action as CubeButtonProps),
        onPress: (e) => {
          onPress?.(e);
          resolve(status);
        },
      } as unknown as T;
    };

    if (typeof actions === 'undefined') return {};

    return {
      confirm: mergeActionProps(actions.confirm, 'confirm'),
      secondary: mergeActionProps(actions.secondary, 'secondary'),
      cancel:
        typeof actions.cancel === 'undefined'
          ? undefined
          : typeof actions.cancel === 'boolean'
            ? actions.cancel
              ? { onPress: () => reject(undefined) }
              : false
            : {
                ...(actions.cancel as CubeButtonProps),
                onPress: (e) => {
                  (actions.cancel as CubeButtonProps).onPress?.(e);
                  reject(undefined);
                },
              },
    };
  })();

  return (
    <Portal key={PORTAL_KEY}>
      <DialogContainer
        isOpen={isVisible}
        isDismissable={isDismissable}
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
