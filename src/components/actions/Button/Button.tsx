import { FocusableRef } from '@react-types/shared';
import { cloneElement, forwardRef, ReactElement, useMemo } from 'react';

import { LoadingIcon } from '../../../icons';
import {
  CONTAINER_STYLES,
  extractStyles,
  Styles,
  tasty,
  TEXT_STYLES,
} from '../../../tasty';
import { accessibilityWarning } from '../../../utils/warnings';
import { CubeActionProps } from '../Action/Action';
import { useAction } from '../use-action';

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
  size?: 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | (string & {});
}

export type ButtonVariant =
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

const STYLE_PROPS = [...CONTAINER_STYLES, ...TEXT_STYLES];

export const DEFAULT_BUTTON_STYLES = {
  display: 'inline-grid',
  placeItems: 'center start',
  placeContent: 'center',
  position: 'relative',
  margin: 0,
  boxSizing: 'border-box',
  cursor: {
    '': 'pointer',
    '[disabled] | disabled': 'default',
  },
  gap: {
    '': '.75x',
    '[data-size="small"]': '.5x',
  },
  flow: 'column',
  preset: {
    '': 't3m',
    '[data-size="xsmall"]': 't4',
    '[data-size="xlarge"]': 't2m',
  },
  textDecoration: 'none',
  transition: 'theme',
  reset: 'button',
  outlineOffset: 1,
  padding: {
    '': '.5x (1.5x - 1bw)',
    '[data-size="small"] | [data-size="xsmall"]': '.5x (1x - 1bw)',
    '[data-size="medium"]': '.5x (1.5x - 1bw)',
    '[data-size="large"]': '.5x (2x - 1bw)',
    '[data-size="xlarge"]': '.5x (2.25x - 1bw)',
    'single-icon-only | [data-type="link"]': 0,
  },
  width: {
    '': 'initial',
    '[data-size="xsmall"] & single-icon-only': '@size-xs @size-xs',
    '[data-size="small"] & single-icon-only': '@size-sm @size-sm',
    '[data-size="medium"] & single-icon-only': '@size-md @size-md',
    '[data-size="large"] & single-icon-only': '@size-lg @size-lg',
    '[data-size="xlarge"] & single-icon-only': '@size-xl @size-xl',
    '[data-type="link"]': 'initial',
  },
  height: {
    '': 'initial',
    '[data-size="xsmall"]': '@size-xs @size-xs',
    '[data-size="small"]': '@size-sm @size-sm',
    '[data-size="medium"]': '@size-md @size-md',
    '[data-size="large"]': '@size-lg @size-lg',
    '[data-size="xlarge"]': '@size-xl @size-xl',
    '[data-type="link"]': 'initial',
  },
  whiteSpace: 'nowrap',
  radius: {
    '': true,
    '[data-type="link"] & !focused': 0,
  },

  ButtonIcon: {
    width: 'max-content',
    margin: {
      '': 0,
      ':first-child': '-.5x left',
      ':last-child': '-.5x right',
      ':first-child:last-child': 0,
    },
    placeSelf: {
      '': 'center',
      ':first-child': 'center start',
      ':last-child': 'center end',
      ':first-child:last-child': 'center',
    },
  },
} as const;

// ---------- DEFAULT THEME ----------
export const DEFAULT_PRIMARY_STYLES: Styles = {
  outline: {
    '': '0 #purple-text.0',
    focused: '1bw #purple-text',
  },
  border: {
    '': '#clear',
    pressed: '#purple-text',
    focused: '#purple-text',
    '[disabled] | disabled': '#border',
  },
  fill: {
    '': '#purple',
    hovered: '#purple-text',
    pressed: '#purple',
    '[disabled] | disabled': '#dark.04',
  },
  color: {
    '': '#white',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const DEFAULT_SECONDARY_STYLES: Styles = {
  border: {
    '': '#purple.15',
    pressed: '#purple.3',
    focused: '#purple-text',
    '[disabled] | disabled': '#border',
  },
  fill: {
    '': '#purple.10',
    hovered: '#purple.16',
    pressed: '#purple-text.10',
    '[disabled] | disabled': '#dark.04',
  },
  color: {
    '': '#purple',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const DEFAULT_OUTLINE_STYLES: Styles = {
  border: {
    '': '#dark.12',
    focused: '#purple-text',
    '[disabled] | disabled': '#border',
  },
  fill: {
    '': '#dark.0',
    hovered: '#dark.03',
    'pressed | (selected & !hovered)': '#dark.06',
    '[disabled] | disabled': '#dark.04',
  },
  color: {
    '': '#dark-02',
    hovered: '#dark-02',
    'pressed | (selected & !hovered)': '#dark',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const DEFAULT_NEUTRAL_STYLES: Styles = {
  border: {
    '': '#clear',
    focused: '#purple-text',
  },
  fill: {
    '': '#dark.0',
    hovered: '#dark.03',
    'pressed | (selected & !hovered)': '#dark.06',
  },
  color: {
    '': '#dark-02',
    hovered: '#dark-02',
    pressed: '#dark',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const DEFAULT_CLEAR_STYLES: Styles = {
  border: {
    '': '#clear',
    pressed: '#purple-text.10',
    focused: '#purple-text',
  },
  fill: {
    '': '#purple.0',
    hovered: '#purple.16',
    'pressed | (selected & !hovered)': '#purple.10',
  },
  color: {
    '': '#purple-text',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const DEFAULT_LINK_STYLES: Styles = {
  outline: {
    '': '0 #purple-text.0',
    focused: '1bw #purple-text',
  },
  border: '0',
  fill: {
    '': '#clear',
  },
  color: {
    '': '#purple-text',
    'hovered & !pressed': '#purple',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

// ---------- DANGER THEME ----------
export const DANGER_PRIMARY_STYLES: Styles = {
  outline: {
    '': '0 #danger-text.0',
    focused: '1bw #danger-text',
  },
  border: {
    '': '#clear',
    'pressed | focused': '#danger-text',
    '[disabled] | disabled': '#border',
  },
  fill: {
    '': '#danger',
    'hovered & !pressed': '#danger-text',
    '[disabled] | disabled': '#dark.04',
  },
  color: {
    '': '#white',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const DANGER_SECONDARY_STYLES: Styles = {
  border: {
    '': '#danger.15',
    pressed: '#danger.3',
    focused: '#danger-text',
    '[disabled] | disabled': '#border',
  },
  fill: {
    '': '#danger.05',
    'hovered & !pressed': '#danger.1',
    '[disabled] | disabled': '#dark.04',
  },
  color: {
    '': '#danger',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const DANGER_OUTLINE_STYLES: Styles = {
  border: {
    '': '#danger.15',
    pressed: '#danger.3',
    focused: '#danger-text',
    '[disabled] | disabled': '#border',
  },
  fill: {
    '': '#danger.0',
    hovered: '#danger.1',
    'pressed | (selected & !hovered)': '#danger.05',
    '[disabled] | disabled': '#dark.04',
  },
  color: {
    '': '#danger-text',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const DANGER_NEUTRAL_STYLES: Styles = {
  border: {
    '': '#clear',
    focused: '#danger-text',
  },
  fill: {
    '': '#dark.0',
    hovered: '#dark.04',
    'pressed | (selected & !hovered)': '#dark.05',
  },
  color: {
    '': '#dark-02',
    'pressed | (selected & !hovered)': '#danger-text',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const DANGER_CLEAR_STYLES: Styles = {
  border: {
    '': '#clear',
    pressed: '#danger.05',
    focused: '#danger-text',
  },
  fill: {
    '': '#danger.0',
    hovered: '#danger.1',
    'pressed | (selected & !hovered)': '#danger.05',
  },
  color: {
    '': '#danger-text',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const DANGER_LINK_STYLES: Styles = {
  outline: {
    '': '0 #danger-text.0',
    focused: '1bw #danger-text',
  },
  border: 0,
  fill: {
    '': '#clear',
  },
  color: {
    '': '#danger-text',
    'hovered & !pressed': '#danger',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

// ---------- SUCCESS THEME ----------
export const SUCCESS_PRIMARY_STYLES: Styles = {
  outline: {
    '': '0 #success-text.0',
    focused: '1bw #success-text',
  },
  border: {
    '': '#clear',
    'pressed | focused': '#success-text',
    '[disabled] | disabled': '#border',
  },
  fill: {
    '': '#success',
    'hovered & !pressed': '#success-text',
    '[disabled] | disabled': '#dark.04',
  },
  color: {
    '': '#white',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const SUCCESS_SECONDARY_STYLES: Styles = {
  border: {
    '': '#success.15',
    pressed: '#success.3',
    focused: '#success-text',
    '[disabled] | disabled': '#border',
  },
  fill: {
    '': '#success.05',
    'hovered & !pressed': '#success.1',
    '[disabled] | disabled': '#dark.04',
  },
  color: {
    '': '#success',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const SUCCESS_OUTLINE_STYLES: Styles = {
  border: {
    '': '#success.15',
    pressed: '#success.3',
    focused: '#success-text',
    '[disabled] | disabled': '#border',
  },
  fill: {
    '': '#success.0',
    hovered: '#success.1',
    'pressed | (selected & !hovered)': '#success.05',
    '[disabled] | disabled': '#dark.04',
  },
  color: {
    '': '#success-text',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const SUCCESS_NEUTRAL_STYLES: Styles = {
  border: {
    '': '#clear',
    focused: '#success-text',
  },
  fill: {
    '': '#dark.0',
    hovered: '#dark.04',
    'pressed | (selected & !hovered)': '#dark.05',
  },
  color: {
    '': '#dark-02',
    'pressed | (selected & !hovered)': '#success-text',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const SUCCESS_CLEAR_STYLES: Styles = {
  border: {
    '': '#clear',
    pressed: '#success.05',
    focused: '#success-text',
  },
  fill: {
    '': '#success.0',
    hovered: '#success.1',
    'pressed | (selected & !hovered)': '#success.05',
  },
  color: {
    '': '#success-text',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const SUCCESS_LINK_STYLES: Styles = {
  outline: {
    '': '0 #success-text.0',
    focused: '1bw #success-text',
  },
  border: '0',
  fill: {
    '': '#clear',
  },
  color: {
    '': '#success-text',
    'hovered & !pressed': '#success',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

// ---------- SPECIAL THEME ----------
export const SPECIAL_PRIMARY_STYLES: Styles = {
  outline: {
    '': '0 #white.0',
    focused: '1bw #white',
  },
  border: {
    '': '#clear',
    pressed: '#purple-03',
    '[disabled] | disabled': '#white.3',
  },
  fill: {
    '': '#purple',
    'hovered & !pressed': '#purple-text',
    '[disabled] | disabled': '#white.12',
  },
  color: {
    '': '#white',
    '[disabled] | disabled': '#white.4',
  },
} as const;

export const SPECIAL_SECONDARY_STYLES: Styles = {
  border: {
    '': '#white.3',
    pressed: '#white.4',
    focused: '#white',
  },
  fill: {
    '': '#white.12',
    'hovered & !pressed': '#white.18',
    '[disabled] | disabled': '#white.12',
  },
  color: {
    '': '#white',
    '[disabled] | disabled': '#white.4',
  },
} as const;

export const SPECIAL_OUTLINE_STYLES: Styles = {
  border: {
    '': '#white.3',
    pressed: '#white.12',
    focused: '#white',
  },
  fill: {
    '': '#white.0',
    hovered: '#white.18',
    'pressed | (selected & !hovered)': '#white.12',
    '[disabled] | disabled': '#white.12',
  },
  color: {
    '': '#white',
    '[disabled] | disabled': '#white.4',
  },
} as const;

export const SPECIAL_NEUTRAL_STYLES: Styles = {
  border: {
    '': 0,
    focused: '#white',
  },
  fill: {
    '': '#white.0',
    hovered: '#white.12',
    'pressed | (selected & !hovered)': '#white.18',
  },
  color: {
    '': '#white',
    '[disabled] | disabled': '#white.4',
  },
} as const;

export const SPECIAL_CLEAR_STYLES: Styles = {
  outline: {
    focused: '1bw #white',
  },
  border: {
    '': '#clear',
    'pressed | focused': '#white',
    '[disabled] | disabled': '#white.3',
  },
  fill: {
    '': '#white',
    'hovered & !pressed': '#white.94',
    '[disabled] | disabled': '#white.12',
  },
  color: {
    '': '#purple-text',
    hovered: '#purple',
    'pressed & hovered': '#purple-text',
    '[disabled] | disabled': '#white.4',
  },
} as const;

export const SPECIAL_LINK_STYLES: Styles = {
  outline: {
    '': '0 #white.0',
    focused: '1bw #white',
  },
  border: '0',
  fill: {
    '': '#clear',
  },
  color: {
    '': '#white',
    'hovered & !pressed': '#white.9',
    '[disabled] | disabled': '#white.4',
  },
} as const;

const ButtonElement = tasty({
  qa: 'Button',
  styles: DEFAULT_BUTTON_STYLES,
  variants: {
    // Default theme
    'default.primary': DEFAULT_PRIMARY_STYLES,
    'default.secondary': DEFAULT_SECONDARY_STYLES,
    'default.outline': DEFAULT_OUTLINE_STYLES,
    'default.neutral': DEFAULT_NEUTRAL_STYLES,
    'default.clear': DEFAULT_CLEAR_STYLES,
    'default.link': DEFAULT_LINK_STYLES,

    // Danger theme
    'danger.primary': DANGER_PRIMARY_STYLES,
    'danger.secondary': DANGER_SECONDARY_STYLES,
    'danger.outline': DANGER_OUTLINE_STYLES,
    'danger.neutral': DANGER_NEUTRAL_STYLES,
    'danger.clear': DANGER_CLEAR_STYLES,
    'danger.link': DANGER_LINK_STYLES,

    // Success theme
    'success.primary': SUCCESS_PRIMARY_STYLES,
    'success.secondary': SUCCESS_SECONDARY_STYLES,
    'success.outline': SUCCESS_OUTLINE_STYLES,
    'success.neutral': SUCCESS_NEUTRAL_STYLES,
    'success.clear': SUCCESS_CLEAR_STYLES,
    'success.link': SUCCESS_LINK_STYLES,

    // Special theme
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
    type,
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
          'If you provide `icon` property for a Button and do not provide any children then you should specify the `aria-label` property to make sure the Button element stays accessible.',
        );
        label = 'Unnamed'; // fix to avoid warning in production
      }
    } else {
      if (!specifiedLabel) {
        accessibilityWarning(
          'If you provide no children for a Button then you should specify the `aria-label` property to make sure the Button element stays accessible.',
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
      'left-icon': !!icon,
      'right-icon': !!rightIcon,
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

  return (
    <ButtonElement
      download={download}
      {...actionProps}
      disabled={isDisabledElement}
      variant={`${theme}.${type ?? 'outline'}` as ButtonVariant}
      data-theme={theme}
      data-type={type ?? 'outline'}
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
