import { cloneElement, forwardRef, ReactElement, useMemo } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { FocusableRef } from '@react-types/shared';

import { CubeActionProps } from '../Action';
import { Styles, tasty } from '../../../tasty';
import { accessibilityWarning } from '../../../utils/warnings';
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

// const DEFAULT_STYLES_BY_TYPE: { [key: string]: Styles } = {
//   primary: {
//     border: {
//       '': '#clear',
//       pressed: '#purple-text',
//     },
//     fill: {
//       hovered: '#purple-text',
//       'pressed | !hovered': '#purple',
//       '[disabled]': '#dark.04',
//     },
//     color: {
//       '': '#white',
//       '[disabled]': '#dark.30',
//     },
//   },
//   secondary: {
//     border: {
//       '': '#clear',
//       pressed: '#purple.30',
//     },
//     fill: {
//       '': '#purple.10',
//       hovered: '#purple.16',
//       pressed: '#purple.10',
//       '[disabled]': '#dark.04',
//     },
//     color: {
//       '': '#purple',
//       '[disabled]': '#dark.30',
//     },
//   },
//   clear: {
//     border: {
//       '': '#clear',
//       pressed: '#purple-text.10',
//     },
//     fill: {
//       '': '#purple.0',
//       hovered: '#purple.16',
//       pressed: '#purple.10',
//       '[disabled]': '#purple.0',
//     },
//     color: {
//       '': '#purple-text',
//       '[disabled]': '#dark.30',
//     },
//   },
//   outline: {
//     border: {
//       '': '#purple.30',
//       pressed: '#purple-text.10',
//       '[disabled]': '#dark.12',
//     },
//     fill: {
//       '': '#purple.0',
//       hovered: '#purple.16',
//       pressed: '#purple.10',
//       '[disabled]': '#purple.0',
//     },
//     color: {
//       '': '#purple-text',
//       '[disabled]': '#dark.30',
//     },
//   },
//   link: {
//     padding: '0',
//     radius: {
//       '': '0',
//       focused: true,
//     },
//     fill: '#clear',
//     color: {
//       '': '#purple-text',
//       pressed: '#purple',
//       '[disabled]': '#dark.30',
//     },
//   },
//   neutral: {
//     border: '#clear',
//     fill: {
//       '': '#dark.0',
//       hovered: '#dark.04',
//       pressed: '#purple.10',
//       '[disabled]': '#dark.04',
//     },
//     color: {
//       '': '#dark.75',
//       hovered: '#dark.75',
//       pressed: '#purple',
//       '[disabled]': '#dark.30',
//     },
//   },
// };
//
// const DANGER_STYLES_BY_TYPE: { [key: string]: Styles } = {
//   primary: {
//     border: {
//       '': '#clear',
//       pressed: '#danger-text',
//     },
//     fill: {
//       hovered: '#danger-text',
//       'pressed | !hovered': '#danger',
//       '[disabled]': '#dark.04',
//     },
//     color: {
//       '': '#white',
//       '[disabled]': '#dark.30',
//     },
//   },
//   secondary: {
//     border: {
//       '': '#clear',
//       pressed: '#danger.30',
//     },
//     fill: {
//       '': '#danger.05',
//       hovered: '#danger.1',
//       pressed: '#danger.05',
//       '[disabled]': '#dark.04',
//     },
//     color: {
//       '': '#danger',
//       '[disabled]': '#dark.30',
//     },
//   },
//   clear: {
//     border: {
//       '': '#clear',
//       pressed: '#danger-text.10',
//     },
//     fill: {
//       '': '#danger.0',
//       hovered: '#danger.1',
//       pressed: '#danger.05',
//       '[disabled]': '#danger.0',
//     },
//     color: {
//       '': '#danger-text',
//       '[disabled]': '#dark.30',
//     },
//   },
//   outline: {
//     border: {
//       '': '#danger.30',
//       pressed: '#danger-text.10',
//       '[disabled]': '#dark.04',
//     },
//     fill: {
//       '': '#danger.0',
//       hovered: '#danger.1',
//       pressed: '#danger.05',
//       '[disabled]': '#danger.0',
//     },
//     color: {
//       '': '#danger-text',
//       '[disabled]': '#dark.30',
//     },
//   },
//   link: {
//     ...DEFAULT_STYLES_BY_TYPE.link,
//     color: {
//       '': '#danger-text',
//       pressed: '#danger',
//       '[disabled]': '#dark.30',
//     },
//     shadow: {
//       '': '0 @border-width 0 0 #danger.20',
//       focused: '0 0 0 @outline-width #danger.20',
//       'pressed | hovered | [disabled]': '0 0 0 0 #danger.20',
//     },
//   },
//   neutral: {
//     border: '0',
//     fill: {
//       '': '#dark.0',
//       hovered: '#dark.04',
//       pressed: '#dark.05',
//       '[disabled]': '#dark.04',
//     },
//     color: {
//       '': '#dark.75',
//       hovered: '#dark.75',
//       pressed: '#danger',
//       '[disabled]': '#dark.30',
//     },
//   },
// };

export const DEFAULT_BUTTON_STYLES = {
  display: 'inline-grid',
  placeItems: 'center stretch',
  placeContent: 'center',
  gap: '1x',
  flow: 'column',
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
    'single-icon-only | [data-type="link"]': 0,
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
} as Styles;

const DefaultButtonElement = tasty({
  'data-theme': 'default',
  styles: {
    ...DEFAULT_BUTTON_STYLES,
    shadow: {
      '': false,
      '[data-type="link"]': '0 @border-width 0 0 #purple.20',
      '[data-type="link"] & (pressed | hovered | [disabled])':
        '0 0 0 0 #purple.20',
    },
    outline: {
      '': '0 #purple-03.20',
      focused: '@outline-width #purple-03.20',
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
      '[data-type="link"]': '#clear',
      '[data-type="link"] & pressed': '#purple',
    },
    fill: {
      '': '#clear',

      '[data-type="primary"]': '#purple',
      '[data-type="primary"] & pressed': '#purple',
      '[data-type="primary"] & hovered': '#purple-text',

      '[data-type="secondary"]': '#purple.10',
      '[data-type="secondary"] & hovered': '#purple.16',
      '[data-type="secondary"] & pressed': '#purple-text.10',

      '[data-type="neutral"]': '#dark.0',
      '[data-type="neutral"] & hovered': '#dark.04',
      '[data-type="neutral"] & pressed': '#dark.05',

      '[disabled]': '#dark.04',

      '([data-type="clear"] | [data-type="outline"])': '#purple.0',
      '([data-type="clear"] | [data-type="outline"]) & hovered': '#purple.16',
      '([data-type="clear"] | [data-type="outline"]) & pressed': '#purple.10',
      '([data-type="clear"] | [data-type="outline"]) & [disabled]': '#purple.0',
    },
    color: {
      // default
      '': '#white',
      '[data-type="secondary"]': '#purple',
      '[data-type="clear"] | [data-type="outline"] | [data-type="link"]':
        '#purple-text',
      '[data-type="link"] & pressed': '#purple',
      '[data-type="neutral"]': '#dark.75',
      '[data-type="neutral"] & hovered': '#dark.75',
      '[data-type="neutral"] & pressed': '#purple',

      // other
      '[disabled]': '#dark.30',
    },
  },
});

const DangerButtonElement = tasty({
  'data-theme': 'default',
  styles: {
    ...DEFAULT_BUTTON_STYLES,
    shadow: {
      '': false,
      '[data-type="link"]': '0 @border-width 0 0 #danger.20',
      '[data-type="link"] & (pressed | hovered | [disabled])':
        '0 0 0 0 #danger.20',
    },
    outline: {
      '': '0 #danger.20',
      focused: '@outline-width #danger.20',
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
      '[data-type="primary"]': '#danger-text',
      '[data-type="primary"] & hovered': '#danger-text',
      '[data-type="primary"] & pressed': '#danger',

      '[data-type="secondary"]': '#danger.05',
      '[data-type="secondary"] & hovered': '#danger.1',
      '[data-type="secondary"] & pressed': '#danger.05',

      '[data-type="neutral"]': '#dark.0',
      '[data-type="neutral"] & hovered': '#dark.04',
      '[data-type="neutral"] & pressed': '#dark.05',

      '[disabled]': '#dark.04',

      '[data-type="clear"] | [data-type="outline"]': '#danger.0',
      '([data-type="clear"] | [data-type="outline"]) & hovered': '#danger.1',
      '([data-type="clear"] | [data-type="outline"]) & pressed': '#danger.05',
      '([data-type="clear"] | [data-type="outline"]) & [disabled]': '#danger.0',
    },
    color: {
      '': '#white',

      '[data-type="neutral"]': '#dark.75',
      '[data-type="neutral"] & hovered': '#dark.75',
      '[data-type="secondary"]': '#danger',
      '[data-type="clear"] | [data-type="outline"] | [data-type="link"]':
        '#danger-text',
      '[data-type="link"] & pressed': '#danger',
      '[data-type="neutral"] & pressed': '#danger',

      '[disabled]': '#dark.30',
    },
  },
});

const SpecialButtonElement = tasty({
  'data-theme': 'default',
  styles: {
    ...DEFAULT_BUTTON_STYLES,
    shadow: {
      '': false,
      '[data-type="link"]': '0 @border-width 0 0 #white.44',
      '[data-type="link"] & (pressed | hovered | [disabled])':
        '0 0 0 0 #white.44',
    },
    outline: {
      '': '0 #white.44',
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

      '[disabled]': '#white.12',

      '([data-type="neutral"] | [data-type="outline"] | [data-type="secondary"])':
        '#white.0',
      '([data-type="neutral"] | [data-type="outline"] | [data-type="secondary"]) & hovered':
        '#white.18',
      '([data-type="neutral"] | [data-type="outline"] | [data-type="secondary"]) & pressed':
        '#white.12',

      '([data-type="clear"] | [data-type="outline"]) & [disabled]': '#white.0',
    },
    color: {
      // default
      '': '#white',

      '[data-type="neutral"]': '#white.75',
      '[data-type="neutral"] & hovered': '#white.75',
      // '[data-type="primary"]': '#white',
      '[data-type="clear"]': '#purple',
      // '[data-type="link"] & pressed': '#white',
      // '[data-type="neutral"] & pressed': '#white',

      // other
      '[disabled]': '#white.30',
    },
  },
});

const ElementMap = {
  default: DefaultButtonElement,
  danger: DangerButtonElement,
  special: SpecialButtonElement,
};

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
    theme = 'default',
    icon,
    rightIcon,
    mods,
    ...props
  } = allProps;

  const isDisabled = props.isDisabled || props.isLoading;
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

  const ButtonElement = ElementMap[theme];

  const { actionProps } = useAction(
    { ...props, isDisabled, mods: modifiers },
    ref,
  );

  return (
    <ButtonElement
      {...actionProps}
      data-theme={theme}
      data-type={type ?? 'secondary'}
      data-size={size ?? 'medium'}
      styles={styles}
    >
      {icon || isLoading ? !isLoading ? icon : <LoadingOutlined /> : null}
      {children}
      {rightIcon}
    </ButtonElement>
  );
});
