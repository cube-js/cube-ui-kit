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

export interface CubeAlertDialogProps extends CubeDialogProps {
  /** Whether the dialog is an important prompt */
  danger?: boolean;
  primaryProps?: CubeButtonProps;
  secondaryProps?: CubeButtonProps;
  cancelProps?: CubeButtonProps | true;
  title?: string;
  noActions?: boolean;
}

/**
 * AlertDialogs are a specific type of Dialog. They display important information that users need to acknowledge.
 */
function AlertDialog(props: CubeAlertDialogProps, ref) {
  let { onClose = () => {} } = useContext(DialogContext) || {};

  let {
    danger,
    children,
    primaryProps = {},
    secondaryProps,
    cancelProps,
    title,
    styles,
    noActions,
    ...otherProps
  } = props;

  if (!primaryProps.label) {
    primaryProps.label = 'Ok';
  }

  let confirmType: CubeButtonProps['type'] = 'primary';

  if (danger) {
    confirmType = 'danger';
  }

  if (cancelProps === true) {
    cancelProps = {} as CubeButtonProps;
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
              type={confirmType}
              autoFocus
              {...primaryProps}
              onPress={(e) =>
                chain(
                  primaryProps.onPress && primaryProps.onPress(e),
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
                label="Cancel"
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
