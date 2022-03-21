import { Dialog } from './types';
import { Portal } from '../../portal';
import { DialogContainer } from '../Dialog';
import { AlertDialog, CubeAlertDialogActionsProps } from './AlertDialog';

export interface DialogZoneProps {
  dialogs: Dialog[];
}

/**
 * @internal Do not use it
 */
export function AlertDialogZone(props: DialogZoneProps): JSX.Element {
  const { dialogs } = props;

  return (
    <>
      {dialogs.map(({ props, meta }) => {
        const {
          type,
          isDismissable = true,
          actions,
          onDismiss,
          content,
          ...options
        } = props;
        const { id, resolve, reject, isVisible, dialogType } = meta;

        const _actions: CubeAlertDialogActionsProps = {
          confirm:
            typeof actions?.confirm === 'boolean'
              ? { onPress: resolve }
              : { ...actions?.confirm, onPress: resolve },
          secondary: actions?.secondary,
          cancel:
            typeof actions?.cancel === 'boolean'
              ? { onPress: resolve }
              : { ...actions?.cancel, onPress: reject },
        };

        return (
          <Portal key={meta.id}>
            <DialogContainer
              key={id}
              isOpen={isVisible}
              isDismissable={isDismissable}
              type={type}
              onDismiss={resolve}
            >
              <AlertDialog
                key={id}
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
      })}
    </>
  );
}
