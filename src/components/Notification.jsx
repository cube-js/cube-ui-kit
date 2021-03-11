import React from 'react';
import Action from './Action';
import Card from './Card';
import Block from './Block';
import Flex from './Flex';
import THEMES from '../data/themes';
import {
  CheckOutlined,
  CloseOutlined,
  ExclamationOutlined,
  InfoOutlined,
} from '@ant-design/icons';

export default function Alert({ type, children, onClose, ...props }) {
  type = type || 'note';

  let Icon;

  switch(type) {
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
    <div>
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
          columns: 'auto 1fr auto',
          items: 'center start',
          gap: '2x',
        }}
        {...props}
      >
        <Flex
          radius="1r"
          width="5x"
          height="5x"
          items="center"
          content="center"
          fill={THEMES[type] ? THEMES[type].fill : '#clear'}
          color={THEMES[type] ? THEMES[type].color : '#dark.75'}
        >
          <Icon style={{ fontSize: 16 }}/>
        </Flex>
        <Block>
          {children}
        </Block>
        <Action color={{ '': '#dark.75', hovered: '#purple' }} width="5x" height="5x" onClick={onClose}>
          <CloseOutlined/>
        </Action>
      </Card>
    </div>
  );
}
