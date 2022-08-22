import { memo } from 'react';

import { Button } from '../../../actions';
import { tasty } from '../../../../tasty';
import { Cross } from '../../../../icons';

export type NotificationCloseButtonProps = {
  onPress: () => void;
  isHovered: boolean;
  isFocused: boolean;
};

const CloseButton = tasty(Button, {
  styles: {
    position: 'absolute',
    right: '-0.75x',
    top: '-0.75x',
    display: 'flex',
    placeItems: 'center',
    padding: '0.625x',
    width: '3x',
    height: '3x',
    fill: '#white',
    shadow: '0 0.5x 2x #shadow',
    color: { '': '#dark-02', hovered: '#dark-03', pressed: '#dark-02' },
    borderRadius: '50%',
    visibility: { '': 'hidden', show: 'visible' },
    opacity: { '': '0', show: '1' },
    transition: 'opacity, visibility 0.2s ease-in-out',
  },
});

export const NotificationCloseButton = memo(function NotificationCloseButton(
  props: NotificationCloseButtonProps,
): JSX.Element {
  const { onPress, isHovered, isFocused } = props;

  return (
    <CloseButton
      qa="NotificationCloseButton"
      type="neutral"
      mods={{ show: isHovered || isFocused }}
      icon={<Cross />}
      label="Close the notification"
      onPress={onPress}
    />
  );
});
