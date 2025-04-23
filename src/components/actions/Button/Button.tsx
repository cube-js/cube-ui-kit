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
  size?: 'small' | 'medium' | 'large' | (string & {});
}

const STYLE_PROPS = [...CONTAINER_STYLES, ...TEXT_STYLES];

export const DEFAULT_BUTTON_STYLES: Styles = {
  display: 'inline-grid',
  placeItems: 'center stretch',
  placeContent: 'center',
  position: 'relative',
  margin: 0,
  outline: {
    '': '#purple-03.0',
    focused: '#purple-03',
  },
  cursor: 'pointer',
  gap: '.75x',
  flow: 'column',
  preset: {
    '': 't3m',
    '[data-size="large"]': 't2m',
  },
  textDecoration: 'none',
  transition: 'theme',
  reset: 'button',
  padding: {
    '': '(1.25x - 1bw) (2x - 1bw)',
    '[data-size="small"]': '(.75x - 1bw) (1.25x - 1bw)',
    '[data-size="medium"]': '(1.25x - 1bw) (1.75x - 1bw)',
    '[data-size="large"]': '1.5x (2.25x - 1bw)',
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
    '[data-size="small"] & single-icon-only': '4x 4x',
    '[data-size="medium"] & single-icon-only': '5x 5x',
    '[data-size="large"] & single-icon-only': '6x 6x',
  },
  whiteSpace: 'nowrap',
  radius: {
    '': true,
    '[data-type="link"] & !focused': 0,
  },

  '& .anticon': {
    transition:
      'display .2s steps(1, start), margin .2s linear, opacity .2s linear',
  },

  ButtonIcon: {
    display: 'grid',
    fontSize: '@icon-size',
  },
};

const ButtonElement = tasty({
  qa: 'Button',
  styles: DEFAULT_BUTTON_STYLES,
  variants: {
    default: {
      shadow: {
        '': false,
        '[data-type="link"]': '0 @border-width 0 0 #purple.20',
        '[data-type="link"] & (pressed | hovered | [disabled])':
          '0 0 0 0 #purple.20',
      },
      outline: {
        '': '0 #purple-03.0',
        focused: '@outline-width #purple-03',
      },
      border: {
        // default
        '': '#clear',
        '[data-type="primary"] & pressed': '#purple-text',
        '[data-type="secondary"] & pressed': '#purple.3',
        '[data-type="outline"]': '#purple.3',
        '[data-type="outline"] & [disabled]': '#dark.12',
        '([data-type="clear"] | [data-type="outline"]) & pressed':
          '#purple-text.10',
        '[data-type="link"]': '0',
      },
      fill: {
        '': '#clear',

        '[data-type="primary"]': '#purple',
        '[data-type="primary"] & hovered': '#purple-text',
        '[data-type="primary"] & pressed': '#purple',

        '[data-type="secondary"]': '#purple.10',
        '[data-type="secondary"] & hovered': '#purple.16',
        '[data-type="secondary"] & pressed': '#purple-text.10',

        '[data-type="neutral"]': '#dark.0',
        '[data-type="neutral"] & hovered': '#dark.04',
        '[data-type="neutral"] & pressed': '#dark.05',

        '[disabled] & ![data-type="link"]': '#dark.04',

        '([data-type="clear"] | [data-type="outline"])': '#purple.0',
        '([data-type="clear"] | [data-type="outline"]) & hovered': '#purple.16',
        '([data-type="clear"] | [data-type="outline"]) & pressed': '#purple.10',
        '([data-type="clear"] | [data-type="outline"]) & [disabled]':
          '#purple.0',
      },
      color: {
        // default
        '': '#white',
        '[data-type="secondary"]': '#purple',
        '[data-type="clear"] | [data-type="outline"] | [data-type="link"]':
          '#purple-text',
        '[data-type="link"] & pressed': '#purple',
        '[data-type="neutral"]': '#dark-02',
        '[data-type="neutral"] & hovered': '#dark-02',
        '[data-type="neutral"] & pressed': '#purple',

        // other
        '[disabled]': '#dark.30',
      },
    },
    danger: {
      shadow: {
        '': false,
        '[data-type="link"]': '0 @border-width 0 0 #danger.20',
        '[data-type="link"] & (pressed | hovered | [disabled])':
          '0 0 0 0 #danger.20',
      },
      outline: {
        '': '0 #danger.0',
        focused: '@outline-width #danger.50',
      },
      border: {
        '': '#clear',
        '[data-type="primary"] & pressed': '#danger-text',
        '[data-type="secondary"] & pressed': '#danger.3',
        '[data-type="outline"]': '#danger-text.3',
        '([data-type="clear"] | [data-type="outline"]) & pressed':
          '#danger-text.10',
        '[data-type="outline"] & pressed': '#danger.3',
        '[data-type="link"]': '#clear',
      },
      fill: {
        '': '#clear',
        '[data-type="primary"]': '#danger',
        '[data-type="primary"] & hovered': '#danger-text',
        '[data-type="primary"] & pressed': '#danger',

        '[data-type="secondary"]': '#danger.05',
        '[data-type="secondary"] & hovered': '#danger.1',
        '[data-type="secondary"] & pressed': '#danger.05',

        '[data-type="neutral"]': '#dark.0',
        '[data-type="neutral"] & hovered': '#dark.04',
        '[data-type="neutral"] & pressed': '#dark.05',

        '[disabled] & ![data-type="link"]': '#dark.04',

        '[data-type="clear"] | [data-type="outline"]': '#danger.0',
        '([data-type="clear"] | [data-type="outline"]) & hovered': '#danger.1',
        '([data-type="clear"] | [data-type="outline"]) & pressed': '#danger.05',
        '([data-type="clear"] | [data-type="outline"]) & [disabled]':
          '#danger.0',
      },
      color: {
        '': '#white',

        '[data-type="neutral"]': '#dark-02',
        '[data-type="neutral"] & hovered': '#dark-02',
        '[data-type="secondary"]': '#danger',
        '[data-type="clear"] | [data-type="outline"] | [data-type="link"]':
          '#danger-text',
        '[data-type="link"] & pressed': '#danger',
        '[data-type="neutral"] & pressed': '#danger',

        '[disabled]': '#dark.30',
      },
    },
    special: {
      shadow: {
        '': false,
        '[data-type="link"]': '0 @border-width 0 0 #white.44',
        '[data-type="link"] & (pressed | hovered | [disabled])':
          '0 0 0 0 #white.44',
      },
      outline: {
        '': '0 #white.0',
        focused: '@outline-width #white.44',
        '([data-type="primary"] | [data-type="clear"])': '0 #dark-03.80',
        '([data-type="primary"] | [data-type="clear"]) & focused':
          '@outline-width #purple-03.80',
      },
      border: {
        '': '#clear',
        '[data-type="primary"] & pressed': '#purple-03',
        '[data-type="secondary"] & pressed': '#white.44',
        '[data-type="outline"] & !pressed': '#white.44',
      },
      fill: {
        '': '#clear',

        '[data-type="primary"]': '#purple',
        '[data-type="primary"] & pressed': '#purple',
        '[data-type="primary"] & hovered': '#purple-text',

        '[data-type="secondary"]': '#white.12',

        '[data-type="clear"]': '#white',
        '[data-type="clear"] & hovered': '#white.94',
        '[data-type="clear"] & pressed': '#white',

        '[disabled] & ![data-type="link"]': '#white.12',

        '([data-type="neutral"] | [data-type="outline"])': '#white.0',
        '([data-type="neutral"] | [data-type="outline"] | [data-type="secondary"]) & hovered':
          '#white.18',
        '([data-type="neutral"] | [data-type="outline"] | [data-type="secondary"]) & pressed':
          '#white.12',

        '([data-type="clear"] | [data-type="outline"]) & [disabled]':
          '#white.0',
      },
      color: {
        // default
        '': '#white',

        '[data-type="clear"]': '#purple',

        // other
        '[disabled]': '#white.30',
      },
    },
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
      variant={theme as 'default' | 'danger' | 'special'}
      data-theme={theme}
      data-type={type ?? 'secondary'}
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
