import { ReactNode } from 'react';
import { Button, CubeButtonProps } from '../../actions';
import { Text } from '../../content/Text';
import { Styles } from '../../../tasty';
import { Space } from '../../layout/Space';
import { CheckOutlined, CheckCircleOutlined } from '@ant-design/icons';

const ACTION_BUTTON: Styles = {
  border: {
    '': '#clear',
    pressed: '#clear',
  },
  fill: {
    '': '#clear',
    hovered: '#dark.04',
    'pressed | selected': '#purple.1',
    disabled: '#clear',
  },
  color: {
    '': '#dark-02',
    hovered: '#dark-02',
    'pressed | selected': '#purple-text',
    disabled: '#dark-04',
  },
  cursor: {
    '': 'pointer',
    disabled: 'default',
  },
  shadow: '#clear',
  padding: {
    '': '(0.75x - 1px) (1.5x - 1px)',
    'selectable & !selected':
      '(0.75x - 1px) (1.5x - 1px) (0.75x - 1px) (1.5x - 1px)',
    'selectionType & selectable & !selected':
      '(0.75x - 1px) (1.5x - 1px) (0.75x - 1px) (1.5x - 1px + 22px)',
  },
  display: 'flex',
  flow: 'row',
  justifyContent: 'start',
  Postfix: {
    color: {
      '': '#dark-03',
      hovered: '#dark-03',
      'pressed | selected': '#purple-text',
      disabled: '#dark-04',
    },
  },
};

const getPostfix = (postfix) =>
  typeof postfix === 'string' ? (
    <Text nowrap color="inherit" data-element="Postfix">
      {postfix}
    </Text>
  ) : (
    postfix
  );

export type MenuSelectionType = 'checkbox' | 'radio';

export type MenuButtonProps = {
  postfix: ReactNode;
  selectionType?: MenuSelectionType;
  isSelectable?: boolean;
  disabled?: boolean;
} & CubeButtonProps;

const getSelectionTypeIcon = (selectionType?: MenuSelectionType) => {
  switch (selectionType) {
    case 'checkbox':
      return <CheckOutlined />;
    case 'radio':
      return <CheckCircleOutlined />;
    default:
      return null;
  }
};

export function MenuButton({
  children,
  icon,
  postfix,
  ...props
}: MenuButtonProps) {
  const { selectionType, isSelected, isSelectable } = props;
  const checkIcon =
    isSelectable && isSelected ? getSelectionTypeIcon(selectionType) : null;
  const mods = {
    ...props.mods,
    selectionType: !!selectionType,
    selectable: isSelectable,
    selected: isSelected,
  };

  return (
    <Button
      type="neutral"
      size="small"
      styles={ACTION_BUTTON}
      {...props}
      icon={checkIcon}
      mods={mods}
    >
      {icon && <Text color="inherit">{icon}</Text>}
      <Space gap="1x" placeContent="space-between" overflow="auto" width="100%">
        <Text color="inherit" ellipsis>
          {children}
        </Text>
        {postfix && getPostfix(postfix)}
      </Space>
    </Button>
  );
}
