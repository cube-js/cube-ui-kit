import { PressEvent } from '@react-types/shared/src/events';
import { PropsWithChildren } from 'react';
import { tasty } from '../../../../tasty';
import { Button, CubeButtonProps } from '../../../actions';
import { useEvent } from '../../../../_internal';
import { useNotificationContext } from './NotificationProvider';

export type NotificationActionProps = PropsWithChildren<{
  type?: 'primary' | 'secondary';
  /**
   * @default false
   */
  disableCloseOnAction?: boolean;
}> &
  Omit<CubeButtonProps, 'type' | 'size' | 'mods'>;

const Action = tasty(Button, {
  color: { '': '#purple-text', primary: '#purple-text', secondary: '#dark-03' },
});

export function NotificationAction(
  props: NotificationActionProps,
): JSX.Element {
  const {
    children,
    onPress,
    type = 'primary',
    disableCloseOnAction = false,
    ...buttonProps
  } = props;
  const { onClose } = useNotificationContext();

  const onPressEvent = useEvent((e: PressEvent) => {
    onPress?.(e);

    if (!disableCloseOnAction) {
      onClose?.();
    }
  });

  return (
    <Action
      {...buttonProps}
      onPress={onPressEvent}
      type="link"
      size="small"
      mods={{ primary: type === 'primary', secondary: type === 'secondary' }}
    >
      {children}
    </Action>
  );
}
