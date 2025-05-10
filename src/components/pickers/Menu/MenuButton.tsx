import { ReactElement, ReactNode } from 'react';

import { CheckIcon } from '../../../icons';
import { tasty } from '../../../tasty';
import {
  DEFAULT_BUTTON_STYLES,
  DEFAULT_THEME_STYLES,
} from '../../actions/index';
import { Block, CubeBlockProps } from '../../Block';
import { Text } from '../../content/Text';
import { Space } from '../../layout/Space';

const StyledButton = tasty(Block, {
  styles: {
    ...DEFAULT_BUTTON_STYLES,
    ...DEFAULT_THEME_STYLES,
    border: {
      '': '#clear',
      pressed: '#clear',
      'focused & !hovered': '#purple-text',
    },
    fill: {
      '': '#clear',
      hovered: '#dark.03',
      'pressed | selected': '#dark.06',
      disabled: '#dark.04',
    },
    color: {
      '': '#dark-02',
      hovered: '#dark-02',
      pressed: '#dark',
      disabled: '#dark-04',
    },
    cursor: {
      '': 'pointer',
      disabled: 'default',
    },
    shadow: '#clear',
    padding: {
      '': '0 (1.5x - 1px)',
      'selectable & !selected': '0 (1.5x - 1px) 0 (1.5x - 1px)',
      'selectionIcon & selectable & !selected':
        '0 (1.5x - 1px) 0 (1.5x - 1px + 22px)',
    },
    display: 'flex',
    flow: 'row',
    justifyContent: 'start',
    gap: '.75x',
    outline: {
      '': '#purple-03.0',
      'focused & focus-visible': '#purple-03',
    },

    ButtonIcon: {
      display: 'grid',
      fontSize: '@icon-size',
      width: '@icon-size',
      height: '@icon-size',
      placeSelf: 'center',
      placeItems: 'center',
    },

    Postfix: {
      color: {
        '': '#dark-03',
        pressed: '#dark-02',
        disabled: '#dark-04',
      },
    },
  },
});

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
  isSelected?: boolean;
  icon?: ReactElement;
  onAction?: () => void;
} & CubeBlockProps;

const getSelectionTypeIcon = (selectionIcon?: MenuSelectionType) => {
  switch (selectionIcon) {
    case 'checkbox':
      return <CheckIcon />;
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
  const { selectionIcon, isSelected, isSelectable, isDisabled, ...rest } =
    props;
  const checkIcon =
    isSelectable && isSelected
      ? getSelectionTypeIcon(selectionIcon)
      : undefined;
  const mods = {
    ...props.mods,
    selectionIcon: !!selectionIcon,
    selectable: isSelectable,
    selected: isSelected,
    disabled: isDisabled,
  };

  return (
    <StyledButton data-type="neutral" data-size="small" {...rest} mods={mods}>
      {checkIcon ? <div data-element="ButtonIcon">{checkIcon}</div> : null}
      {icon ? <div data-element="ButtonIcon">{icon}</div> : null}
      <Space gap="1x" placeContent="space-between" overflow="clip" width="100%">
        <Text ellipsis color="inherit">
          {children}
        </Text>
        {postfix && getPostfix(postfix)}
      </Space>
    </StyledButton>
  );
}
