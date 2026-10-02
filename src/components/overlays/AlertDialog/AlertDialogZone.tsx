import { Portal } from '../../portal';
import { DialogContainer } from '../Dialog/DialogContainer';

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
              ? { onPress: () => reject(undefined) }
              : false
            : {
                ...(cancel as CubeButtonProps),
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
