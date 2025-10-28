import {
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { OverlayProps } from 'react-aria';
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
import { mergeProps } from '../../../utils/react';
import { ItemAction } from '../../actions/ItemAction';
import { ItemActionProvider } from '../../actions/ItemActionContext';
import {
  CubeTooltipProviderProps,
  TooltipProvider,
} from '../../overlays/Tooltip/TooltipProvider';
import { HotKeys } from '../HotKeys';
import { ItemBadge } from '../ItemBadge';

export interface CubeItemProps extends BaseProps, ContainerStyleProps {
  icon?: ReactNode | 'checkbox';
  rightIcon?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  description?: ReactNode;
  descriptionPlacement?: 'inline' | 'block' | 'auto';
  /**
   * Whether the item is selected.
   * @default false
   */
  isSelected?: boolean;
  /**
   * Actions to render inline or placeholder mode for ItemButton wrapper.
   * - ReactNode: renders actions inline as part of the grid layout
   * - true: placeholder mode for ItemButton (enables --actions-width calculation)
   */
  actions?: ReactNode | true;
  size?:
    | 'xsmall'
    | 'small'
    | 'medium'
    | 'large'
    | 'xlarge'
    | 'inline'
    | number
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
   * When true, applies card styling with increased border radius.
   */
  isCard?: boolean;
  /**
   * @private
   * Default tooltip placement for the item.
   * @default "top"
   */
  defaultTooltipPlacement?: OverlayProps['placement'];
  /**
   * Ref to access the label element directly
   */
  labelRef?: RefObject<HTMLElement>;
}

const DEFAULT_ICON_STYLES: Styles = {
  $: '>',
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
  $: '>',
  display: 'grid',
  flow: 'column',
  placeItems: 'center',
  placeContent: 'stretch',
  gridRow: 'span 2',
};

const ACTIONS_EVENT_HANDLERS = {
  onClick: (e: MouseEvent) => e.stopPropagation(),
  onPointerDown: (e: PointerEvent) => e.stopPropagation(),
  onPointerUp: (e: PointerEvent) => e.stopPropagation(),
  onMouseDown: (e: MouseEvent) => e.stopPropagation(),
  onMouseUp: (e: MouseEvent) => e.stopPropagation(),
  onKeyDown: (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation();
    }
  },
};

const ItemElement = tasty({
  styles: {
    display: 'inline-grid',
    flow: 'column dense',
    gap: 0,
    outline: 0,
    placeItems: 'stretch',
    placeContent: 'stretch',
    gridColumns: {
      '': '1sf max-content max-content',
      'with-actions': '1sf max-content max-content max-content',
      'with-icon ^ with-prefix': 'max-content 1sf max-content max-content',
      'with-icon ^ with-prefix & with-actions':
        'max-content 1sf max-content max-content max-content',
      'with-icon & with-prefix':
        'max-content max-content 1sf max-content max-content',
      'with-icon & with-prefix & with-actions':
        'max-content max-content 1sf max-content max-content max-content',
      '(with-icon ^ with-right-icon) & !with-description & !with-prefix & !with-suffix & !with-label':
        'max-content',
    },
    gridRows: {
      '': 'auto auto',
      'with-description-block': 'auto auto auto',
    },
    // Prevent items from shrinking inside vertical flex layouts (Menu, ListBox, etc)
    flexShrink: 0,
    position: 'relative',
    padding: 0,
    margin: 0,
    radius: {
      '': true,
      card: '1cr',
    },
    height: {
      '': 'min $size',
      '[data-size="inline"]': '(1lh + 2bw)',
    },
    width: {
      '': 'min $size',
      '[data-size="inline"]': 'min (1lh + 2bw)',
    },
    border: '#clear',
    fill: {
      '': '#dark.0',
      'hovered | focused': '#dark.03',
      selected: '#dark.09',
      'selected & (hovered | focused)': '#dark.12',
      pressed: '#dark.09',
      disabled: '#clear',
    },
    color: {
      '': '#dark-02',
      hovered: '#dark-02',
      pressed: '#dark',
      disabled: '#dark-04',
    },
    preset: {
      '': 't3m',
      '[data-size="xsmall"]': 't4',
      '[data-size="xlarge"]': 't2m',
      '[data-size="inline"]': 'tag',
    },
    boxSizing: 'border-box',
    textDecoration: 'none',
    transition: 'theme',
    reset: 'button',
    outlineOffset: 1,
    cursor: {
      '': 'default',
      ':is(button) | :is(a)': 'pointer',
      disabled: 'not-allowed',
    },

    $size: {
      '': '$size-md',
      '[data-size="xsmall"]': '$size-xs',
      '[data-size="small"]': '$size-sm',
      '[data-size="medium"]': '$size-md',
      '[data-size="large"]': '$size-lg',
      '[data-size="xlarge"]': '$size-xl',
      '[data-size="inline"]': '1lh',
    },
    '$inline-padding': {
      '': 'max($min-inline-padding, (($size - 1lh - 2bw) / 2 + $inline-compensation))',
      '[data-size="inline"]': '.25x',
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
      $: '>',
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
        '(with-right-icon | with-suffix | with-actions)':
          '$block-padding 0 $block-padding $inline-padding',
        '(with-icon | with-prefix) & (with-right-icon | with-suffix | with-actions)':
          '$block-padding 0',
        'with-description & !with-description-block':
          '$block-padding $inline-padding 0 $inline-padding',
        'with-description & !with-description-block & (with-icon | with-prefix)':
          '$block-padding $inline-padding 0 0',
        'with-description & !with-description-block & (with-right-icon | with-suffix | with-actions)':
          '$block-padding 0 0 $inline-padding',
        'with-description & !with-description-block & (with-icon | with-prefix) & (with-right-icon | with-suffix | with-actions)':
          '$block-padding 0 0 0',
      },
      gridRow: {
        '': 'span 2',
        'with-description': 'span 1',
        'with-description-block': 'span 2',
      },
    },

    Description: {
      $: '>',
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
          '0 ($inline-padding - $inline-compensation + 1bw) $bottom-padding ($inline-padding - $inline-compensation + 1bw)',
        'with-description-block & !with-icon':
          '0 ($inline-padding - $inline-compensation + 1bw) $bottom-padding $inline-padding',
        'with-description-block & !with-right-icon':
          '0 $inline-padding $bottom-padding ($inline-padding - $inline-compensation + 1bw)',
        'with-description-block & !with-right-icon & !with-icon':
          '0 $inline-padding $bottom-padding $inline-padding',
      },

      '$bottom-padding':
        'max($block-padding, (($size - 4x) / 2) + $block-padding)',
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

    Actions: {
      $: '>',
      display: 'flex',
      gap: '1bw',
      placeItems: 'center',
      placeContent: 'stretch',
      placeSelf: 'stretch',
      padding: '0 $side-padding',
      boxSizing: 'border-box',
      height: 'min ($size - 2bw)',
      gridRow: 'span 2',
      width: {
        '': '($actions-width, 0px)',
        'with-actions-content': 'calc-size(max-content, size)',
      },
      transition: 'width $transition ease-out',
      interpolateSize: 'allow-keywords',

      // Size for the action buttons
      '$action-size': 'min(max((2x + 2bw), ($size - 1x - 2bw)), (4x - 2bw))',
      // Side padding for the button
      '$side-padding': '(($size - $action-size - 2bw) / 2)',
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

export function useAutoTooltip({
  tooltip,
  children,
  labelProps,
  isDynamicLabel = false, // if actions are set
}: {
  tooltip: CubeItemProps['tooltip'];
  children: ReactNode;
  labelProps?: Props;
  isDynamicLabel?: boolean;
}) {
  // Determine if auto tooltip is enabled
  // Auto tooltip only works when children is a string (overflow detection needs text)
  const isAutoTooltipEnabled = useMemo(() => {
    if (typeof children !== 'string') return false;

    // Boolean true enables auto overflow detection
    if (tooltip === true) return true;
    if (typeof tooltip === 'object') {
      // If title is provided and auto is explicitly true, enable auto overflow detection
      if (tooltip.title) {
        return tooltip.auto === true;
      }

      // If no title is provided, default to auto=true unless explicitly disabled
      const autoValue = tooltip.auto !== undefined ? tooltip.auto : true;
      return !!autoValue;
    }
    return false;
  }, [tooltip, children]);

  // Track label overflow for auto tooltip (only when enabled)
  const externalLabelRef = (labelProps as any)?.ref;
  const [isLabelOverflowed, setIsLabelOverflowed] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const checkLabelOverflow = useCallback(() => {
    const label = elementRef.current;
    if (!label) {
      setIsLabelOverflowed(false);
      return;
    }

    const hasOverflow = label.scrollWidth > label.clientWidth;
    setIsLabelOverflowed(hasOverflow);
  }, []);

  useEffect(() => {
    if (isAutoTooltipEnabled) {
      checkLabelOverflow();
    }
  }, [isAutoTooltipEnabled, checkLabelOverflow]);

  // Attach ResizeObserver via callback ref to handle DOM node changes
  const handleLabelElementRef = useCallback(
    (element: HTMLElement | null) => {
      // Call external callback ref to notify external refs
      if (externalLabelRef) {
        if (typeof externalLabelRef === 'function') {
          externalLabelRef(element);
        } else {
          (externalLabelRef as any).current = element;
        }
      }

      // Disconnect previous observer
      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect();
        } catch {
          // do nothing
        }
        resizeObserverRef.current = null;
      }

      elementRef.current = element;

      if (element && isAutoTooltipEnabled) {
        // Create a fresh observer to capture the latest callback
        const obs = new ResizeObserver(() => {
          checkLabelOverflow();
        });
        resizeObserverRef.current = obs;
        obs.observe(element);
        // Initial check
        checkLabelOverflow();
      } else {
        setIsLabelOverflowed(false);
      }
    },
    [externalLabelRef, isAutoTooltipEnabled, checkLabelOverflow],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect();
        } catch {
          // do nothing
        }
        resizeObserverRef.current = null;
      }
      elementRef.current = null;
    };
  }, []);

  const finalLabelProps = useMemo(() => {
    const props = {
      ...(labelProps || {}),
    };

    delete props.ref;

    return props;
  }, [labelProps]);

  const renderWithTooltip = useCallback(
    (
      renderElement: (
        tooltipTriggerProps?: HTMLAttributes<HTMLElement>,
        tooltipRef?: RefObject<HTMLElement>,
      ) => ReactNode,
      defaultTooltipPlacement: OverlayProps['placement'],
    ) => {
      // Handle tooltip rendering based on tooltip prop type
      if (tooltip) {
        // String tooltip - simple case
        if (typeof tooltip === 'string') {
          return (
            <TooltipProvider
              placement={defaultTooltipPlacement}
              title={tooltip}
            >
              {(triggerProps, ref) => renderElement(triggerProps, ref)}
            </TooltipProvider>
          );
        }

        // Boolean tooltip - auto tooltip on overflow
        if (tooltip === true) {
          if (
            (children || labelProps) &&
            (isLabelOverflowed || isDynamicLabel)
          ) {
            return (
              <TooltipProvider
                placement={defaultTooltipPlacement}
                title={children}
                isDisabled={!isLabelOverflowed && isDynamicLabel}
              >
                {(triggerProps, ref) => renderElement(triggerProps, ref)}
              </TooltipProvider>
            );
          }
        }

        // Object tooltip - advanced configuration
        if (typeof tooltip === 'object') {
          const { auto, ...tooltipProps } = tooltip;

          // If title is provided and auto is not explicitly true, always show the tooltip
          if (tooltipProps.title && auto !== true) {
            return (
              <TooltipProvider
                placement={defaultTooltipPlacement}
                {...tooltipProps}
              >
                {(triggerProps, ref) => renderElement(triggerProps, ref)}
              </TooltipProvider>
            );
          }

          // If title is provided with auto=true, OR no title but auto behavior enabled
          if (
            (children || labelProps) &&
            (isLabelOverflowed || isDynamicLabel)
          ) {
            return (
              <TooltipProvider
                placement={defaultTooltipPlacement}
                title={tooltipProps.title ?? children}
                isDisabled={
                  !isLabelOverflowed &&
                  isDynamicLabel &&
                  tooltipProps.isDisabled !== true
                }
                {...tooltipProps}
              >
                {(triggerProps, ref) => renderElement(triggerProps, ref)}
              </TooltipProvider>
            );
          }
        }
      }

      return renderElement();
    },
    [tooltip, children, labelProps, isLabelOverflowed],
  );

  return {
    labelRef: handleLabelElementRef,
    labelProps: finalLabelProps,
    isLabelOverflowed,
    isAutoTooltipEnabled,
    hasTooltip: !!tooltip,
    renderWithTooltip,
  };
}

const Item = <T extends HTMLElement = HTMLDivElement>(
  props: CubeItemProps,
  ref: ForwardedRef<T>,
) => {
  let {
    children,
    size = 'medium',
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
    tooltip = true,
    isDisabled,
    style,
    loadingSlot = 'auto',
    isLoading = false,
    isCard = false,
    actions,
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

  const showDescriptions = useMemo(() => {
    const copyProps = { ...descriptionProps };
    delete copyProps.id;
    return !!(description || Object.keys(copyProps).length > 0);
  }, [description, descriptionProps]);

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
          {...(keyboardShortcutProps as any)}
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
      'with-description': showDescriptions,
      'with-description-block':
        showDescriptions && descriptionPlacement === 'block',
      'with-actions': !!actions,
      'with-actions-content': !!(actions && actions !== true),
      checkbox: hasCheckbox,
      disabled: finalIsDisabled,
      selected: isSelected === true,
      loading: isLoading,
      card: isCard === true,
      ...mods,
    };
  }, [
    finalIcon,
    finalRightIcon,
    finalPrefix,
    finalSuffix,
    showDescriptions,
    descriptionPlacement,
    hasCheckbox,
    isSelected,
    isLoading,
    isCard,
    actions,
    mods,
  ]);

  const {
    labelProps: finalLabelProps,
    labelRef,
    renderWithTooltip,
  } = useAutoTooltip({
    tooltip,
    children,
    labelProps,
    isDynamicLabel: !!actions,
  });

  // Create a stable render function that doesn't call hooks
  const renderItemElement = useCallback(
    (
      tooltipTriggerProps?: HTMLAttributes<HTMLElement>,
      tooltipRef?: RefObject<HTMLElement>,
    ) => {
      // Use callback ref to merge multiple refs without calling hooks
      const handleRef = (element: HTMLElement | null) => {
        // Set the component's forwarded ref
        if (typeof ref === 'function') {
          ref(element as T | null);
        } else if (ref) {
          (ref as any).current = element;
        }
        // Set the tooltip ref if provided
        if (tooltipRef) {
          (tooltipRef as any).current = element;
        }
      };

      // Merge custom size style with provided style
      const finalStyle =
        typeof size === 'number'
          ? ({ ...style, '--size': `${size}px` } as any)
          : style;

      return (
        <ItemElement
          ref={handleRef}
          variant={
            theme && type ? (`${theme}.${type}` as ItemVariant) : undefined
          }
          disabled={finalIsDisabled}
          data-size={typeof size === 'number' ? undefined : size}
          data-type={type}
          data-theme={theme}
          aria-disabled={finalIsDisabled}
          aria-selected={isSelected}
          mods={mods}
          styles={styles}
          type={htmlType as any}
          {...mergeProps(rest, tooltipTriggerProps || {})}
          style={finalStyle}
        >
          {finalIcon && (
            <div data-element="Icon">
              {hasCheckbox ? <CheckIcon /> : finalIcon}
            </div>
          )}
          {finalPrefix && <div data-element="Prefix">{finalPrefix}</div>}
          {children || labelProps ? (
            <div data-element="Label" {...finalLabelProps} ref={labelRef}>
              {children}
            </div>
          ) : null}
          {showDescriptions ? (
            <div data-element="Description" {...descriptionProps}>
              {description}
            </div>
          ) : null}
          {finalSuffix && <div data-element="Suffix">{finalSuffix}</div>}
          {finalRightIcon && (
            <div data-element="RightIcon">{finalRightIcon}</div>
          )}
          {actions && (
            <div data-element="Actions" {...ACTIONS_EVENT_HANDLERS}>
              {actions !== true ? (
                <ItemActionProvider type={type} theme={theme}>
                  {actions}
                </ItemActionProvider>
              ) : null}
            </div>
          )}
        </ItemElement>
      );
    },
    [
      ref,
      theme,
      type,
      finalIsDisabled,
      size,
      isSelected,
      mods,
      styles,
      htmlType,
      rest,
      finalIcon,
      hasCheckbox,
      finalPrefix,
      children,
      labelProps,
      finalLabelProps,
      description,
      descriptionProps,
      finalSuffix,
      finalRightIcon,
      actions,
      size,
      style,
    ],
  );

  return renderWithTooltip(renderItemElement, defaultTooltipPlacement);
};

const _Item = Object.assign(forwardRef(Item), {
  Action: ItemAction,
  Badge: ItemBadge,
});

export { _Item as Item };

/**
 * @deprecated Use `Item` instead. This export will be removed in a future version.
 */
export { _Item as ItemBase };
export type { CubeItemProps as CubeItemBaseProps };
