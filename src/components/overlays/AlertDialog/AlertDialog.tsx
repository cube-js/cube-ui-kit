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

export interface CubeAlertDialogProps extends CubeDialogProps {
  /** Whether the dialog is an important prompt */
  danger?: boolean;
  actions?: CubeAlertDialogActionsProps;
  title?: string;
  noActions?: boolean;
}

const DEFAULT_PRIMARY_PROPS: CubeButtonProps = {
  label: 'Ok',
  type: 'primary',
};
const DEFAUL_CANCEL_PROPS: CubeButtonProps = {
  label: 'Cancel',
};

/**
 * AlertDialogs are a specific type of Dialog. They display important information that users need to acknowledge.
 */
function AlertDialog(props: CubeAlertDialogProps, ref) {
  let { onClose = () => {} } = useContext(DialogContext) || {};

  let { danger, children, actions, title, styles, noActions, ...otherProps }
    = props;

  let {
    confirm: confirmProps,
    secondary: secondaryProps,
    cancel: cancelProps,
  } = actions || {};

  if (confirmProps === undefined || confirmProps === true) {
    confirmProps = DEFAULT_PRIMARY_PROPS;
  } else if (!confirmProps) {
    confirmProps = undefined;
  } else {
    confirmProps = Object.assign({}, DEFAULT_PRIMARY_PROPS, confirmProps);
  }

  if (cancelProps === true) {
    cancelProps = DEFAUL_CANCEL_PROPS;
  } else if (!cancelProps) {
    cancelProps = undefined;
  } else {
    cancelProps = Object.assign({}, DEFAUL_CANCEL_PROPS, cancelProps);
  }

  return (
    <Dialog role="alertdialog" ref={ref} isDismissable={false} {...otherProps}>
      {title ? (
        <Header>
          <Title>{title}</Title>
        </Header>
      ) : null}
      {children ? <Content>{children}</Content> : null}
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
                  onClose('primary'),
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
let _AlertDialog = forwardRef(AlertDialog);
export { _AlertDialog as AlertDialog };
