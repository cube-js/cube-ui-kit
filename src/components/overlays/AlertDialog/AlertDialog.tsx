import { chain } from '@react-aria/utils';
import { Button, CubeButtonProps } from '../../actions/Button/Button';
import { Content } from '../../content/Content';
import { CubeDialogProps, Dialog } from '../Dialog/Dialog';
import { DialogContext } from '../Dialog/context';
import { Title } from '../../content/Title';
import { forwardRef, useContext } from 'react';
import { ButtonGroup } from '../../actions/ButtonGroup/ButtonGroup';
import { Header } from '../../content/Header';
import { Footer } from '../../content/Footer';

export interface CubeAlertDialogActionsProps {
  confirm?: CubeButtonProps | boolean;
  secondary?: CubeButtonProps;
  cancel?: CubeButtonProps | boolean;
}

export interface CubeAlertDialogProps
  extends Omit<CubeDialogProps, 'children'> {
  content: JSX.Element | JSX.Element[];
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
  const { onClose = () => {} } = useContext(DialogContext) ?? {};

  const { danger, actions, title, styles, noActions, content, ...otherProps } =
    props;

  let {
    confirm: confirmProps,
    secondary: secondaryProps,
    cancel: cancelProps,
  } = actions ?? {};

  // confirm button is present by default
  confirmProps =
    confirmProps !== false
      ? {
          ...DEFAULT_CONFIRM_PROPS,
          ...(typeof confirmProps === 'object' ? confirmProps : null),
        }
      : undefined;

  // confirm button is hidden by default
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
      <Content>{content}</Content>
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
                  onClose('confirm'),
                )
              }
            />
            {secondaryProps && (
              <Button
                {...secondaryProps}
                onPress={(e) =>
                  chain(secondaryProps?.onPress?.(e), onClose('secondary'))
                }
              />
            )}
            {cancelProps && (
              <Button
                {...cancelProps}
                onPress={(e) =>
                  chain(
                    (cancelProps as CubeButtonProps)?.onPress?.(e),
                    onClose('cancel'),
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
