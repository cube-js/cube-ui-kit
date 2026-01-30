import {
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  isValidElement,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  ReactNode,
  RefObject,
  useMemo,
} from 'react';
import { OverlayProps } from 'react-aria';
import { useHotkeys } from 'react-hotkeys-hook';

import { useWarn } from '../../../_internal/hooks/use-warn';
import {
  DANGER_CARD_STYLES,
  DANGER_CLEAR_STYLES,
  DANGER_ITEM_STYLES,
  DANGER_LINK_STYLES,
  DANGER_NEUTRAL_STYLES,
  DANGER_OUTLINE_STYLES,
  DANGER_PRIMARY_STYLES,
  DANGER_SECONDARY_STYLES,
  DEFAULT_CARD_STYLES,
  DEFAULT_CLEAR_STYLES,
  DEFAULT_ITEM_STYLES,
  DEFAULT_LINK_STYLES,
  DEFAULT_NEUTRAL_STYLES,
  DEFAULT_OUTLINE_STYLES,
  DEFAULT_PRIMARY_STYLES,
  DEFAULT_SECONDARY_STYLES,
  ItemVariant,
  NOTE_CARD_STYLES,
  NOTE_CLEAR_STYLES,
  NOTE_ITEM_STYLES,
  NOTE_LINK_STYLES,
  NOTE_NEUTRAL_STYLES,
  NOTE_OUTLINE_STYLES,
  NOTE_PRIMARY_STYLES,
  NOTE_SECONDARY_STYLES,
  SPECIAL_CLEAR_STYLES,
  SPECIAL_ITEM_STYLES,
  SPECIAL_LINK_STYLES,
  SPECIAL_NEUTRAL_STYLES,
  SPECIAL_OUTLINE_STYLES,
  SPECIAL_PRIMARY_STYLES,
  SPECIAL_SECONDARY_STYLES,
  SUCCESS_CARD_STYLES,
  SUCCESS_CLEAR_STYLES,
  SUCCESS_ITEM_STYLES,
  SUCCESS_LINK_STYLES,
  SUCCESS_NEUTRAL_STYLES,
  SUCCESS_OUTLINE_STYLES,
  SUCCESS_PRIMARY_STYLES,
  SUCCESS_SECONDARY_STYLES,
  WARNING_CARD_STYLES,
  WARNING_CLEAR_STYLES,
  WARNING_ITEM_STYLES,
  WARNING_LINK_STYLES,
  WARNING_NEUTRAL_STYLES,
  WARNING_OUTLINE_STYLES,
  WARNING_PRIMARY_STYLES,
  WARNING_SECONDARY_STYLES,
} from '../../../data/item-themes';
import { CheckIcon } from '../../../icons/CheckIcon';
import { LoadingIcon } from '../../../icons/LoadingIcon';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  Mods,
  Props,
  Styles,
  tasty,
} from '../../../tasty';
import { DynamicIcon, mergeProps, resolveIcon } from '../../../utils/react';
import { ItemAction } from '../../actions/ItemAction';
import { ItemActionProvider } from '../../actions/ItemActionContext';
import { IconSwitch } from '../../helpers/IconSwitch/IconSwitch';
import { CubeTooltipProviderProps } from '../../overlays/Tooltip/TooltipProvider';
import { highlightText } from '../highlightText';
import { HotKeys } from '../HotKeys';
import { ItemBadge } from '../ItemBadge';
import { useAutoTooltip } from '../use-auto-tooltip';

const ITEM_SIZE_VALUES = [
  'xsmall',
  'small',
  'medium',
  'large',
  'xlarge',
  'inline',
] as const;

/** Known modifiers for Item component */
export type ItemMods = Mods<{
  'has-icon'?: boolean;
  'has-start-content'?: boolean;
  'has-end-content'?: boolean;
  'has-right-icon'?: boolean;
  'has-label'?: boolean;
  'has-prefix'?: boolean;
  'has-suffix'?: boolean;
  'has-description'?: boolean;
  'has-actions'?: boolean;
  'has-actions-content'?: boolean;
  'show-actions-on-hover'?: boolean;
  'preserve-actions-space'?: boolean;
  checkbox?: boolean;
  disabled?: boolean;
  selected?: boolean;
  loading?: boolean;
  size?: string;
  description?: string;
  type?: string;
  theme?: string;
  shape?: string;
}>;

export interface CubeItemProps extends BaseProps, ContainerStyleProps {
  icon?: DynamicIcon<ItemMods> | 'checkbox';
  rightIcon?: DynamicIcon<ItemMods>;
  prefix?: ReactNode;
  suffix?: ReactNode;
  description?: ReactNode;
  descriptionPlacement?: 'inline' | 'block';
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
  /**
   * When true, actions are hidden by default and shown only on hover, focus, or focus-within.
   * Uses opacity transition for visual hiding while maintaining layout space.
   */
  showActionsOnHover?: boolean;
  /**
   * When true, preserves the actions width when hidden (only changes opacity).
   * Only applies when showActionsOnHover is true.
   * @default false
   */
  preserveActionsSpace?: boolean;
  /**
   * When true, disables focus on action buttons by setting tabIndex={-1}.
   * @default true
   */
  disableActionsFocus?: boolean;
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
    | 'header'
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'neutral'
    | 'clear'
    | 'link'
    | 'card'
    | (string & {});
  theme?:
    | 'default'
    | 'danger'
    | 'success'
    | 'special'
    | 'warning'
    | 'note'
    | (string & {});
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
   * Shape of the item's border radius.
   * - `card` - Card shape with larger border radius (`1cr`)
   * - `button` - Button shape with default border radius (default)
   * - `sharp` - Sharp corners with no border radius (`0`)
   * - `pill` - Pill shape with fully rounded ends (`round`)
   * @default "button"
   */
  shape?: 'card' | 'button' | 'sharp' | 'pill';
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
  /**
   * Heading level for the Label element when type="header" or type="card".
   * Changes the Label's HTML tag to the corresponding heading (h1-h6).
   * @default 3
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * String to highlight within children.
   * Only works when children is a plain string.
   */
  highlight?: string;
  /**
   * Whether highlight matching is case-sensitive.
   * @default false
   */
  highlightCaseSensitive?: boolean;
  /**
   * Custom styles for highlighted text.
   */
  highlightStyles?: Styles;
  /**
   * Variant of the item.
   */
  variant?: ItemVariant;
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
};

const ADDITION_STYLES: Styles = {
  $: '>',
  display: 'grid',
  flow: 'column',
  placeItems: 'center',
  placeContent: 'stretch',
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
  as: 'div',
  styles: {
    display: 'inline-grid',
    flow: 'column dense',
    gap: 0,
    outline: 0,
    placeItems: 'stretch',
    placeContent: 'stretch',
    gridTemplate: {
      '': '"icon prefix label suffix rightIcon actions" auto "icon prefix label suffix rightIcon actions" auto / max-content max-content 1sf max-content max-content max-content',
      'description=inline':
        '"icon prefix description suffix rightIcon actions" auto / max-content max-content 1sf max-content max-content max-content',
      'description=inline & has-label':
        '"icon prefix label suffix rightIcon actions" auto "icon prefix description suffix rightIcon actions" auto / max-content max-content 1sf max-content max-content max-content',
      'description=block':
        '"icon prefix label suffix rightIcon actions" auto "description description description description description description" auto / max-content max-content 1sf max-content max-content max-content',
    },
    // Prevent items from shrinking inside vertical flex layouts (Menu, ListBox, etc)
    flexShrink: {
      '': 'initial',
      'menuitem | listboxitem': 0,
    },
    position: 'relative',
    padding: {
      '': 0,
      'type=card': '.5x',
    },
    margin: 0,
    radius: {
      '': true,
      'shape=card': '1cr',
      'shape=button': true,
      'shape=sharp': '0',
      'shape=pill': 'round',
    },
    height: {
      '': 'min $size',
      'size=inline': '(1lh + 2bw)',
    },
    width: {
      '': 'min $size',
      'has-icon & has-right-icon': 'min ($size * 2)',
      'size=inline': 'min (1lh + 2bw)',
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
      '': 't3',
      '!type=item': 't3m',
      'size=xsmall': 't4',
      'size=xlarge': 't2',
      'size=inline': 'inline',
      '!type=item & (size=medium | size=small | size=large)': 't3m',
      '!type=item & size=xlarge': 't2m',
      '(type=header | type=card) & (size=xsmall | size=small | size=medium)':
        'h6',
      '(type=header | type=card) & size=large': 'h5',
      '(type=header | type=card) & size=xlarge': 'h4',
    },
    boxSizing: 'border-box',
    textDecoration: 'none',
    transition: 'theme',
    reset: 'button',
    outlineOffset: 1,
    cursor: {
      '': 'inherit',
      ':is(a)': 'pointer',
      ':is(button) | listboxitem | menuitem': '$pointer',
      disabled: 'not-allowed',
    },

    $size: {
      '': '$size-md',
      'size=xsmall': '$size-xs',
      'size=small': '$size-sm',
      'size=medium': '$size-md',
      'size=large': '$size-lg',
      'size=xlarge': '$size-xl',
      'size=inline': '(1lh + 2bw)',
    },
    '$inline-padding':
      'max($min-inline-padding, (($size - 1lh - 2bw) / 2 + $inline-compensation))',
    '$block-padding': {
      '': '.5x',
      'size=xsmall | size=small': '.25x',
      'size=inline': 0,
    },
    '$inline-compensation': '.5x',
    '$min-inline-padding': '(1x - 1bw)',

    '$label-padding-left': {
      '': '$inline-padding',
      'has-start-content': '0',
    },
    '$label-padding-right': {
      '': '$inline-padding',
      'has-end-content': '0',
      // Restore padding when actions are hidden AND no other visible end content
      'has-actions & !has-suffix & !has-right-icon & (show-actions-on-hover | !has-actions-content) & !preserve-actions-space & !:hover & !:focus & !:focus-within':
        '$inline-padding',
    },
    '$label-padding-bottom': {
      '': '$block-padding',
      'description=inline': '0',
    },
    '$description-padding-left': {
      '': '$inline-padding',
      'has-start-content': 0,
      'description=block': '($inline-padding - $inline-compensation + 1bw)',
      'description=block & !has-start-content': '$inline-padding',
    },
    '$description-padding-right': {
      '': '$inline-padding',
      'has-end-content': 0,
      'description=block': '($inline-padding - $inline-compensation + 1bw)',
      'description=block & !has-end-content': '$inline-padding',
    },
    '$description-padding-bottom': {
      '': 0,
      'has-label & description=inline': '$block-padding',
      'has-label & description=block':
        'max($block-padding, (($size - 4x) / 2) + $block-padding)',
    },

    Icon: { ...DEFAULT_ICON_STYLES, gridArea: 'icon' },

    RightIcon: { ...DEFAULT_ICON_STYLES, gridArea: 'rightIcon' },

    Label: {
      $: '>',
      margin: 0,
      gridArea: 'label',
      display: 'block',
      placeSelf: 'center start',
      boxSizing: 'border-box',
      placeContent: 'stretch',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      width: '0 100%',
      preset: 'inherit',
      padding:
        '$block-padding $label-padding-right $label-padding-bottom $label-padding-left',
    },

    Description: {
      $: '>',
      gridArea: 'description',
      preset: {
        '': 't4',
        'type=card | type=header': 't3',
      },
      placeSelf: 'center start',
      boxSizing: 'border-box',
      color: 'inherit',
      opacity: {
        '': 0.75,
        'type=card | type=header': 1,
      },
      overflow: 'hidden',
      whiteSpace: {
        '': 'nowrap',
        'type=card | type=header': 'normal',
      },
      textOverflow: 'ellipsis',
      maxWidth: '100%',
      textAlign: 'left',
      padding:
        '0 $description-padding-right $description-padding-bottom $description-padding-left',
    },

    Prefix: {
      ...ADDITION_STYLES,
      gridArea: 'prefix',
      padding: {
        '': '$inline-padding left',
        'has-icon': 0,
      },
    },

    Suffix: {
      ...ADDITION_STYLES,
      gridArea: 'suffix',
      padding: {
        '': '$inline-padding right',
        'has-right-icon': 0,
      },
    },

    Actions: {
      $: '>',
      gridArea: 'actions',
      display: 'flex',
      gap: '1bw',
      placeItems: 'center',
      placeContent: 'end',
      placeSelf: 'stretch',
      padding: {
        '': '0 $side-padding',
        'has-actions & (show-actions-on-hover | !has-actions-content) & !preserve-actions-space & !:hover & !:focus & !:focus-within':
          '0',
      },
      boxSizing: 'border-box',
      height: 'min ($size - 2bw)',
      width: {
        '': 'fixed ($actions-width, 0px)',
        'has-actions-content & !show-actions-on-hover':
          'max calc-size(max-content, size)',
        'has-actions-content & show-actions-on-hover & !preserve-actions-space':
          'max 0px',
        'has-actions-content & show-actions-on-hover & !preserve-actions-space & (:hover | :focus | :focus-within)':
          'max calc-size(max-content, size)',
        'has-actions-content & show-actions-on-hover & preserve-actions-space':
          'max calc-size(max-content, size)',
      },
      opacity: {
        '': 1,
        'show-actions-on-hover': 0,
        'show-actions-on-hover & (active | :has([data-pressed]) | :hover | :focus | :focus-within)': 1,
      },
      transition:
        'width $transition ease-out, opacity $transition ease-out, padding $transition ease-out',
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
    'default.card': DEFAULT_CARD_STYLES,
    // Danger theme
    'danger.primary': DANGER_PRIMARY_STYLES,
    'danger.secondary': DANGER_SECONDARY_STYLES,
    'danger.outline': DANGER_OUTLINE_STYLES,
    'danger.neutral': DANGER_NEUTRAL_STYLES,
    'danger.clear': DANGER_CLEAR_STYLES,
    'danger.link': DANGER_LINK_STYLES,
    'danger.item': DANGER_ITEM_STYLES,
    'danger.card': DANGER_CARD_STYLES,
    // Success theme
    'success.primary': SUCCESS_PRIMARY_STYLES,
    'success.secondary': SUCCESS_SECONDARY_STYLES,
    'success.outline': SUCCESS_OUTLINE_STYLES,
    'success.neutral': SUCCESS_NEUTRAL_STYLES,
    'success.clear': SUCCESS_CLEAR_STYLES,
    'success.link': SUCCESS_LINK_STYLES,
    'success.item': SUCCESS_ITEM_STYLES,
    'success.card': SUCCESS_CARD_STYLES,
    // Warning theme
    'warning.primary': WARNING_PRIMARY_STYLES,
    'warning.secondary': WARNING_SECONDARY_STYLES,
    'warning.outline': WARNING_OUTLINE_STYLES,
    'warning.neutral': WARNING_NEUTRAL_STYLES,
    'warning.clear': WARNING_CLEAR_STYLES,
    'warning.link': WARNING_LINK_STYLES,
    'warning.item': WARNING_ITEM_STYLES,
    'warning.card': WARNING_CARD_STYLES,
    // Note theme
    'note.primary': NOTE_PRIMARY_STYLES,
    'note.secondary': NOTE_SECONDARY_STYLES,
    'note.outline': NOTE_OUTLINE_STYLES,
    'note.neutral': NOTE_NEUTRAL_STYLES,
    'note.clear': NOTE_CLEAR_STYLES,
    'note.link': NOTE_LINK_STYLES,
    'note.item': NOTE_ITEM_STYLES,
    'note.card': NOTE_CARD_STYLES,
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
    icon: iconProp,
    rightIcon: rightIconProp,
    prefix,
    suffix,
    description,
    descriptionPlacement,
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
    actions,
    showActionsOnHover = false,
    preserveActionsSpace = false,
    disableActionsFocus = false,
    shape,
    defaultTooltipPlacement = 'top',
    level = 3,
    highlight,
    highlightCaseSensitive = false,
    highlightStyles,
    ...rest
  } = props;

  // Determine if Label will be rendered
  const hasLabel = !!(children || labelProps);

  // Set default descriptionPlacement based on type
  // For card/header types, use 'block' only when Label is rendered
  const finalDescriptionPlacement =
    descriptionPlacement ??
    ((type === 'card' || type === 'header') && hasLabel ? 'block' : 'inline');

  // Set default shape based on type
  const finalShape = shape ?? (type === 'card' ? 'card' : 'button');

  // Loading state makes the component disabled
  const finalIsDisabled =
    isDisabled === true || (isLoading && isDisabled !== false);

  // Validate type+theme combinations
  const STANDARD_THEMES = [
    'default',
    'success',
    'danger',
    'warning',
    'note',
    'special',
  ];
  const CARD_THEMES = ['default', 'success', 'danger', 'warning', 'note'];
  const HEADER_THEMES = ['default'];

  const isInvalidCombination =
    (type === 'header' && !HEADER_THEMES.includes(theme)) ||
    (type === 'card' && !CARD_THEMES.includes(theme)) ||
    (!['header', 'card'].includes(type) && !STANDARD_THEMES.includes(theme));

  useWarn(isInvalidCombination, {
    key: ['Item', 'invalid-type-theme', type, theme],
    args: [
      `Item: Invalid type+theme combination. type="${type}" does not support theme="${theme}".` +
        (type === 'header'
          ? ' The "header" type only supports theme: default.'
          : type === 'card'
            ? ' The "card" type only supports themes: default, success, danger, warning, note.'
            : ' Standard types support themes: default, success, danger, warning, note, special.'),
    ],
  });

  // Warn if link type is used with icons or loading state
  const hasLinkWithIcons = type === 'link' && (iconProp || rightIconProp);
  const hasLinkWithLoading = type === 'link' && isLoading;
  const hasLinkRestrictions = hasLinkWithIcons || hasLinkWithLoading;

  const linkRestrictionMessages: string[] = [];
  if (hasLinkWithIcons) {
    linkRestrictionMessages.push('icons (`icon` or `rightIcon` props)');
  }
  if (hasLinkWithLoading) {
    linkRestrictionMessages.push('loading state (`isLoading` prop)');
  }

  useWarn(hasLinkRestrictions, {
    key: ['Item', 'link-restrictions'],
    args: [
      `Item: The "link" type does not support ${linkRestrictionMessages.join(' or ')}. Remove these props when using type="link".`,
    ],
  });

  // Determine if we should show checkbox instead of icon
  const hasCheckbox = iconProp === 'checkbox';

  // Determine if size is custom (number or unrecognized string)
  const isCustomSize =
    typeof size === 'number' ||
    !(ITEM_SIZE_VALUES as readonly string[]).includes(size);
  const sizeTokenValue =
    typeof size === 'number' ? `${size}px` : isCustomSize ? size : undefined;

  // Base mods for icon resolution (without icon-dependent mods)
  const baseMods = useMemo<ItemMods>(
    () => ({
      disabled: finalIsDisabled,
      selected: isSelected === true,
      loading: isLoading,
      ...(!isCustomSize && { size: size as string }),
      type,
      theme,
      shape: finalShape,
      ...mods,
    }),
    [
      finalIsDisabled,
      isSelected,
      isLoading,
      size,
      isCustomSize,
      type,
      theme,
      finalShape,
      mods,
    ],
  );

  // Resolve dynamic icon props (skip resolution for 'checkbox' special value)
  const resolvedIcon = useMemo(() => {
    if (hasCheckbox) {
      return { content: null, hasSlot: true };
    }
    return resolveIcon(iconProp as DynamicIcon<ItemMods>, baseMods);
  }, [iconProp, baseMods, hasCheckbox]);

  const resolvedRightIcon = useMemo(
    () => resolveIcon(rightIconProp, baseMods),
    [rightIconProp, baseMods],
  );

  // Determine which slot to use for loading when "auto" is selected
  // Must be computed before hasIconSlot/hasRightIconSlot since they depend on it
  const resolvedLoadingSlot = useMemo(() => {
    if (loadingSlot !== 'auto') return loadingSlot;

    // Auto logic: prefer icon if present, then rightIcon, fallback to icon
    if (resolvedRightIcon.hasSlot && !resolvedIcon.hasSlot) return 'rightIcon';
    return 'icon'; // fallback
  }, [loadingSlot, resolvedIcon.hasSlot, resolvedRightIcon.hasSlot]);

  // Determine if icon slots should render (original slot OR loading state targets this slot)
  const hasIconSlot =
    resolvedIcon.hasSlot || (isLoading && resolvedLoadingSlot === 'icon');
  const hasRightIconSlot =
    resolvedRightIcon.hasSlot ||
    (isLoading && resolvedLoadingSlot === 'rightIcon');

  const showDescription = useMemo(() => {
    const copyProps = { ...descriptionProps };
    delete copyProps.id;
    return !!(description || Object.keys(copyProps).length > 0);
  }, [description, descriptionProps]);

  // Apply loading state to appropriate slots
  const finalIcon =
    isLoading && resolvedLoadingSlot === 'icon' ? (
      <LoadingIcon />
    ) : (
      resolvedIcon.content
    );
  const finalRightIcon =
    isLoading && resolvedLoadingSlot === 'rightIcon' ? (
      <LoadingIcon />
    ) : (
      resolvedRightIcon.content
    );

  // Generate stable keys for icon transitions based on icon type
  const iconKey = hasCheckbox
    ? 'checkbox'
    : isLoading && resolvedLoadingSlot === 'icon'
      ? 'loading'
      : isValidElement(finalIcon)
        ? (finalIcon.type as any)?.displayName ||
          (finalIcon.type as any)?.name ||
          'icon'
        : finalIcon
          ? 'icon'
          : 'empty';

  const rightIconKey =
    isLoading && resolvedLoadingSlot === 'rightIcon'
      ? 'loading'
      : isValidElement(finalRightIcon)
        ? (finalRightIcon.type as any)?.displayName ||
          (finalRightIcon.type as any)?.name ||
          'icon'
        : finalRightIcon
          ? 'icon'
          : 'empty';
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

  const finalMods = useMemo<ItemMods>(() => {
    return {
      ...baseMods,
      'has-icon': hasIconSlot,
      'has-start-content': !!(hasIconSlot || finalPrefix),
      'has-end-content': !!(hasRightIconSlot || finalSuffix || actions),
      'has-right-icon': hasRightIconSlot,
      'has-label': hasLabel,
      'has-prefix': !!finalPrefix,
      'has-suffix': !!finalSuffix,
      'has-description': showDescription,
      'has-actions': !!actions,
      'has-actions-content': !!(actions && actions !== true),
      'show-actions-on-hover': showActionsOnHover === true,
      'preserve-actions-space': preserveActionsSpace === true,
      checkbox: hasCheckbox,
      description: showDescription ? finalDescriptionPlacement : 'none',
    };
  }, [
    baseMods,
    hasIconSlot,
    hasRightIconSlot,
    finalPrefix,
    finalSuffix,
    showDescription,
    finalDescriptionPlacement,
    hasCheckbox,
    actions,
    showActionsOnHover,
    preserveActionsSpace,
    hasLabel,
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

  // Process children with highlight if applicable
  const processedChildren = useMemo(() => {
    if (typeof children === 'string' && highlight) {
      return highlightText(
        children,
        highlight,
        highlightCaseSensitive,
        highlightStyles,
      );
    }
    return children;
  }, [children, highlight, highlightCaseSensitive, highlightStyles]);

  // Render function that creates the item element
  const renderItemElement = (
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

    return (
      <ItemElement
        ref={handleRef}
        variant={
          theme && type
            ? (`${type === 'header' ? 'default' : theme}.${type === 'header' ? 'item' : type}` as ItemVariant)
            : undefined
        }
        disabled={finalIsDisabled}
        aria-disabled={finalIsDisabled}
        aria-selected={isSelected}
        mods={finalMods}
        styles={styles}
        tokens={sizeTokenValue ? { $size: sizeTokenValue } : undefined}
        type={htmlType as any}
        {...mergeProps(rest, tooltipTriggerProps || {})}
        style={style}
      >
        {hasIconSlot && (
          <div data-element="Icon">
            <IconSwitch noWrapper contentKey={iconKey}>
              {hasCheckbox ? <CheckIcon /> : finalIcon}
            </IconSwitch>
          </div>
        )}
        {finalPrefix && <div data-element="Prefix">{finalPrefix}</div>}
        {children || labelProps
          ? (() => {
              const LabelTag =
                type === 'header' || type === 'card'
                  ? (`h${level}` as const)
                  : 'div';
              return (
                <LabelTag
                  data-element="Label"
                  {...finalLabelProps}
                  ref={labelRef}
                >
                  {processedChildren}
                </LabelTag>
              );
            })()
          : null}
        {showDescription ? (
          <div data-element="Description" {...descriptionProps}>
            {description}
          </div>
        ) : null}
        {finalSuffix && <div data-element="Suffix">{finalSuffix}</div>}
        {hasRightIconSlot && (
          <div data-element="RightIcon">
            <IconSwitch noWrapper contentKey={rightIconKey}>
              {finalRightIcon}
            </IconSwitch>
          </div>
        )}
        {actions && (
          <div data-element="Actions" {...ACTIONS_EVENT_HANDLERS}>
            {actions !== true ? (
              <ItemActionProvider
                type={type}
                theme={theme}
                disableActionsFocus={disableActionsFocus}
                isDisabled={finalIsDisabled}
              >
                {actions}
              </ItemActionProvider>
            ) : null}
          </div>
        )}
      </ItemElement>
    );
  };

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
