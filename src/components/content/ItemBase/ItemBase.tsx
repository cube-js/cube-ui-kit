import { ForwardedRef, forwardRef, ReactNode, useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import {
  DANGER_CLEAR_STYLES,
  DANGER_ITEM_STYLES,
  DANGER_LINK_STYLES,
  DANGER_NEUTRAL_STYLES,
  DANGER_OUTLINE_STYLES,
  DANGER_PRIMARY_STYLES,
  DANGER_SECONDARY_STYLES,
  DEFAULT_CLEAR_STYLES,
  DEFAULT_ITEM_STYLES,
  DEFAULT_LINK_STYLES,
  DEFAULT_NEUTRAL_STYLES,
  DEFAULT_OUTLINE_STYLES,
  DEFAULT_PRIMARY_STYLES,
  DEFAULT_SECONDARY_STYLES,
  ItemVariant,
  SPECIAL_CLEAR_STYLES,
  SPECIAL_ITEM_STYLES,
  SPECIAL_LINK_STYLES,
  SPECIAL_NEUTRAL_STYLES,
  SPECIAL_OUTLINE_STYLES,
  SPECIAL_PRIMARY_STYLES,
  SPECIAL_SECONDARY_STYLES,
  SUCCESS_CLEAR_STYLES,
  SUCCESS_ITEM_STYLES,
  SUCCESS_LINK_STYLES,
  SUCCESS_NEUTRAL_STYLES,
  SUCCESS_OUTLINE_STYLES,
  SUCCESS_PRIMARY_STYLES,
  SUCCESS_SECONDARY_STYLES,
} from '../../../data/item-themes';
import { CheckIcon } from '../../../icons/CheckIcon';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  Props,
  Styles,
  tasty,
} from '../../../tasty';
import {
  CubeTooltipProviderProps,
  TooltipProvider,
} from '../../overlays/Tooltip/TooltipProvider';
import { HotKeys } from '../HotKeys';

export interface CubeItemBaseProps extends BaseProps, ContainerStyleProps {
  icon?: ReactNode | 'checkbox';
  rightIcon?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  description?: ReactNode;
  isSelected?: boolean;
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
    | 'item'
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'neutral'
    | 'clear'
    | 'link'
    | (string & {});
  theme?: 'default' | 'danger' | 'success' | 'special' | (string & {});
  variant?: ItemVariant;
  /** Keyboard shortcut that triggers the element when pressed */
  hotkeys?: string;
  /** Tooltip content - string for simple text or object for advanced configuration */
  tooltip?: string | Omit<CubeTooltipProviderProps, 'children'>;
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
  opacity: {
    '': 1,
    'checkbox & selected': 1,
    'checkbox & !selected': 0,
    'checkbox & !selected & hovered': 0.4,
  },
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
      '': 'min $size',
      '[data-size="inline"]': 'initial',
    },
    border: '#clear',
    fill: {
      '': '#dark.0',
      'hovered | focused': '#dark.03',
      selected: '#dark.09',
      'selected & (hovered | focused)': '#dark.12',
      pressed: '#dark.09',
      '[disabled] | disabled': '#clear',
    },
    color: {
      '': '#dark-02',
      hovered: '#dark-02',
      pressed: '#dark',
      '[disabled] | disabled': '#dark-04',
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
      '[data-size="xsmall"] | [data-size="small"]': '.25x',
      '[data-size="inline"]': 0,
    },
    '$inline-compensation': '.5x',
    '$min-inline-padding': '1x',

    Icon: DEFAULT_ICON_STYLES,

    RightIcon: DEFAULT_ICON_STYLES,

    ItemContent: {
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
    },

    Description: {
      preset: 't4',
      color: '#dark-03',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      maxWidth: '100%',
      textAlign: 'left',
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
    'default.item': DEFAULT_ITEM_STYLES,
    // Danger theme
    'danger.primary': DANGER_PRIMARY_STYLES,
    'danger.secondary': DANGER_SECONDARY_STYLES,
    'danger.outline': DANGER_OUTLINE_STYLES,
    'danger.neutral': DANGER_NEUTRAL_STYLES,
    'danger.clear': DANGER_CLEAR_STYLES,
    'danger.link': DANGER_LINK_STYLES,
    'danger.item': DANGER_ITEM_STYLES,
    // Success theme
    'success.primary': SUCCESS_PRIMARY_STYLES,
    'success.secondary': SUCCESS_SECONDARY_STYLES,
    'success.outline': SUCCESS_OUTLINE_STYLES,
    'success.neutral': SUCCESS_NEUTRAL_STYLES,
    'success.clear': SUCCESS_CLEAR_STYLES,
    'success.link': SUCCESS_LINK_STYLES,
    'success.item': SUCCESS_ITEM_STYLES,
    // Special theme
    'special.primary': SPECIAL_PRIMARY_STYLES,
    'special.secondary': SPECIAL_SECONDARY_STYLES,
    'special.outline': SPECIAL_OUTLINE_STYLES,
    'special.neutral': SPECIAL_NEUTRAL_STYLES,
    'special.clear': SPECIAL_CLEAR_STYLES,
    'special.link': SPECIAL_LINK_STYLES,
    'special.item': SPECIAL_ITEM_STYLES,
  },
  styleProps: CONTAINER_STYLES,
});

const ItemBase = <T extends HTMLElement = HTMLDivElement>(
  props: CubeItemBaseProps,
  ref: ForwardedRef<T>,
) => {
  let {
    children,
    size,
    type = 'item',
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
    isSelected,
    hotkeys,
    tooltip,
    isDisabled,
    ...rest
  } = props;

  // Determine if we should show checkbox instead of icon
  const hasCheckbox = icon === 'checkbox';

  // Build final suffix: custom suffix or HotKeys hint if provided and no explicit suffix
  const finalSuffix =
    suffix ??
    (hotkeys ? (
      <HotKeys
        type={type === 'primary' ? 'primary' : 'default'}
        styles={{ padding: '1x left', opacity: isDisabled ? 0.5 : 1 }}
      >
        {hotkeys}
      </HotKeys>
    ) : undefined);

  // Register global hotkey if provided
  useHotkeys(
    typeof hotkeys === 'string' ? hotkeys.toLowerCase() : '',
    () => {
      if (!hotkeys) return;
      if (isDisabled) return;
      // Simulate a click on the element so all existing handlers run
      if (ref && typeof ref === 'object' && ref.current) {
        (ref.current as HTMLElement).click();
      }
    },
    {
      enableOnContentEditable: true,
      enabled: !!hotkeys,
      preventDefault: true,
      enableOnFormTags: true,
    },
    [hotkeys, isDisabled],
  );

  mods = useMemo(() => {
    return {
      'with-icon': !!icon,
      'with-right-icon': !!rightIcon,
      'with-prefix': !!prefix,
      'with-suffix': !!finalSuffix,
      'with-description': !!description,
      checkbox: hasCheckbox,
      selected: isSelected === true,
      ...mods,
    };
  }, [
    icon,
    rightIcon,
    prefix,
    finalSuffix,
    description,
    hasCheckbox,
    isSelected,
    mods,
  ]);

  const itemElement = (
    <ItemBaseElement
      ref={ref as any}
      variant={theme && type ? (`${theme}.${type}` as ItemVariant) : undefined}
      data-size={size}
      data-type={type}
      data-theme={theme}
      aria-disabled={isDisabled}
      aria-selected={isSelected}
      mods={mods}
      styles={styles}
      type={buttonType as any}
      {...rest}
    >
      {icon && (
        <div data-element="Icon">{hasCheckbox ? <CheckIcon /> : icon}</div>
      )}
      {prefix && <div data-element="Prefix">{prefix}</div>}
      {children || description || contentProps ? (
        <div data-element="ItemContent" {...contentProps}>
          {children}
          {description ? (
            <div data-element="Description">{description}</div>
          ) : null}
        </div>
      ) : null}
      {finalSuffix && <div data-element="Suffix">{finalSuffix}</div>}
      {rightIcon && <div data-element="RightIcon">{rightIcon}</div>}
    </ItemBaseElement>
  );

  if (tooltip) {
    const tooltipProps =
      typeof tooltip === 'string' ? { title: tooltip } : tooltip;

    return <TooltipProvider {...tooltipProps}>{itemElement}</TooltipProvider>;
  }

  return itemElement;
};

const _ItemBase = forwardRef(ItemBase);

export { _ItemBase as ItemBase };
