import { Dialog } from './types';
import { Portal } from '../../portal';
import { ModalProvider } from '@react-aria/overlays';
import { DialogContainer } from '../Dialog';
import { AlertDialog } from './AlertDialog';

export interface DialogZoneProps {
  dialogs: Dialog[];
}

export function AlertDialogZone(props: DialogZoneProps): JSX.Element {
  const { dialogs } = props;

  return (
    <>
      {dialogs.map(({ props, meta }) => {
        const {
          type,
          isDismissable = true,
          primaryProps,
          cancelProps,
          onDismiss,
          children,
          ...options
        } = props;
        const { id, resolve, reject, isVisible, dialogType } = meta;

        return (
          <Portal key={meta.id}>
            <ModalProvider>
              <DialogContainer
                key={id}
                isDismissable={isDismissable}
                type={type}
                onDismiss={resolve}
              >
                {isVisible ? (
                  <AlertDialog
                    noActions={dialogType === 'form'}
                    primaryProps={{
                      ...primaryProps,
                      onPress: resolve,
                    }}
                    cancelProps={
                      cancelProps
                        ? {
                            ...cancelProps,
                            onPress: resolve,
                          }
                        : undefined
                    }
                    {...options}
                    key={id}
                  >
                    {typeof children === 'function'
                      ? children({ resolve, reject })
                      : children}
                  </AlertDialog>
                ) : null}
              </DialogContainer>
            </ModalProvider>
          </Portal>
        );
      })}
    </>
  );
}
