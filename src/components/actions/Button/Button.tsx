import { FocusableRef } from '@react-types/shared';
import { cloneElement, forwardRef, ReactElement, useMemo } from 'react';

import { LoadingIcon } from '../../../icons';
import {
  CONTAINER_STYLES,
  extractStyles,
  tasty,
  TEXT_STYLES,
} from '../../../tasty';
import { accessibilityWarning } from '../../../utils/warnings';
import { CubeActionProps } from '../Action/Action';
import { useAction } from '../use-action';

type ButtonVariant =
  | 'default.primary'
  | 'default.secondary'
  | 'default.outline'
  | 'default.neutral'
  | 'default.clear'
  | 'default.link'
  | 'danger.primary'
  | 'danger.secondary'
  | 'danger.outline'
  | 'danger.neutral'
  | 'danger.clear'
  | 'danger.link'
  | 'success.primary'
  | 'success.secondary'
  | 'success.outline'
  | 'success.neutral'
  | 'success.clear'
  | 'success.link'
  | 'special.primary'
  | 'special.secondary'
  | 'special.outline'
  | 'special.neutral'
  | 'special.clear'
  | 'special.link';

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

const STYLE_PROPS = [...CONTAINER_STYLES, ...TEXT_STYLES];

export const DEFAULT_BUTTON_STYLES = {
  display: 'inline-grid',
  placeItems: 'center stretch',
  placeContent: 'center',
  position: 'relative',
  margin: 0,
  boxSizing: 'border-box',
  outline: {
    '': '#purple-03.0',
    focused: '#purple-03',
  },
  cursor: 'pointer',
  gap: {
    '': '.75x',
    '[data-size="small"]': '.5x',
  },
  flow: 'column',
  preset: {
    '': 't3m',
    '[data-size="large"]': 't2m',
  },
  textDecoration: 'none',
  transition: 'theme',
  reset: 'button',
  outlineOffset: 1,
  padding: {
    '': '0 (2x - 1bw)',
    '[data-size="small"]': '0 (1x - 1bw)',
    '[data-size="medium"]': '0 (1.5x - 1bw)',
    '[data-size="large"]': '0 (2.25x - 1bw)',
    'single-icon-only | [data-type="link"]': 0,
  },
  width: {
    '': 'initial',
    '[data-size="small"] & single-icon-only': '4x 4x',
    '[data-size="medium"] & single-icon-only': '5x 5x',
    '[data-size="large"] & single-icon-only': '6x 6x',
  },
  height: {
    '': 'initial',
    '[data-size="small"]': '4x 4x',
    '[data-size="medium"]': '5x 5x',
    '[data-size="large"]': '6x 6x',
    '[data-type="link"]': 'auto',
  },
  whiteSpace: 'nowrap',
  radius: {
    '': true,
    '[data-type="link"] & !focused': 0,
  },
} as const;

// DEFAULT THEME STYLES (6 types)
export const DEFAULT_PRIMARY_STYLES = {
  outline: {
    '': '0 #purple-text.0',
    focused: '1bw #purple-text',
  },
  border: {
    '': '#clear',
    pressed: '#purple-text',
    focused: '#purple-text',
  },
  fill: {
    '': '#purple',
    hovered: '#purple-text',
    pressed: '#purple',
  },
  color: {
    '': '#white',
    '[disabled]': '#dark.30',
  },
} as const;

export const DEFAULT_SECONDARY_STYLES = {
  outline: {
    '': '0 #purple-text.0',
    focused: '1bw #purple-text',
  },
  border: {
    '': '#purple.15',
    pressed: '#purple.3',
    focused: '#purple-text',
  },
  fill: {
    '': '#purple.10',
    hovered: '#purple.16',
    pressed: '#purple-text.10',
    '[disabled]': '#dark.04',
  },
  color: {
    '': '#purple',
    '[disabled]': '#dark.30',
  },
} as const;

export const DEFAULT_OUTLINE_STYLES = {
  outline: {
    '': '0 #purple-text.0',
    focused: '1bw #purple-text',
  },
  border: {
    '': '#dark.12',
    focused: '#purple-text',
  },
  fill: {
    '': '#dark.0',
    hovered: '#dark.03',
    'pressed | selected': '#dark.06',
    '[disabled]': '#dark.04',
  },
  color: {
    '': '#dark-02',
    hovered: '#dark-02',
    pressed: '#dark',
    '[disabled]': '#dark.30',
  },
} as const;

export const DEFAULT_NEUTRAL_STYLES = {
  outline: {
    '': '0 #purple-text.0',
    focused: '1bw #purple-text',
  },
  border: {
    '': '#clear',
    focused: '#purple-text',
  },
  fill: {
    '': '#dark.0',
    hovered: '#dark.03',
    'pressed | selected': '#dark.06',
    '[disabled]': '#dark.04',
  },
  color: {
    '': '#dark-02',
    hovered: '#dark-02',
    pressed: '#dark',
    '[disabled]': '#dark.30',
  },
} as const;

export const DEFAULT_CLEAR_STYLES = {
  outline: {
    '': '0 #purple-text.0',
    focused: '1bw #purple-text',
  },
  border: {
    '': '#clear',
    pressed: '#purple-text.10',
    focused: '#purple-text',
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
} as const;

export const DEFAULT_LINK_STYLES = {
  outline: {
    '': '0 #purple-text.0',
    focused: '1bw #purple-text',
  },
  border: {
    '': '0',
    focused: '#purple-text',
  },
  fill: {
    '': '#clear',
  },
  color: {
    '': '#purple-text',
    pressed: '#purple',
    '[disabled]': '#dark.30',
  },
} as const;

// DANGER THEME STYLES (6 types)
export const DANGER_PRIMARY_STYLES = {
  outline: {
    '': '0 #danger-text.0',
    focused: '1bw #danger-text',
  },
  border: {
    '': '#clear',
    pressed: '#danger-text',
    focused: '#danger-text',
  },
  fill: {
    '': '#danger',
    hovered: '#danger-text',
    pressed: '#danger',
    '[disabled]': '#dark.04',
  },
  color: {
    '': '#white',
    '[disabled]': '#dark.30',
  },
} as const;

export const DANGER_SECONDARY_STYLES = {
  outline: {
    '': '0 #danger-text.0',
    focused: '1bw #danger-text',
  },
  border: {
    '': '#danger.15',
    pressed: '#danger.3',
    focused: '#danger-text',
  },
  fill: {
    '': '#danger.05',
    hovered: '#danger.1',
    pressed: '#danger.05',
    '[disabled]': '#dark.04',
  },
  color: {
    '': '#white',
    '[disabled]': '#dark.30',
  },
} as const;

export const DANGER_OUTLINE_STYLES = {
  outline: {
    '': '0 #danger-text.0',
    focused: '1bw #danger-text',
  },
  border: {
    '': '#danger.15',
    pressed: '#danger.3',
    focused: '#danger-text',
  },
  fill: {
    '': '#danger.0',
    hovered: '#danger.1',
    pressed: '#danger.05',
    '[disabled]': '#danger.0',
  },
  color: {
    '': '#white',
    '[disabled]': '#dark.30',
  },
} as const;

export const DANGER_NEUTRAL_STYLES = {
  outline: {
    '': '0 #danger-text.0',
    focused: '1bw #danger-text',
  },
  border: {
    '': '#clear',
    focused: '#danger-text',
  },
  fill: {
    '': '#dark.0',
    hovered: '#dark.04',
    pressed: '#dark.05',
    '[disabled]': '#dark.04',
  },
  color: {
    '': '#white',
    '[disabled]': '#dark.30',
  },
} as const;

export const DANGER_CLEAR_STYLES = {
  outline: {
    '': '0 #danger-text.0',
    focused: '1bw #danger-text',
  },
  border: {
    '': '#clear',
    focused: '#danger-text',
  },
  fill: {
    '': '#danger.0',
    hovered: '#danger.1',
    pressed: '#danger.05',
    '[disabled]': '#danger.0',
  },
  color: {
    '': '#white',
    '[disabled]': '#dark.30',
  },
} as const;

export const DANGER_LINK_STYLES = {
  outline: {
    '': '0 #danger-text.0',
    focused: '1bw #danger-text',
  },
  border: {
    '': '#clear',
    focused: '#danger-text',
  },
  fill: {
    '': '#clear',
    '[disabled]': '#dark.04',
  },
  color: {
    '': '#white',
    '[disabled]': '#dark.30',
  },
} as const;

// SUCCESS THEME STYLES (6 types)
export const SUCCESS_PRIMARY_STYLES = {
  outline: {
    '': '0 #success-text.0',
    focused: '1bw #success-text',
  },
  border: {
    '': '#clear',
    pressed: '#success-text',
    focused: '#success-text',
  },
  fill: {
    '': '#success',
    hovered: '#success-text',
    pressed: '#success',
    '[disabled]': '#dark.04',
  },
  color: {
    '': '#white',
    '[disabled]': '#dark.30',
  },
} as const;

export const SUCCESS_SECONDARY_STYLES = {
  outline: {
    '': '0 #success-text.0',
    focused: '1bw #success-text',
  },
  border: {
    '': '#success.15',
    pressed: '#success.3',
    focused: '#success-text',
  },
  fill: {
    '': '#success.05',
    hovered: '#success.1',
    pressed: '#success.05',
    '[disabled]': '#dark.04',
  },
  color: {
    '': '#success',
    '[disabled]': '#dark.30',
  },
} as const;

export const SUCCESS_OUTLINE_STYLES = {
  outline: {
    '': '0 #success-text.0',
    focused: '1bw #success-text',
  },
  border: {
    '': '#success.15',
    pressed: '#success.3',
    focused: '#success-text',
  },
  fill: {
    '': '#success.0',
    hovered: '#success.1',
    pressed: '#success.05',
    '[disabled]': '#success.0',
  },
  color: {
    '': '#success-text',
    '[disabled]': '#dark.30',
  },
} as const;

export const SUCCESS_NEUTRAL_STYLES = {
  outline: {
    '': '0 #success-text.0',
    focused: '1bw #success-text',
  },
  border: {
    '': '#clear',
    focused: '#success-text',
  },
  fill: {
    '': '#dark.0',
    hovered: '#dark.04',
    pressed: '#dark.05',
    '[disabled]': '#dark.04',
  },
  color: {
    '': '#dark-02',
    hovered: '#dark-02',
    pressed: '#success',
    '[disabled]': '#dark.30',
  },
} as const;

export const SUCCESS_CLEAR_STYLES = {
  outline: {
    '': '0 #success-text.0',
    focused: '1bw #success-text',
  },
  border: {
    '': '#clear',
    focused: '#success-text',
  },
  fill: {
    '': '#success.0',
    hovered: '#success.1',
    pressed: '#success.05',
    '[disabled]': '#success.0',
  },
  color: {
    '': '#success-text',
    '[disabled]': '#dark.30',
  },
} as const;

export const SUCCESS_LINK_STYLES = {
  outline: {
    '': '0 #success-text.0',
    focused: '1bw #success-text',
  },
  border: {
    '': '#clear',
    focused: '#success-text',
  },
  fill: {
    '': '#clear',
    '[disabled]': '#dark.04',
  },
  color: {
    '': '#success-text',
    pressed: '#success',
    '[disabled]': '#dark.30',
  },
} as const;

// SPECIAL THEME STYLES (6 types)
export const SPECIAL_PRIMARY_STYLES = {
  outline: {
    '': '0 #white.0',
    focused: '1bw #white',
  },
  border: {
    '': '#clear',
    pressed: '#purple-03',
  },
  fill: {
    '': '#purple',
    pressed: '#purple',
    hovered: '#purple-text',
    '[disabled]': '#white.12',
  },
  color: {
    '': '#white',
    '[disabled]': '#white.30',
  },
} as const;

export const SPECIAL_SECONDARY_STYLES = {
  outline: {
    '': '0 #white.0',
    focused: '1bw #white',
  },
  border: {
    '': '#white.3',
    pressed: '#white.4',
    focused: '#white',
  },
  fill: {
    '': '#white.12',
    hovered: '#white.18',
    pressed: '#white.12',
    '[disabled]': '#white.12',
  },
  color: {
    '': '#white',
    '[disabled]': '#white.30',
  },
} as const;

export const SPECIAL_OUTLINE_STYLES = {
  outline: {
    '': '0 #white.0',
    focused: '1bw #white',
  },
  border: {
    '': '#white.3',
    '!pressed': '#white.3',
    focused: '#white',
    '[disabled]': '#white.3',
  },
  fill: {
    '': '#white.0',
    hovered: '#white.18',
    pressed: '#white.12',
    '[disabled]': '#white.0',
  },
  color: {
    '': '#white',
    '[disabled]': '#white.30',
  },
} as const;

export const SPECIAL_NEUTRAL_STYLES = {
  outline: {
    '': '0 #white.0',
    focused: '1bw #white',
  },
  border: {
    '': '#clear',
    '!pressed': 0,
    focused: '#white',
    '[disabled]': '#white.3',
  },
  fill: {
    '': '#white.0',
    hovered: '#white.18',
    pressed: '#white.12',
    '[disabled]': '#white.12',
  },
  color: {
    '': '#white',
    '[disabled]': '#white.30',
  },
} as const;

export const SPECIAL_CLEAR_STYLES = {
  outline: {
    '': '0 #white.0',
    focused: '1bw #white',
  },
  border: {
    '': '#clear',
    focused: '#white',
    '[disabled]': '#white.3',
  },
  fill: {
    '': '#white',
    hovered: '#white.94',
    pressed: '#white',
    '[disabled]': '#white.0',
  },
  color: {
    '': '#purple',
    '[disabled]': '#white.30',
  },
} as const;

export const SPECIAL_LINK_STYLES = {
  outline: {
    '': '0 #white.0',
    focused: '1bw #white',
  },
  border: {
    '': 0,
    focused: '#white',
    '[disabled]': '#white.3',
  },
  fill: {
    '': '#clear',
    '[disabled]': '#white.12',
  },
  color: {
    '': '#white',
    '[disabled]': '#white.30',
  },
} as const;

const ButtonElement = tasty({
  qa: 'Button',
  styles: DEFAULT_BUTTON_STYLES,
  variants: {
    'default.primary': DEFAULT_PRIMARY_STYLES,
    'default.secondary': DEFAULT_SECONDARY_STYLES,
    'default.outline': DEFAULT_OUTLINE_STYLES,
    'default.neutral': DEFAULT_NEUTRAL_STYLES,
    'default.clear': DEFAULT_CLEAR_STYLES,
    'default.link': DEFAULT_LINK_STYLES,

    'danger.primary': DANGER_PRIMARY_STYLES,
    'danger.secondary': DANGER_SECONDARY_STYLES,
    'danger.outline': DANGER_OUTLINE_STYLES,
    'danger.neutral': DANGER_NEUTRAL_STYLES,
    'danger.clear': DANGER_CLEAR_STYLES,
    'danger.link': DANGER_LINK_STYLES,

    'success.primary': SUCCESS_PRIMARY_STYLES,
    'success.secondary': SUCCESS_SECONDARY_STYLES,
    'success.outline': SUCCESS_OUTLINE_STYLES,
    'success.neutral': SUCCESS_NEUTRAL_STYLES,
    'success.clear': SUCCESS_CLEAR_STYLES,
    'success.link': SUCCESS_LINK_STYLES,

    'special.primary': SPECIAL_PRIMARY_STYLES,
    'special.secondary': SPECIAL_SECONDARY_STYLES,
    'special.outline': SPECIAL_OUTLINE_STYLES,
    'special.neutral': SPECIAL_NEUTRAL_STYLES,
    'special.clear': SPECIAL_CLEAR_STYLES,
    'special.link': SPECIAL_LINK_STYLES,
  },
});

export const Button = forwardRef(function Button(
  allProps: CubeButtonProps,
  ref: FocusableRef<HTMLElement>,
) {
  let {
    type = 'outline',
    size,
    label,
    children,
    theme = 'default',
    icon,
    rightIcon,
    mods,
    download,
    ...props
  } = allProps;

  const isDisabled = props.isDisabled || props.isLoading;
  const isLoading = props.isLoading;
  const isSelected = props.isSelected;

  children = children || icon || rightIcon ? children : label;

  if (!children) {
    const specifiedLabel =
      label ?? props['aria-label'] ?? props['aria-labelledby'];
    if (icon) {
      if (!specifiedLabel) {
        accessibilityWarning(
          'If you provide `icon` property for a Button and do not provide any children then you should specify the `label` property to make sure the Button element stays accessible.',
        );
        label = 'Unnamed'; // fix to avoid warning in production
      }
    } else {
      if (!specifiedLabel) {
        accessibilityWarning(
          'If you provide no children for a Button then you should specify the `label` property to make sure the Button element stays accessible.',
        );
        label = 'Unnamed'; // fix to avoid warning in production
      }
    }
  }

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
      loading: isLoading,
      selected: isSelected,
      'with-icons': !!icon || !!rightIcon,
      'single-icon-only': singleIcon,
      ...mods,
    }),
    [mods, isDisabled, isLoading, isSelected, singleIcon],
  );

  const { actionProps } = useAction(
    { ...allProps, isDisabled, mods: modifiers, ...(label ? { label } : {}) },
    ref,
  );

  const styles = extractStyles(props, STYLE_PROPS);
  const isDisabledElement = actionProps.isDisabled;

  delete actionProps.isDisabled;

  const variantName = `${theme}.${type}` as ButtonVariant;

  return (
    <ButtonElement
      download={download}
      {...actionProps}
      disabled={isDisabledElement}
      variant={variantName}
      data-theme={theme}
      data-type={type}
      data-size={size ?? 'medium'}
      styles={styles}
    >
      {icon || isLoading ? (
        !isLoading ? (
          icon
        ) : (
          <LoadingIcon data-element="ButtonIcon" />
        )
      ) : null}
      {children}
      {rightIcon}
    </ButtonElement>
  );
});
