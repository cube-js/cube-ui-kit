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
    right: 0,
    top: 0,
    display: 'flex',
    placeItems: 'center',
    padding: '0.75x',
    width: '3.5x',
    height: '3.5x',
    fill: '#white',
    shadow: '0 0.5x 2x #shadow',
    color: { '': '#dark-02', hovered: '#dark-03', pressed: '#dark-02' },
    borderRadius: '50%',
    visibility: { '': 'hidden', show: 'visible' },
    opacity: { '': '0', show: '1' },
    transform: 'translate(50%, -50%)',
    transition: 'opacity, visibility 0.2s ease-in-out',
  },
});

export const NotificationCloseButton = memo(function NotificationCloseButton(
  props: NotificationCloseButtonProps,
): JSX.Element {
  const { onPress, isHovered, isFocused } = props;

  return (
    <CloseButton
      type="neutral"
      mods={{ show: isHovered || isFocused }}
      onPress={onPress}
      icon={<Cross />}
      label="Close the notification"
    />
  );
});
