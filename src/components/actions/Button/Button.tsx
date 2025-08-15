import { FocusableRef } from '@react-types/shared';
import { cloneElement, forwardRef, ReactElement, useMemo } from 'react';

import {
  DANGER_CLEAR_STYLES,
  DANGER_LINK_STYLES,
  DANGER_NEUTRAL_STYLES,
  DANGER_OUTLINE_STYLES,
  DANGER_PRIMARY_STYLES,
  DANGER_SECONDARY_STYLES,
  DEFAULT_CLEAR_STYLES,
  DEFAULT_LINK_STYLES,
  DEFAULT_NEUTRAL_STYLES,
  DEFAULT_OUTLINE_STYLES,
  DEFAULT_PRIMARY_STYLES,
  DEFAULT_SECONDARY_STYLES,
  SPECIAL_CLEAR_STYLES,
  SPECIAL_LINK_STYLES,
  SPECIAL_NEUTRAL_STYLES,
  SPECIAL_OUTLINE_STYLES,
  SPECIAL_PRIMARY_STYLES,
  SPECIAL_SECONDARY_STYLES,
  SUCCESS_CLEAR_STYLES,
  SUCCESS_LINK_STYLES,
  SUCCESS_NEUTRAL_STYLES,
  SUCCESS_OUTLINE_STYLES,
  SUCCESS_PRIMARY_STYLES,
  SUCCESS_SECONDARY_STYLES,
} from '../../../data/item-themes';
import { LoadingIcon } from '../../../icons';
import {
  CONTAINER_STYLES,
  extractStyles,
  Styles,
  tasty,
  TEXT_STYLES,
} from '../../../tasty';
import { accessibilityWarning } from '../../../utils/warnings';
import { Text } from '../../content/Text';
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
  flow: 'column',
  placeItems: 'center start',
  placeContent: {
    '': 'center',
    'right-icon | suffix': 'center stretch',
  },
  gridColumns: {
    '': 'initial',
    'left-icon | loading | prefix': 'max-content',
  },
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
    '[data-size="small"] | [data-size="xsmall"]': '.5x (1.25x - 1bw)',
    '[data-size="medium"]': '.5x (1.5x - 1bw)',
    '[data-size="large"]': '.5x (1.75x - 1bw)',
    '[data-size="xlarge"]': '.5x (2x - 1bw)',
    'single-icon | [data-type="link"]': 0,
  },
  width: {
    '': 'initial',
    '[data-size="xsmall"] & single-icon': '$size-xs $size-xs',
    '[data-size="small"] & single-icon': '$size-sm $size-sm',
    '[data-size="medium"] & single-icon': '$size-md $size-md',
    '[data-size="large"] & single-icon': '$size-lg $size-lg',
    '[data-size="xlarge"] & single-icon': '$size-xl $size-xl',
    '[data-type="link"]': 'initial',
  },
  height: {
    '': 'initial',
    '[data-size="xsmall"]': '$size-xs $size-xs',
    '[data-size="small"]': '$size-sm $size-sm',
    '[data-size="medium"]': '$size-md $size-md',
    '[data-size="large"]': '$size-lg $size-lg',
    '[data-size="xlarge"]': '$size-xl $size-xl',
    '[data-type="link"]': 'initial',
  },
  whiteSpace: 'nowrap',
  radius: {
    '': true,
    '[data-type="link"] & !focused': 0,
  },

  ButtonIcon: {
    width: 'min 1fs',
  },

  '& [data-element="ButtonIcon"]:first-child:not(:last-child)': {
    marginLeft: '-.5x',
    placeSelf: 'center start',
  },

  '& [data-element="ButtonIcon"]:last-child:not(:first-child)': {
    marginRight: '-.5x',
    placeSelf: 'center end',
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

  const hasIcons = !!icon || !!rightIcon;

  const modifiers = useMemo(
    () => ({
      loading: isLoading,
      selected: isSelected,
      'with-icons': hasIcons,
      'left-icon': !!icon,
      'right-icon': !!rightIcon,
      'single-icon': singleIcon,
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
      {hasIcons && typeof children === 'string' ? (
        <Text ellipsis>{children}</Text>
      ) : (
        children
      )}
      {rightIcon}
    </ButtonElement>
  );
});
