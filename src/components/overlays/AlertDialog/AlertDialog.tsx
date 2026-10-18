import { forwardRef, ReactNode } from 'react';

import { useI18n } from '../../../i18n';
import { chain } from '../../../utils/react';
import { Button } from '../../actions/Button/Button';
import { ButtonGroup } from '../../actions/ButtonGroup/ButtonGroup';
import { Content } from '../../content/Content';
import { Footer } from '../../content/Footer';
import { Header } from '../../content/Header';
import { Paragraph } from '../../content/Paragraph';
import { Title } from '../../content/Title';
import { useDialogContext } from '../Dialog/context';
import { withDefaultButtonText } from '../Dialog/default-button-text';
import { CubeDialogProps, Dialog } from '../Dialog/Dialog';

import type { CubeButtonProps } from '../../actions/Button/Button';

export interface CubeAlertDialogActionsProps {
  confirm?: CubeButtonProps | boolean;
  secondary?: CubeButtonProps;
  cancel?: CubeButtonProps | boolean;
}

export interface CubeAlertDialogProps
  extends Omit<CubeDialogProps, 'children'> {
  content?: ReactNode;
  /**
   * Whether the confirm action is destructive. It is styled as such, and the
   * dialog opens with focus on Cancel, or on the dialog itself when there is
   * no Cancel, so a reflexive Enter does not run it. An explicit `autoFocus`
   * on `actions.confirm` still puts focus there.
   */
  danger?: boolean;
  actions?: CubeAlertDialogActionsProps;
  title?: string;
  noActions?: boolean;
}

/**
 * AlertDialogs are a specific type of Dialog. They display important information that users need to acknowledge.
 */
function AlertDialog(props: CubeAlertDialogProps, ref) {
  const { onClose } = useDialogContext();
  const { t } = useI18n();

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
      ? withDefaultButtonText(
          {
            type: 'primary',
            ...(typeof confirmProps === 'object' ? confirmProps : null),
          },
          t('alertDialog.confirm', 'Ok'),
        )
      : undefined;

  // the cancel button is hidden by default
  cancelProps = cancelProps
    ? withDefaultButtonText(
        typeof cancelProps === 'object' ? cancelProps : undefined,
        t('alertDialog.cancel', 'Cancel'),
      )
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
          <ButtonGroup>
            {confirmProps && (
              <Button
                // A destructive action never takes focus on open, where a
                // reflexive Enter would run it: Cancel takes it instead, or
                // the dialog itself when there is no Cancel.
                autoFocus={!danger}
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
                // Unless the confirm button asks for focus explicitly.
                autoFocus={danger && !confirmProps?.autoFocus}
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
