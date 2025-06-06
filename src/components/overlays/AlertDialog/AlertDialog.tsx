import { forwardRef, ReactNode } from 'react';

import { chain } from '../../../utils/react';
import { Button, ButtonGroup, CubeButtonProps } from '../../actions';
import { Content } from '../../content/Content';
import { Footer } from '../../content/Footer';
import { Header } from '../../content/Header';
import { Paragraph } from '../../content/Paragraph';
import { Title } from '../../content/Title';
import { CubeDialogProps, Dialog } from '../Dialog';
import { useDialogContext } from '../Dialog/context';

export interface CubeAlertDialogActionsProps {
  confirm?: CubeButtonProps | boolean;
  secondary?: CubeButtonProps;
  cancel?: CubeButtonProps | boolean;
}

export interface CubeAlertDialogProps
  extends Omit<CubeDialogProps, 'children'> {
  content?: ReactNode;
  /** Whether the dialog is an important prompt */
  danger?: boolean;
  actions?: CubeAlertDialogActionsProps;
  title?: string;
  noActions?: boolean;
}

const DEFAULT_CONFIRM_PROPS: CubeButtonProps = {
  label: 'Ok',
  type: 'primary',
};
const DEFAULT_CANCEL_PROPS: CubeButtonProps = {
  label: 'Cancel',
};

/**
 * AlertDialogs are a specific type of Dialog. They display important information that users need to acknowledge.
 */
function AlertDialog(props: CubeAlertDialogProps, ref) {
  const { onClose } = useDialogContext();

  const { danger, actions, title, styles, noActions, content, ...otherProps } =
    props;

  let {
    confirm: confirmProps,
    secondary: secondaryProps,
    cancel: cancelProps,
  } = actions ?? {};

  // the confirm button is present by default
  confirmProps =
    confirmProps !== false
      ? {
          ...DEFAULT_CONFIRM_PROPS,
          ...(typeof confirmProps === 'object' ? confirmProps : null),
        }
      : undefined;

  // the cancel button is hidden by default
  cancelProps = cancelProps
    ? {
        ...DEFAULT_CANCEL_PROPS,
        ...(typeof cancelProps === 'object' ? cancelProps : null),
      }
    : undefined;

  return (
    <Dialog ref={ref} role="alertdialog" isDismissable={false} {...otherProps}>
      {title ? (
        <Header>
          <Title>{title}</Title>
        </Header>
      ) : null}
      {content ? (
        <Content>
          {typeof content === 'string' ? (
            <Paragraph>{content}</Paragraph>
          ) : (
            content
          )}
        </Content>
      ) : null}
      {!noActions && (confirmProps || secondaryProps || cancelProps) ? (
        <Footer>
          <ButtonGroup align="end">
            {confirmProps && (
              <Button
                autoFocus
                theme={danger ? 'danger' : undefined}
                {...confirmProps}
                onPress={(e) =>
                  chain(
                    (confirmProps as CubeButtonProps)?.onPress?.(e),
                    onClose?.('confirm'),
                  )
                }
              />
            )}
            {secondaryProps && (
              <Button
                {...secondaryProps}
                onPress={(e) =>
                  chain(secondaryProps?.onPress?.(e), onClose?.('secondary'))
                }
              />
            )}
            {cancelProps && (
              <Button
                {...cancelProps}
                onPress={(e) =>
                  chain(
                    (cancelProps as CubeButtonProps)?.onPress?.(e),
                    onClose?.('cancel'),
                  )
                }
              />
            )}
          </ButtonGroup>
        </Footer>
      ) : null}
    </Dialog>
  );
}

/**
 * AlertDialogs are a specific type of Dialog. They display important information that users need to acknowledge.
 */
const _AlertDialog = forwardRef(AlertDialog);

_AlertDialog.displayName = 'AlertDialog';

export { _AlertDialog as AlertDialog };
