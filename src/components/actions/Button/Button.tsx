import { cloneElement, forwardRef, ReactElement, useMemo } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { FocusableRef } from '@react-types/shared';

import { Action, CubeActionProps } from '../Action';
import { Styles } from '../../../tasty';
import { accessibilityWarning } from '../../../utils/warnings';

export interface CubeButtonProps extends CubeActionProps {
  icon?: ReactElement;
  rightIcon?: ReactElement;
  isLoading?: boolean;
  isSelected?: boolean;
  type?:
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'link'
    | 'clear'
    | 'outline'
    | 'neutral'
    | (string & {});
  size?: 'small' | 'medium' | 'large' | (string & {});
}

export function provideButtonStyles({ type, theme }) {
  return {
    ...(theme === 'danger' ? DANGER_STYLES_BY_TYPE : DEFAULT_STYLES_BY_TYPE)[
      type ?? 'secondary'
    ],
  };
}

const DEFAULT_STYLES_BY_TYPE: { [key: string]: Styles } = {
  primary: {
    border: {
      '': '#clear',
      pressed: '#purple-text',
    },
    fill: {
      hovered: '#purple-text',
      'pressed | !hovered': '#purple',
      '[disabled]': '#dark.04',
    },
    color: {
      '': '#white',
      '[disabled]': '#dark.30',
    },
  },
  secondary: {
    border: {
      '': '#clear',
      pressed: '#purple.30',
    },
    fill: {
      '': '#purple.10',
      hovered: '#purple.16',
      pressed: '#purple.10',
      '[disabled]': '#dark.04',
    },
    color: {
      '': '#purple',
      '[disabled]': '#dark.30',
    },
  },
  clear: {
    border: {
      '': '#clear',
      pressed: '#purple-text.10',
    },
    fill: {
      '': '#purple.0',
      hovered: '#purple.16',
      pressed: '#purple.10',
      '[disabled]': '#purple.0',
    },
    color: {
      '': '#purple-text',
      '[disabled]': '#dark.30',
    },
  },
  outline: {
    border: {
      '': '#purple.30',
      pressed: '#purple-text.10',
      '[disabled]': '#dark.12',
    },
    fill: {
      '': '#purple.0',
      hovered: '#purple.16',
      pressed: '#purple.10',
      '[disabled]': '#purple.0',
    },
    color: {
      '': '#purple-text',
      '[disabled]': '#dark.30',
    },
  },
  link: {
    padding: '0',
    radius: {
      '': '0',
      focused: true,
    },
    fill: '#clear',
    color: {
      '': '#purple-text',
      pressed: '#purple',
      '[disabled]': '#dark.30',
    },
    shadow: {
      '': '0 @border-width 0 0 #purple-03.20',
      focused: '0 0 0 @outline-width #purple-03.20',
      'pressed | hovered | [disabled]': '0 0 0 0 #purple.20',
    },
  },
  neutral: {
    border: '#clear',
    fill: {
      '': '#dark.0',
      hovered: '#dark.04',
      pressed: '#purple.10',
      '[disabled]': '#dark.04',
    },
    color: {
      '': '#dark.75',
      hovered: '#dark.75',
      pressed: '#purple',
      '[disabled]': '#dark.30',
    },
  },
};

const DANGER_STYLES_BY_TYPE: { [key: string]: Styles } = {
  primary: {
    border: {
      '': '#clear',
      pressed: '#danger-text',
    },
    fill: {
      hovered: '#danger-text',
      'pressed | !hovered': '#danger',
      '[disabled]': '#dark.04',
    },
    color: {
      '': '#white',
      '[disabled]': '#dark.30',
    },
  },
  secondary: {
    border: {
      '': '#clear',
      pressed: '#danger.30',
    },
    fill: {
      '': '#danger.05',
      hovered: '#danger.1',
      pressed: '#danger.05',
      '[disabled]': '#dark.04',
    },
    color: {
      '': '#danger',
      '[disabled]': '#dark.30',
    },
  },
  clear: {
    border: {
      '': '#clear',
      pressed: '#danger-text.10',
    },
    fill: {
      '': '#danger.0',
      hovered: '#danger.1',
      pressed: '#danger.05',
      '[disabled]': '#danger.0',
    },
    color: {
      '': '#danger-text',
      '[disabled]': '#dark.30',
    },
  },
  outline: {
    border: {
      '': '#danger.30',
      pressed: '#danger-text.10',
      '[disabled]': '#dark.04',
    },
    fill: {
      '': '#danger.0',
      hovered: '#danger.1',
      pressed: '#danger.05',
      '[disabled]': '#danger.0',
    },
    color: {
      '': '#danger-text',
      '[disabled]': '#dark.30',
    },
  },
  link: {
    ...DEFAULT_STYLES_BY_TYPE.link,
    color: {
      '': '#danger-text',
      pressed: '#danger',
      '[disabled]': '#dark.30',
    },
    shadow: {
      '': '0 @border-width 0 0 #danger.20',
      focused: '0 0 0 @outline-width #danger.20',
      'pressed | hovered | [disabled]': '0 0 0 0 #danger.20',
    },
  },
  neutral: {
    border: '0',
    fill: {
      '': '#dark.0',
      hovered: '#dark.04',
      pressed: '#dark.05',
      '[disabled]': '#dark.04',
    },
    color: {
      '': '#dark.75',
      hovered: '#dark.75',
      pressed: '#danger',
      '[disabled]': '#dark.30',
    },
  },
};

export const DEFAULT_BUTTON_STYLES = {
  display: 'inline-grid',
  placeItems: 'center stretch',
  placeContent: 'center',
  gap: '1x',
  flow: 'column',
  radius: true,
  preset: {
    '': 't3m',
    '[data-size="large"]': 't2m',
  },
  textDecoration: 'none',
  transition: 'theme',
  padding: {
    '': '(1.25x - 1bw) (2x - 1bw)',
    '[data-size="small"]': '(.75x - 1bw) (1.5x - 1bw)',
    '[data-size="medium"]': '(1.25x - 1bw) (2x - 1bw)',
    '[data-size="large"]': '(1.5x - 1bw) (2.5x - 1bw)',
    'single-icon-only': 0,
  },
  width: {
    '': 'initial',
    '[data-size="small"] & single-icon-only': '4x',
    '[data-size="medium"] & single-icon-only': '5x',
    '[data-size="large"] & single-icon-only': '6x',
  },
  height: {
    '': 'initial',
    '[data-size="small"] & single-icon-only': '4x',
    '[data-size="medium"] & single-icon-only': '5x',
    '[data-size="large"] & single-icon-only': '6x',
  },
  whiteSpace: 'nowrap',
  '& .anticon': {
    transition:
      'display .2s steps(1, start), margin .2s linear, opacity .2s linear',
  },

  ButtonIcon: {
    fontSize: '@icon-size',
    lineHeight: '@icon-size',
  },
} as Styles;

export const Button = forwardRef(function Button(
  allProps: CubeButtonProps,
  ref: FocusableRef<HTMLElement>,
) {
  let {
    type,
    size,
    label,
    styles,
    children,
    theme,
    icon,
    rightIcon,
    mods,
    ...props
  } = allProps;

  const isDisabled = props.isDisabled;
  const isLoading = props.isLoading;
  const isSelected = props.isSelected;

  if (!children) {
    if (icon) {
      if (!label) {
        accessibilityWarning(
          'If you provide `icon` property for a Button and do not provide any children then you should specify the `label` property to make sure the Button element stays accessible.',
        );
      }
    } else {
      if (!label) {
        accessibilityWarning(
          'If you provide no children for a Button then you should specify the `label` property to make sure the Button element stays accessible.',
        );
      }
    }
  }

  children = children || icon || rightIcon ? children : label;

  styles = useMemo(
    () => ({
      ...DEFAULT_BUTTON_STYLES,
      ...provideButtonStyles({ type, theme }),
      ...styles,
    }),
    [type, theme, styles],
  );

  if (icon) {
    icon = cloneElement(icon, {
      'data-element': 'ButtonIcon',
    });
  }

  if (rightIcon) {
    rightIcon = cloneElement(rightIcon, {
      'data-element': 'ButtonIcon',
    });
  }

  const singleIcon = !!(
    ((icon && !rightIcon) || (rightIcon && !icon)) &&
    !children
  );

  const modifiers = useMemo(
    () => ({
      disabled: isDisabled,
      loading: isLoading,
      selected: isSelected,
      'single-icon-only': singleIcon,
      ...mods,
    }),
    [mods, isDisabled, isLoading, isSelected, singleIcon],
  );

  return (
    <Action
      as={props.to ? 'a' : undefined}
      {...props}
      ref={ref}
      isDisabled={isLoading || isDisabled}
      theme={theme}
      data-type={type ?? 'secondary'}
      data-size={size ?? 'medium'}
      mods={modifiers}
      styles={styles}
      label={label}
    >
      {icon || isLoading ? !isLoading ? icon : <LoadingOutlined /> : null}
      {children}
      {rightIcon}
    </Action>
  );
});
