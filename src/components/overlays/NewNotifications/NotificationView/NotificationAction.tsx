import { PressEvent } from '@react-types/shared/src/events';
import { PropsWithChildren } from 'react';

import { useEvent } from '../../../../_internal';
import { tasty } from '../../../../tasty';
import { Button, CubeButtonProps } from '../../../actions';

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
  styles: {
    display: 'block',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    color: {
      '': '#purple-text',
      primary: '#purple-text',
      secondary: '#dark-03',
    },
  },
});

/**
 * @internal This component is unstable and must not be used outside of `NotificationView`.
 */
export function NotificationAction(props: NotificationActionProps) {
  const {
    children,
    onPress,
    type = 'primary',
    disableCloseOnAction = type !== 'primary',
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
      type="link"
      size="small"
      mods={{ primary: type === 'primary', secondary: type === 'secondary' }}
      onPress={onPressEvent}
    >
      {children}
    </Action>
  );
}
