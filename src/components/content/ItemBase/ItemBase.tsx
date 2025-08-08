import { ForwardedRef, forwardRef, ReactNode, useMemo } from 'react';

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
  ItemVariant,
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
import { BaseProps, Props, Styles, tasty } from '../../../tasty';

export interface CubeItemBaseProps extends BaseProps {
  icon?: ReactNode;
  rightIcon?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  description?: ReactNode;
  size?:
    | 'xsmall'
    | 'small'
    | 'medium'
    | 'large'
    | 'xlarge'
    | 'inline'
    | (string & {});
  contentProps?: Props;
  type?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'neutral'
    | 'clear'
    | 'link'
    | (string & {});
  theme?: 'default' | 'danger' | 'success' | 'special' | (string & {});
  variant?: ItemVariant;
  /**
   * HTML button type to avoid implicit form submission when used as `as="button"`.
   * Kept separate from visual `type` prop.
   */
  buttonType?: 'button' | 'submit' | 'reset';
}

const DEFAULT_ICON_STYLES: Styles = {
  display: 'grid',
  placeItems: 'center',
  placeContent: 'stretch',
  aspectRatio: '1 / 1',
  width: '($size - 2bw)',
};

const ADDITION_STYLES: Styles = {
  display: 'grid',
  flow: 'column',
  placeItems: 'center',
  placeContent: 'stretch',
};

const ItemBaseElement = tasty({
  styles: {
    display: 'inline-grid',
    flow: 'column',
    placeItems: 'stretch',
    placeContent: 'stretch',
    gridColumns: {
      '': '1sf max-content max-content',
      'with-icon ^ with-prefix': 'max-content 1sf max-content max-content',
      'with-icon & with-prefix':
        'max-content max-content 1sf max-content max-content',
    },
    flexShrink: 0,
    position: 'relative',
    padding: 0,
    margin: 0,
    radius: true,
    height: {
      '': '$size',
      '[data-size="inline"]': 'initial',
      'with-description': 'max-content',
    },
    preset: {
      '': 't3m',
      '[data-size="xsmall"]': 't4',
      '[data-size="xlarge"]': 't2m',
    },
    boxSizing: 'border-box',
    textDecoration: 'none',
    transition: 'theme',
    reset: 'button',
    border: '#clear',
    // fill: {
    //   '': '#dark.0',
    //   hovered: '#dark.03',
    //   'pressed | (selected & !hovered)': '#dark.06',
    // },
    // color: {
    //   '': '#dark-02',
    //   hovered: '#dark-02',
    //   pressed: '#dark',
    //   '[disabled] | disabled': '#dark-04',
    // },
    outlineOffset: 1,
    cursor: {
      '': 'default',
      ':is(button) | :is(a)': 'pointer',
      '[disabled] | disabled': 'not-allowed',
    },

    $size: {
      '': '$size-md',
      '[data-size="xsmall"]': '$size-xs',
      '[data-size="small"]': '$size-sm',
      '[data-size="medium"]': '$size-md',
      '[data-size="large"]': '$size-lg',
      '[data-size="xlarge"]': '$size-xl',
      '[data-size="inline"]': '',
    },
    '$inline-padding': {
      '': 'max($min-inline-padding, (($size - 1lh) / 2 + $inline-compensation))',
      '[data-size="inline"]': 0,
    },
    '$block-padding': {
      '': '.5x',
      '[data-size="xsmall"]': '.25x',
      '[data-size="inline"]': 0,
    },
    '$inline-compensation': '.5x',
    '$min-inline-padding': '1x',

    Icon: DEFAULT_ICON_STYLES,

    RightIcon: DEFAULT_ICON_STYLES,

    Content: {
      display: 'block',
      placeSelf: 'center start',
      boxSizing: 'border-box',
      placeContent: 'stretch',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '100%',
      padding: {
        '': '$block-padding $inline-padding',
        '(with-icon | with-prefix)':
          '$block-padding $inline-padding $block-padding 0',
        '(with-right-icon | with-suffix)':
          '$block-padding 0 $block-padding $inline-padding',
        '(with-icon | with-prefix) & (with-right-icon | with-suffix)':
          '$block-padding 0',
      },
      opacity: {
        '': 1,
        placeholder: '$disabled-opacity',
      },
    },

    Description: {
      preset: 't4',
      color: '#dark-03',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      maxWidth: '100%',
    },

    Prefix: {
      ...ADDITION_STYLES,
      padding: {
        '': '$inline-padding left',
        'with-icon': 0,
      },
    },

    Suffix: {
      ...ADDITION_STYLES,
      padding: {
        '': '$inline-padding right',
        'with-right-icon': 0,
      },
    },
  },
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

const ItemBase = <T extends HTMLElement = HTMLDivElement>(
  props: CubeItemBaseProps,
  ref: ForwardedRef<T>,
) => {
  let {
    children,
    size,
    type = 'neutral',
    theme = 'default',
    mods,
    icon,
    rightIcon,
    contentProps,
    prefix,
    suffix,
    description,
    styles,
    buttonType,
    ...rest
  } = props;

  mods = useMemo(() => {
    return {
      'with-icon': !!icon,
      'with-right-icon': !!rightIcon,
      'with-prefix': !!prefix,
      'with-suffix': !!suffix,
      'with-description': !!description,
      ...mods,
    };
  }, [icon, rightIcon, prefix, suffix, description, mods]);

  return (
    <ItemBaseElement
      ref={ref as any}
      variant={`${theme}.${type}` as ItemVariant}
      data-size={size}
      data-type={type}
      data-theme={theme}
      mods={mods}
      styles={styles}
      type={buttonType as any}
      {...rest}
    >
      {icon && <div data-element="Icon">{icon}</div>}
      {prefix && <div data-element="Prefix">{prefix}</div>}
      <div data-element="Content" {...contentProps}>
        {children}
        {description ? (
          <div data-element="Description">{description}</div>
        ) : null}
      </div>
      {suffix && <div data-element="Suffix">{suffix}</div>}
      {rightIcon && <div data-element="RightIcon">{rightIcon}</div>}
    </ItemBaseElement>
  );
};

const _ItemBase = forwardRef(ItemBase);

export { _ItemBase as ItemBase };
