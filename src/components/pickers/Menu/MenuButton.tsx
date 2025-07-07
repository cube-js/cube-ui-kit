import { IconPointFilled } from '@tabler/icons-react';
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
    border: '#clear',
    fill: {
      '': '#clear',
      focused: '#dark.03',
      selected: '#dark.06',
      'selected & focused': '#dark.09',
      pressed: '#dark.06',
      disabled: '#clear',
    },
    color: {
      '': '#dark-02',
      'selected | pressed': '#dark',
      disabled: '#dark-04',
    },
    cursor: {
      '': 'pointer',
      disabled: 'default',
    },
    shadow: '#clear',
    padding: {
      '': '0 (1x - 1bw)',
      'selectable & !selected': '0 (1.5x - 1bw) 0 (1.5x - 1bw)',
      'selectionIcon & selectable & !selected':
        '0 (1.5x - 1bw) 0 (1.5x - 1bw + 3x)',
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
      return <IconPointFilled />;
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
