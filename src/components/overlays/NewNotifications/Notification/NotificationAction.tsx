import { PropsWithChildren } from 'react';
import { tasty } from '../../../../tasty';
import { Button, CubeButtonProps } from '../../../actions';

export type NotificationActionProps = PropsWithChildren<{
  type?: 'primary' | 'secondary';
}> &
  Omit<CubeButtonProps, 'type' | 'size' | 'mods'>;

const Action = tasty(Button, {
  color: { '': '#purple-text', primary: '#purple-text', secondary: '#dark-03' },
});

export function NotificationAction(
  props: NotificationActionProps,
): JSX.Element {
  const { children, type = 'primary', ...buttonProps } = props;

  return (
    <Action
      {...buttonProps}
      type="link"
      size="small"
      mods={{ primary: type === 'primary', secondary: type === 'secondary' }}
    >
      {children}
    </Action>
  );
}
