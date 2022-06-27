import { CloseOutlined } from '@ant-design/icons';
import { Button } from '../../../actions';
import { tasty } from '../../../../tasty';

export type NotificationCloseButtonProps = {
  onPress: () => void;
};

const CloseButton = tasty(Button, {
  styles: {
    position: 'absolute',
    right: 0,
    top: 0,
    transform: 'translate(50%, -50%)',
    width: '3.5x',
    height: '3.5x',
    fill: '#white',
    boxShadow: '0px 0.5px 2px #shadow',
    borderRadius: '50%',
    color: '#dark-02',
  },
});

export function NotificationCloseButton(
  props: NotificationCloseButtonProps,
): JSX.Element {
  const { onPress } = props;

  return (
    <CloseButton
      onPress={() => onPress()}
      icon={<CloseOutlined />}
      label="Close the notification"
    />
  );
}
