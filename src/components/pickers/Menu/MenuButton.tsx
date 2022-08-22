import { ReactNode } from 'react';
import { CheckOutlined } from '@ant-design/icons';

import { Button, CubeButtonProps } from '../../actions';
import { Text } from '../../content/Text';
import { Styles, tasty } from '../../../tasty';
import { Space } from '../../layout/Space';

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
    'selectionIcon & selectable & !selected':
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

const RadioIcon = tasty({
  styles: {
    display: 'flex',
    width: '1.875x',
    placeContent: 'center',

    '&::before': {
      display: 'block',
      content: '""',
      width: '1x',
      height: '1x',
      radius: 'round',
      fill: '#current',
    },
  },
});

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
  selectionIcon?: MenuSelectionType;
  isSelectable?: boolean;
  disabled?: boolean;
} & CubeButtonProps;

const getSelectionTypeIcon = (selectionIcon?: MenuSelectionType) => {
  switch (selectionIcon) {
    case 'checkbox':
      return <CheckOutlined />;
    case 'radio':
      return <RadioIcon />;
    default:
      return undefined;
  }
};

export function MenuButton({
  children,
  icon,
  postfix,
  ...props
}: MenuButtonProps) {
  const { selectionIcon, isSelected, isSelectable } = props;
  const checkIcon =
    isSelectable && isSelected
      ? getSelectionTypeIcon(selectionIcon)
      : undefined;
  const mods = {
    ...props.mods,
    selectionIcon: !!selectionIcon,
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
        <Text ellipsis color="inherit">
          {children}
        </Text>
        {postfix && getPostfix(postfix)}
      </Space>
    </Button>
  );
}
