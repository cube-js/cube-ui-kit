import { ReactElement, ReactNode } from 'react';

import { CheckIcon } from '../../../icons';
import { tasty } from '../../../tasty';
import {
  DEFAULT_BUTTON_STYLES,
  DEFAULT_NEUTRAL_STYLES,
} from '../../actions/index';
import { Block, CubeBlockProps } from '../../Block';
import { Text } from '../../content/Text';
import { Space } from '../../layout/Space';

const StyledButton = tasty(Block, {
  styles: {
    ...DEFAULT_BUTTON_STYLES,
    ...DEFAULT_NEUTRAL_STYLES,
    height: 'min 4x',
    border: {
      '': '#clear',
      pressed: '#clear',
    },
    fill: {
      '': '#clear',
      'hovered | focused': '#dark.03',
      'pressed | selected': '#dark.06',
      '(pressed | selected) & focused': '#dark.09',
      disabled: '#clear',
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
    outline: false,

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

    Description: {
      preset: 't4',
      color: '#dark-03',
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
  postfix?: ReactNode;
  /** Optional description shown under the main label */
  description?: ReactNode;
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
  description,
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
    <StyledButton data-size="small" {...rest} mods={mods}>
      {checkIcon ? <div data-element="ButtonIcon">{checkIcon}</div> : null}
      {icon ? <div data-element="ButtonIcon">{icon}</div> : null}
      <Space gap="1x" placeContent="space-between" overflow="clip" width="100%">
        <Space flow="column" gap="0" width="100%">
          <Text ellipsis color="inherit">
            {children}
          </Text>
          {description ? (
            <Text
              nowrap
              ellipsis
              data-element="Description"
              preset="t4"
              color="#dark-03"
            >
              {description}
            </Text>
          ) : null}
        </Space>
        {postfix && getPostfix(postfix)}
      </Space>
    </StyledButton>
  );
}
