import { chain } from '@react-aria/utils';
import { Button } from '../../atoms/Button/Button';
import { Content } from '../../components/Content';
import { Dialog } from '../../atoms/Dialog/Dialog';
import { DialogContext } from '../../atoms/Dialog/context';
import { Divider } from '../../components/Divider';
import { Title } from '../../components/Title';
import React, { forwardRef, useContext } from 'react';
import { ButtonGroup } from '../../atoms/ButtonGroup/ButtonGroup';

/**
 * AlertDialogs are a specific type of Dialog. They display important information that users need to acknowledge.
 */
function AlertDialog(props, ref) {
  let {
    onClose = () => {
    }
  } = useContext(DialogContext) || {};

  let {
    danger,
    children,
    primaryProps = {},
    secondaryProps,
    cancelProps,
    title,
    ...otherProps
  } = props;

  if (!primaryProps.label) {
    primaryProps.label = 'Ok';
  }

  let confirmType = 'primary';

  if (danger) {
    confirmType = 'danger';
  }

  return (
    <Dialog
      role="alertdialog"
      ref={ref}
      {...otherProps}
    >
      <Title>{title}</Title>
      <Divider/>
      <Content>{children}</Content>
      <ButtonGroup align="end">
        <Button
          type={confirmType}
          {...primaryProps}
          onPress={() => chain(primaryProps.onPress && primaryProps.onPress(), onClose())}
        />
        {secondaryProps &&
        <Button
          {...secondaryProps}
          onPress={() => chain(secondaryProps.onPress && secondaryProps.onPress(), onClose())}
        />
        }
        {cancelProps &&
        <Button
          {...cancelProps}
          onPress={() => chain(cancelProps.onPress && cancelProps.onPress(), onClose())}
        />
        }
      </ButtonGroup>
    </Dialog>
  );
}

/**
 * AlertDialogs are a specific type of Dialog. They display important information that users need to acknowledge.
 */
let _AlertDialog = forwardRef(AlertDialog);
_AlertDialog.displayName = 'AlertDialog';
export { _AlertDialog as AlertDialog };
