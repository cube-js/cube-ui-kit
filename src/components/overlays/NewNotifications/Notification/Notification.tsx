import { CubeNotificationProps } from '../types';
import { tasty } from '../../../../tasty';
import { NotificationAction } from './NotificationAction';
import { NotificationIcon } from './NotificationIcon';
import { NotificationHeader } from './NotificationHeader';
import { NotificationDescription } from './NotificationDescription';
import { NotificationFooter } from './NotificationFooter';
import { useEvent } from '../../../../_internal';
import { NotificationCloseButton } from './NotificationCloseButton';

const NotificationContainer = tasty({
  styles: {
    position: 'relative',
    display: 'grid',
    width: 'auto',
    padding: '1.5x 1x 1.5x 1.5x',
    gridAreas: `
      "icon . header"
      "icon . description"
      "icon . footer"
    `,
    gridColumns: 'min-content 1x minmax(0, auto)',
    fill: '#white',
  },
});

export function Notification(props: CubeNotificationProps) {
  const {
    onClose = () => {},
    type = 'attention',
    actions,
    header,
    icon,
    isClosable,
    description,
  } = props;

  const onCloseEvent = useEvent(onClose);

  return (
    <NotificationContainer>
      <NotificationIcon icon={icon} type={type} />
      {header && <NotificationHeader header={header} />}
      {description && <NotificationDescription description={description} />}
      {actions && <NotificationFooter actions={actions} />}
      {isClosable && <NotificationCloseButton onPress={onCloseEvent} />}
    </NotificationContainer>
  );
}

Notification.Action = NotificationAction;
