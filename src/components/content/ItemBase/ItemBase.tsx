import { FocusableRef } from '@react-types/shared';
import {
  ComponentProps,
  ForwardedRef,
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FocusableOptions, OverlayProps, useFocusable } from 'react-aria';
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
import { LoadingIcon } from '../../../icons/LoadingIcon';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  Props,
  Styles,
  tasty,
} from '../../../tasty';
import { mergeProps, useCombinedRefs } from '../../../utils/react';
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
  descriptionPlacement?: 'inline' | 'block' | 'auto';
  isSelected?: boolean;
  size?:
    | 'xsmall'
    | 'small'
    | 'medium'
    | 'large'
    | 'xlarge'
    | 'inline'
    | (string & {});
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
  /**
   * Tooltip content and configuration:
   * - string: simple tooltip text
   * - true: auto tooltip on overflow (shows children as tooltip when truncated)
   * - object: advanced configuration with optional auto property
   */
  tooltip?:
    | string
    | boolean
    | (Omit<CubeTooltipProviderProps, 'children'> & { auto?: boolean });
  /**
   * HTML button type to avoid implicit form submission when used as `as="button"`.
   * Kept separate from visual `type` prop.
   */
  htmlType?: 'button' | 'submit' | 'reset';
  labelProps?: Props;
  descriptionProps?: Props;
  keyboardShortcutProps?: Props;
  /**
   * The slot which the loading icon should replace in loading state.
   * - "auto": Smart selection - prefers icon if present, then rightIcon, fallback to icon
   * - Specific slot names: Always use that slot
   * @default "auto"
   */
  loadingSlot?: 'auto' | 'icon' | 'rightIcon' | 'prefix' | 'suffix';
  /**
   * When true, shows loading state by replacing the specified slot with LoadingIcon
   * and makes the component disabled.
   */
  isLoading?: boolean;
  /**
   * @private
   * Default tooltip placement for the item.
   * @default "top"
   */
  defaultTooltipPlacement?: OverlayProps['placement'];
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
  gridRow: 'span 2',
};

const ADDITION_STYLES: Styles = {
  display: 'grid',
  flow: 'column',
  placeItems: 'center',
  placeContent: 'stretch',
  gridRow: 'span 2',
};

const FocusableItemBase = forwardRef(function FocusableItembase(
  props: ComponentProps<typeof ItemBaseElement> & FocusableOptions,
  ref: FocusableRef<HTMLElement>,
) {
  let { focusableProps } = useFocusable(props, ref as any);

  return <ItemBaseElement ref={ref} {...mergeProps(props, focusableProps)} />;
});

const ItemBaseElement = tasty({
  styles: {
    display: 'inline-grid',
    flow: 'column dense',
    gap: 0,
    outline: 0,
    placeItems: 'stretch',
    placeContent: 'stretch',
    gridColumns: {
      '': '1sf max-content max-content',
      'with-icon ^ with-prefix': 'max-content 1sf max-content max-content',
      'with-icon & with-prefix':
        'max-content max-content 1sf max-content max-content',
      '(with-icon ^ with-right-icon) & !with-description & !with-prefix & !with-suffix & !with-label':
        'max-content',
    },
    gridRows: {
      '': 'auto auto',
      'with-description-block': 'auto auto auto',
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
      '': 'max($min-inline-padding, (($size - 1lh - 2bw) / 2 + $inline-compensation))',
      '[data-size="inline"]': 0,
    },
    '$block-padding': {
      '': '.5x',
      '[data-size="xsmall"] | [data-size="small"]': '.25x',
      '[data-size="inline"]': 0,
    },
    '$inline-compensation': '.5x',
    '$min-inline-padding': '(1x - 1bw)',

    Icon: DEFAULT_ICON_STYLES,

    RightIcon: DEFAULT_ICON_STYLES,

    Label: {
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
        'with-description & !with-description-block':
          '$block-padding $inline-padding 0 $inline-padding',
        'with-description & !with-description-block & (with-icon | with-prefix)':
          '$block-padding $inline-padding 0 0',
        'with-description & !with-description-block & (with-right-icon | with-suffix)':
          '$block-padding 0 0 $inline-padding',
        'with-description & !with-description-block & (with-icon | with-prefix) & (with-right-icon | with-suffix)':
          '$block-padding 0 0 0',
      },
      gridRow: {
        '': 'span 2',
        'with-description': 'span 1',
        'with-description-block': 'span 2',
      },
    },

    Description: {
      preset: 't4',
      color: 'inherit',
      opacity: 0.75,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      maxWidth: '100%',
      textAlign: 'left',
      gridRow: {
        '': 'span 1',
        'with-description-block': '3 / span 1',
      },
      gridColumn: {
        '': 'span 1',
        'with-description-block': '1 / -1',
      },
      padding: {
        '': '0 $inline-padding $block-padding $inline-padding',
        '(with-icon | with-prefix)': '0 $inline-padding $block-padding 0',
        '(with-right-icon | with-suffix)': '0 0 $block-padding $inline-padding',
        '(with-icon | with-prefix) & (with-right-icon | with-suffix)':
          '0 0 $block-padding 0',
        'with-description-block':
          '0 ($inline-padding - $inline-compensation + 1bw) $block-padding ($inline-padding - $inline-compensation + 1bw)',
        'with-description-block & !with-icon':
          '0 ($inline-padding - $inline-compensation + 1bw) $block-padding $inline-padding',
        'with-description-block & !with-right-icon':
          '0 $inline-padding $block-padding ($inline-padding - $inline-compensation + 1bw)',
        'with-description-block & !with-right-icon & !with-icon':
          '0 $inline-padding $block-padding $inline-padding',
      },
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
    prefix,
    suffix,
    description,
    descriptionPlacement = 'inline',
    labelProps,
    descriptionProps,
    keyboardShortcutProps,
    styles,
    htmlType,
    isSelected,
    hotkeys,
    tooltip,
    isDisabled,
    loadingSlot = 'auto',
    isLoading = false,
    defaultTooltipPlacement = 'top',
    ...rest
  } = props;

  // Loading state makes the component disabled
  const finalIsDisabled =
    isDisabled === true || (isLoading && isDisabled !== false);

  // Determine if we should show checkbox instead of icon
  const hasCheckbox = icon === 'checkbox';

  // Determine which slot to use for loading when "auto" is selected
  const resolvedLoadingSlot = useMemo(() => {
    if (loadingSlot !== 'auto') return loadingSlot;

    // Auto logic: prefer icon if present, then rightIcon, fallback to icon
    if (rightIcon && !icon) return 'rightIcon';
    return 'icon'; // fallback
  }, [loadingSlot, icon, rightIcon]);

  // Apply loading state to appropriate slots
  const finalIcon =
    isLoading && resolvedLoadingSlot === 'icon' ? <LoadingIcon /> : icon;
  const finalRightIcon =
    isLoading && resolvedLoadingSlot === 'rightIcon' ? (
      <LoadingIcon />
    ) : (
      rightIcon
    );
  const finalPrefix =
    isLoading && resolvedLoadingSlot === 'prefix' ? <LoadingIcon /> : prefix;

  // Build final suffix: loading icon, custom suffix, or HotKeys hint
  const finalSuffix =
    isLoading && resolvedLoadingSlot === 'suffix' ? (
      <LoadingIcon />
    ) : (
      suffix ??
      (hotkeys ? (
        <HotKeys
          type={type === 'primary' ? 'primary' : 'default'}
          styles={{ padding: '1x left', opacity: finalIsDisabled ? 0.5 : 1 }}
        >
          {hotkeys}
        </HotKeys>
      ) : undefined)
    );

  // Register global hotkey if provided
  useHotkeys(
    typeof hotkeys === 'string' ? hotkeys.toLowerCase() : '',
    () => {
      if (!hotkeys) return;
      if (finalIsDisabled) return;
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
    [hotkeys, finalIsDisabled],
  );

  mods = useMemo(() => {
    return {
      'with-icon': !!finalIcon,
      'with-right-icon': !!finalRightIcon,
      'with-label': !!(children || labelProps),
      'with-prefix': !!finalPrefix,
      'with-suffix': !!finalSuffix,
      'with-description': !!description,
      'with-description-block':
        !!description && descriptionPlacement === 'block',
      checkbox: hasCheckbox,
      disabled: finalIsDisabled,
      selected: isSelected === true,
      loading: isLoading,
      ...mods,
    };
  }, [
    finalIcon,
    finalRightIcon,
    finalPrefix,
    finalSuffix,
    description,
    descriptionPlacement,
    hasCheckbox,
    isSelected,
    isLoading,
    mods,
  ]);

  // Determine if auto tooltip is enabled
  const isAutoTooltipEnabled = useMemo(() => {
    if (tooltip === true && typeof children === 'string') return true;
    if (typeof tooltip === 'object' && tooltip?.auto) return true;
    return false;
  }, [tooltip, typeof children]);

  // Track label overflow for auto tooltip (only when enabled)
  const mergedLabelRef = useCombinedRefs((labelProps as any)?.ref);
  const [isLabelOverflowed, setIsLabelOverflowed] = useState(false);

  const checkLabelOverflow = useCallback(() => {
    const label = mergedLabelRef.current;
    if (!label) {
      setIsLabelOverflowed(false);
      return;
    }

    const hasOverflow = label.scrollWidth > label.clientWidth;

    setIsLabelOverflowed(hasOverflow);
  }, [mergedLabelRef]);

  useEffect(() => {
    if (isAutoTooltipEnabled) {
      checkLabelOverflow();
    }
  }, [children, isAutoTooltipEnabled, checkLabelOverflow]);

  useEffect(() => {
    if (!isAutoTooltipEnabled) return;

    const label = mergedLabelRef.current;
    if (!label) return;

    const resizeObserver = new ResizeObserver(checkLabelOverflow);
    resizeObserver.observe(label);

    return () => resizeObserver.disconnect();
  }, [
    isAutoTooltipEnabled,
    checkLabelOverflow,
    typeof children === 'string' ? children : null,
    mergedLabelRef,
  ]);

  const finalLabelProps = useMemo(() => {
    return {
      ...(labelProps || {}),
      ref: mergedLabelRef,
    } as Props & { ref?: any };
  }, [labelProps, mergedLabelRef]);

  const Component =
    tooltip || finalIsDisabled ? FocusableItemBase : ItemBaseElement;

  const itemElement = (
    <Component
      ref={ref as any}
      tabIndex={0}
      variant={theme && type ? (`${theme}.${type}` as ItemVariant) : undefined}
      disabled={finalIsDisabled}
      data-size={size}
      data-type={type}
      data-theme={theme}
      aria-disabled={finalIsDisabled}
      aria-selected={isSelected}
      mods={mods}
      styles={styles}
      type={htmlType as any}
      {...rest}
    >
      {finalIcon && (
        <div data-element="Icon">{hasCheckbox ? <CheckIcon /> : finalIcon}</div>
      )}
      {finalPrefix && <div data-element="Prefix">{finalPrefix}</div>}
      {children || labelProps ? (
        <div data-element="Label" {...finalLabelProps}>
          {children}
        </div>
      ) : null}
      {description || descriptionProps ? (
        <div data-element="Description" {...descriptionProps}>
          {description}
        </div>
      ) : null}
      {finalSuffix && <div data-element="Suffix">{finalSuffix}</div>}
      {finalRightIcon && <div data-element="RightIcon">{finalRightIcon}</div>}
    </Component>
  );

  // Handle tooltip rendering based on tooltip prop type
  if (tooltip) {
    // String tooltip - simple case
    if (typeof tooltip === 'string') {
      return (
        <TooltipProvider placement={defaultTooltipPlacement} title={tooltip}>
          {itemElement}
        </TooltipProvider>
      );
    }

    // Boolean tooltip - auto tooltip on overflow
    if (tooltip === true) {
      if ((children || labelProps) && isLabelOverflowed) {
        return (
          <TooltipProvider placement={defaultTooltipPlacement} title={children}>
            {itemElement}
          </TooltipProvider>
        );
      }
    }

    // Object tooltip - advanced configuration
    if (typeof tooltip === 'object') {
      const { auto, ...tooltipProps } = tooltip;

      // If auto is enabled and label is overflowed, show auto tooltip
      if (
        (auto && (children || labelProps) && isLabelOverflowed) ||
        (tooltipProps.title && !auto)
      ) {
        return (
          <TooltipProvider
            placement={defaultTooltipPlacement}
            title={tooltipProps.title ?? children}
            {...tooltipProps}
          >
            {itemElement}
          </TooltipProvider>
        );
      }
    }
  }

  return itemElement;
};

const _ItemBase = forwardRef(ItemBase);

export { _ItemBase as ItemBase };
