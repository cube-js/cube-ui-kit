import { forwardRef, ReactNode } from 'react';
import { chain } from '@react-aria/utils';
import { Button, CubeButtonProps, ButtonGroup } from '../../actions';
import { Content } from '../../content/Content';
import { Paragraph } from '../../content/Paragraph';
import { CubeDialogProps, Dialog } from '../Dialog/Dialog';
import { useDialogContext } from '../Dialog/context';
import { Title } from '../../content/Title';
import { Header } from '../../content/Header';
import { Footer } from '../../content/Footer';

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
    <Dialog role="alertdialog" ref={ref} isDismissable={false} {...otherProps}>
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
      {!noActions ? (
        <Footer>
          <ButtonGroup align="end">
            <Button
              theme={danger ? 'danger' : undefined}
              autoFocus
              {...confirmProps}
              onPress={(e) =>
                chain(
                  (confirmProps as CubeButtonProps)?.onPress?.(e),
                  onClose?.('confirm'),
                )
              }
            />
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
export { _AlertDialog as AlertDialog };
