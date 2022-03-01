import { Action } from '../../actions/Action';
import { Card, CubeCardProps } from '../../content/Card/Card';
import { Block } from '../../Block';
import { Flex } from '../../layout/Flex';
import THEMES from '../../../data/themes';
import {
  CheckOutlined,
  CloseOutlined,
  ExclamationOutlined,
  InfoOutlined,
} from '@ant-design/icons';

export interface CubeNotificationProps extends CubeCardProps {
  type?: 'success' | 'note' | 'danger';
  onClose?: () => void;
}

export function Notification(allProps: CubeNotificationProps) {
  let { type, children, onClose, ...props } = allProps;

  type = type || 'note';

  let Icon;

  switch (type) {
    case 'success':
      Icon = CheckOutlined;
      break;
    case 'danger':
      Icon = ExclamationOutlined;
      break;
    default:
      Icon = InfoOutlined;
      break;
  }

  return (
    <Card
      display="grid"
      role="region"
      color="#dark"
      padding=".5x"
      shadow="0 5px 15px #dark.10"
      border={false}
      margin="1x bottom"
      radius="1.5r"
      styles={{
        gridColumns: 'auto 1fr auto',
        placeItems: 'center start',
        gap: '2x',
      }}
      {...props}
    >
      <Flex
        radius="1r"
        width="5x"
        height="5x"
        placeContent="center"
        placeItems="center"
        fill={THEMES[type] ? THEMES[type].fill : '#clear'}
        color={THEMES[type] ? THEMES[type].color : '#dark.75'}
      >
        <Icon style={{ fontSize: 16 }} />
      </Flex>
      <Block>{children}</Block>
      <Action
        color={{ '': '#dark.75', hovered: '#purple' }}
        width="5x"
        height="5x"
        onPress={onClose}
        label="Close"
      >
        <CloseOutlined />
      </Action>
    </Card>
  );
}
