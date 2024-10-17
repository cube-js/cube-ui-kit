import { memo } from 'react';

import { Button } from '../../../actions';
import { tasty } from '../../../../tasty';
import { CloseIcon } from '../../../../icons';

export type NotificationCloseButtonProps = {
  onPress: () => void;
};

const CloseButton = tasty(Button, {
  icon: <CloseIcon />,
  label: 'Close the notification',
  qa: 'NotificationCloseButton',
  type: 'neutral',
  size: 'small',
  styles: { gridArea: 'close', display: 'flex', padding: '1x' },
});

export const NotificationCloseButton = memo(function NotificationCloseButton(
  props: NotificationCloseButtonProps,
): JSX.Element {
  const { onPress } = props;

  return <CloseButton onPress={onPress} />;
});
