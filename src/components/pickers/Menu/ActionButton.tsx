import { ReactNode } from 'react';
import { Button, CubeButtonProps } from '../../actions';
import { Text } from '../../content/Text';
import { Styles } from '../../../styles/types';
import { Space } from '../../layout/Space';

const ACTION_BUTTON: Styles = {
  border: {
    '': '#clear',
    pressed: '#clear',
  },
  fill: {
    '': '#clear',
    hovered: '#clear',
    pressed: '#clear',
    active: '#clear',
    '[disabled]': '#clear',
  },
  color: {
    '': '#dark-02',
    hovered: '#dark-02',
    pressed: '#purple-text',
    active: '#purple-text',
    '[disabled]': '#dark.30',
  },
  shadow: '#clear',
  margin: '0',
  padding: '1x 1.5x',
  display: 'flex',
  flow: 'row',
  justifyContent: 'start',
};

const getPostfix = (postfix) =>
  typeof postfix === 'string' ? (
    <Text nowrap color="#dark-03">
      {postfix}
    </Text>
  ) : (
    postfix
  );

type ActionButtonProps = {
  postfix: ReactNode;
} & CubeButtonProps;

export function ActionButton({
  children,
  icon,
  postfix,
  ...props
}: ActionButtonProps) {
  return (
    <Button type="neutral" size="small" styles={ACTION_BUTTON} {...props}>
      {icon && <Text>{icon}</Text>}
      <Space gap="1x" placeContent="space-between" overflow="auto" width="100%">
        <Text ellipsis>{children}</Text>
        {postfix && getPostfix(postfix)}
      </Space>
    </Button>
  );
}
