import { FocusableRef, PressEvent } from '@react-types/shared';
import {
  CONTAINER_STYLES,
  Mods,
  Styles,
  tasty,
  TEXT_STYLES,
} from '@tenphi/tasty';
import {
  Children,
  forwardRef,
  HTMLAttributes,
  isValidElement,
  ReactNode,
  RefObject,
  useMemo,
  useRef,
  useState,
} from 'react';
import { OverlayProps } from 'react-aria';

import { useEvent } from '../../../_internal';
import { useIsFirstRender } from '../../../_internal/hooks/use-is-first-render';
import { useWarn } from '../../../_internal/hooks/use-warn';
import {
  DANGER_CLEAR_STYLES,
  DANGER_LINK_STYLES,
  DANGER_OUTLINE_2_STYLES,
  DANGER_OUTLINE_STYLES,
  DANGER_PRIMARY_STYLES,
  DEFAULT_CLEAR_STYLES,
  DEFAULT_LINK_STYLES,
  DEFAULT_OUTLINE_2_STYLES,
  DEFAULT_OUTLINE_STYLES,
  DEFAULT_PRIMARY_STYLES,
  NOTE_CLEAR_STYLES,
  NOTE_LINK_STYLES,
  NOTE_OUTLINE_2_STYLES,
  NOTE_OUTLINE_STYLES,
  NOTE_PRIMARY_STYLES,
  SPECIAL_CLEAR_STYLES,
  SPECIAL_LINK_STYLES,
  SPECIAL_OUTLINE_STYLES,
  SPECIAL_PRIMARY_STYLES,
  SUCCESS_CLEAR_STYLES,
  SUCCESS_LINK_STYLES,
  SUCCESS_OUTLINE_2_STYLES,
  SUCCESS_OUTLINE_STYLES,
  SUCCESS_PRIMARY_STYLES,
  WARNING_CLEAR_STYLES,
  WARNING_LINK_STYLES,
  WARNING_OUTLINE_2_STYLES,
  WARNING_OUTLINE_STYLES,
  WARNING_PRIMARY_STYLES,
} from '../../../data/item-themes';
import { LoadingIcon } from '../../../icons';
import {
  DynamicIcon,
  getDisabledElementProps,
  mergeProps,
  resolveIcon,
  useDismissParentPopover,
} from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';
import { useAutoTooltip } from '../../content/use-auto-tooltip';
import { DisplayTransition } from '../../helpers/DisplayTransition';
import { IconSwitch } from '../../helpers/IconSwitch/IconSwitch';
import { CubeTooltipProviderProps } from '../../overlays/Tooltip/TooltipProvider';
import { CubeActionProps } from '../Action/Action';
import { useButtonSplitContext } from '../ButtonSplit/context';
import { useAction } from '../use-action';

const BUTTON_SIZE_VALUES = [
  'xsmall',
  'small',
  'medium',
  'large',
  'xlarge',
  'inline',
] as const;

/** Known modifiers for Button component */
export type ButtonMods = Mods<{
  pressed?: boolean;
  loading?: boolean;
  selected?: boolean;
  'has-icons'?: boolean;
  'has-icon'?: boolean;
  'has-right-icon'?: boolean;
  'single-icon'?: boolean;
  'text-only'?: boolean;
  'raw-children'?: boolean;
}>;

export interface CubeButtonProps extends CubeActionProps {
  icon?: DynamicIcon<ButtonMods>;
  rightIcon?: DynamicIcon<ButtonMods>;
  isLoading?: boolean;
  isSelected?: boolean;
  type?:
    | 'primary'
    | 'danger'
    | 'link'
    | 'clear'
    | 'outline'
    | 'outline-2'
    | (string & {});
  size?:
    | 'xsmall'
    | 'small'
    | 'medium'
    | 'large'
    | 'xlarge'
    | 'inline'
    | number
    | (string & {});
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
   * @private
   * Default tooltip placement for the button.
   * @default "top"
   */
  defaultTooltipPlacement?: OverlayProps['placement'];
}

export type ButtonVariant =
  | 'default.primary'
  | 'default.outline'
  | 'default.outline-2'
  | 'default.clear'
  | 'default.link'
  | 'danger.primary'
  | 'danger.outline'
  | 'danger.outline-2'
  | 'danger.clear'
  | 'danger.link'
  | 'success.primary'
  | 'success.outline'
  | 'success.outline-2'
  | 'success.clear'
  | 'success.link'
  | 'warning.primary'
  | 'warning.outline'
  | 'warning.outline-2'
  | 'warning.clear'
  | 'warning.link'
  | 'note.primary'
  | 'note.outline'
  | 'note.outline-2'
  | 'note.clear'
  | 'note.link'
  | 'special.primary'
  | 'special.outline'
  | 'special.clear'
  | 'special.link';

const STYLE_PROPS = [...CONTAINER_STYLES, ...TEXT_STYLES];

const DEFAULT_ICON_STYLES: Styles = {
  $: '>',
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  placeContent: 'center',
  placeSelf: 'stretch',
  // overflow: 'hidden',
  width: 'fixed ($size - 2bw)',
  height: 'fixed ($size - 2bw)',
  pointerEvents: 'none',
  transition: 'theme, width, height, translate',
};

export const DEFAULT_BUTTON_STYLES: Styles = {
  recipe: 'reset button',
  display: 'inline-grid',
  flow: 'column dense',
  gap: 0,
  placeItems: {
    '': 'stretch',
    'raw-children': 'center stretch',
  },
  placeContent: 'center',
  position: 'relative',
  preset: {
    '': 't3m',
    'size=xsmall': 't4',
    'size=xlarge': 't2m',
    'type=link': 'strong',
  },
  outlineOffset: 1,
  padding: {
    '': 0,
    'raw-children & !has-icons':
      '$block-padding $inline-padding $block-padding $inline-padding',
    'type=link': '0',
  },
  width: {
    '': 'min $size',
    'has-icon & has-right-icon': 'min ($size * 2 - 2bw)',
    'single-icon': 'fixed $size',
    'type=link': 'min 1ch',
  },
  height: {
    '': 'fixed $size',
    'type=link': 'initial',
  },
  whiteSpace: 'nowrap',
  radius: {
    '': true,
    'type=link & !focused': 0,
    '@parent(button-split, >) & !:last-child': '1r left',
    '@parent(button-split, >) & !:first-child': '1r right',
    '@parent(button-split, >) & !:first-child & !:last-child': 0,
  },
  margin: {
    '': 0,
    '@parent(button-split, >) & !:first-child & (type=outline | type=outline-2 | type=primary)':
      '-1bw left',
  },
  zIndex: {
    '@parent(button-split, >) & :hover': 1,
    '@parent(button-split, >) & :focus-visible': 2,
  },
  transition: 'theme, grid-template, padding',
  verticalAlign: 'bottom',

  $size: {
    '': '$size-md',
    'size=xsmall': '$size-xs',
    'size=small': '$size-sm',
    'size=medium': '$size-md',
    'size=large': '$size-lg',
    'size=xlarge': '$size-xl',
    'size=inline': '(1lh + 2bw)',
  },
  '$inline-padding': {
    '': 'max($min-inline-padding, (($size - 1lh - 2bw) / 2 + $inline-compensation))',
  },
  '$block-padding': {
    '': '.5x',
    'size=xsmall | size=small': '.25x',
  },
  '$inline-compensation': '.5x',
  '$min-inline-padding': '(1x - 1bw)',
  '$left-padding': {
    '': '$inline-padding',
    'is-icon-shown': '0px',
  },
  '$right-padding': {
    '': '$inline-padding',
    'is-right-icon-shown': '0px',
  },

  // Icon sub-element (recommended format)
  Icon: {
    ...DEFAULT_ICON_STYLES,
    width: {
      '': 'fixed 0px',
      'is-icon-shown': 'fixed ($size - 2bw)',
    },
    opacity: {
      '': 0,
      'is-icon-shown': 1,
    },
    translate: {
      '': '($size * 1 / 4) 0',
      'is-icon-shown': '0 0',
    },
  },

  // RightIcon sub-element (recommended format)
  RightIcon: {
    ...DEFAULT_ICON_STYLES,
    width: {
      '': 'fixed 0px',
      'is-right-icon-shown': 'fixed ($size - 2bw)',
    },
    opacity: {
      '': 0,
      'is-right-icon-shown': 1,
    },
    translate: {
      '': '($size * -1 / 4) 0',
      'is-right-icon-shown': '0 0',
    },
  },

  // Label sub-element (recommended format)
  Label: {
    $: '>',
    display: 'block',
    placeSelf: 'center stretch',
    boxSizing: 'border-box',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '0 100%',
    textAlign: 'center',
    transition: 'theme, padding',
    padding: {
      '': '$block-padding $right-padding $block-padding $left-padding',
      'type=link': '0',
    },
  },
} as const;

const ButtonElement = tasty({
  qa: 'Button',
  styles: DEFAULT_BUTTON_STYLES,
  variants: {
    // Default theme
    'default.primary': DEFAULT_PRIMARY_STYLES,
    'default.outline': DEFAULT_OUTLINE_STYLES,
    'default.outline-2': DEFAULT_OUTLINE_2_STYLES,
    'default.clear': DEFAULT_CLEAR_STYLES,
    'default.link': DEFAULT_LINK_STYLES,

    // Danger theme
    'danger.primary': DANGER_PRIMARY_STYLES,
    'danger.outline': DANGER_OUTLINE_STYLES,
    'danger.outline-2': DANGER_OUTLINE_2_STYLES,
    'danger.clear': DANGER_CLEAR_STYLES,
    'danger.link': DANGER_LINK_STYLES,

    // Success theme
    'success.primary': SUCCESS_PRIMARY_STYLES,
    'success.outline': SUCCESS_OUTLINE_STYLES,
    'success.outline-2': SUCCESS_OUTLINE_2_STYLES,
    'success.clear': SUCCESS_CLEAR_STYLES,
    'success.link': SUCCESS_LINK_STYLES,

    // Warning theme
    'warning.primary': WARNING_PRIMARY_STYLES,
    'warning.outline': WARNING_OUTLINE_STYLES,
    'warning.outline-2': WARNING_OUTLINE_2_STYLES,
    'warning.clear': WARNING_CLEAR_STYLES,
    'warning.link': WARNING_LINK_STYLES,

    // Note theme
    'note.primary': NOTE_PRIMARY_STYLES,
    'note.outline': NOTE_OUTLINE_STYLES,
    'note.outline-2': NOTE_OUTLINE_2_STYLES,
    'note.clear': NOTE_CLEAR_STYLES,
    'note.link': NOTE_LINK_STYLES,

    // Special theme
    'special.primary': SPECIAL_PRIMARY_STYLES,
    'special.outline': SPECIAL_OUTLINE_STYLES,
    'special.clear': SPECIAL_CLEAR_STYLES,
    'special.link': SPECIAL_LINK_STYLES,
  },
});

export const Button = forwardRef(function Button(
  allProps: CubeButtonProps,
  ref: FocusableRef<HTMLElement>,
) {
  const splitContext = useButtonSplitContext();

  let {
    type,
    size: sizeProp,
    label,
    children,
    theme = splitContext?.theme ?? 'default',
    icon: iconProp,
    rightIcon: rightIconProp,
    mods,
    download,
    tooltip = true,
    defaultTooltipPlacement = 'top',
    onPress: userOnPress,
    tokens,
    ...props
  } = allProps;

  type = type ?? splitContext?.type;
  const size =
    sizeProp ?? splitContext?.size ?? (type === 'link' ? 'inline' : 'medium');

  const isDisabled =
    splitContext?.isDisabled || props.isDisabled || props.isLoading;
  const isLoading = props.isLoading;
  const isSelected = props.isSelected;

  // Default: pressing a Button inside an open popover closes that popover.
  // Opt-outs (handled inline below):
  //   - `data-popover-trigger` (auto, applied by MenuTrigger/DialogTrigger
  //     type='popover' so triggers don't dismiss the popover they live in)
  //   - `data-popover-keep` on self or any ancestor (manual opt-out for
  //     toggles, custom inline editors, etc.)
  // Modals/trays don't subscribe at all, so this is a no-op there.
  const dismissParentPopover = useDismissParentPopover();
  const buttonElementRef = useRef<HTMLElement | null>(null);

  const wrappedOnPress = useEvent((e: PressEvent) => {
    userOnPress?.(e);
    const el = buttonElementRef.current;
    if (!el) return;
    if (el.hasAttribute('data-popover-trigger')) return;
    if (el.closest('[data-popover-keep]')) return;
    dismissParentPopover(el);
  });

  const { actionProps, isPressed } = useAction(
    {
      ...allProps,
      isDisabled,
      onPress: wrappedOnPress,
      ...(label ? { label } : {}),
    },
    ref,
  );

  const styles = extractStyles(props, STYLE_PROPS);
  const isDisabledElement = actionProps.isDisabled;

  delete actionProps.isDisabled;

  // Base mods for icon resolution (without icon-dependent mods)
  const baseMods = useMemo<ButtonMods>(
    () => ({
      pressed: isPressed && !isDisabled,
      loading: isLoading,
      selected: isSelected,
      ...mods,
    }),
    [isPressed, isDisabled, isLoading, isSelected, mods],
  );

  // Resolve dynamic icon props
  const resolvedIcon = useMemo(
    () => resolveIcon(iconProp, baseMods),
    [iconProp, baseMods],
  );
  const resolvedRightIcon = useMemo(
    () => resolveIcon(rightIconProp, baseMods),
    [rightIconProp, baseMods],
  );

  const hasLeftSlot = resolvedIcon.hasSlot;
  const hasRightSlot = resolvedRightIcon.hasSlot;

  const icon: ReactNode = resolvedIcon.content;
  const rightIcon: ReactNode = resolvedRightIcon.content;

  // Generate stable keys for icon transitions based on icon type
  const iconKey = isLoading
    ? 'loading'
    : isValidElement(icon)
      ? (icon.type as any)?.displayName || (icon.type as any)?.name || 'icon'
      : icon
        ? 'icon'
        : 'empty';

  const rightIconKey = isValidElement(rightIcon)
    ? (rightIcon.type as any)?.displayName ||
      (rightIcon.type as any)?.name ||
      'icon'
    : rightIcon
      ? 'icon'
      : 'empty';

  children = children || hasLeftSlot || hasRightSlot ? children : label;

  const specifiedLabel =
    label ?? props['aria-label'] ?? props['aria-labelledby'];

  // Warn about accessibility issues when button has no accessible label
  useWarn(!children && hasLeftSlot && !specifiedLabel, {
    key: ['button-icon-no-label', hasLeftSlot],
    args: [
      'accessibility issue:',
      'If you provide `icon` property for a Button and do not provide any children then you should specify the `aria-label` property to make sure the Button element stays accessible.',
    ],
  });

  useWarn(!children && !hasLeftSlot && !specifiedLabel, {
    key: ['button-no-content-no-label', hasLeftSlot],
    args: [
      'accessibility issue:',
      'If you provide no children for a Button then you should specify the `aria-label` property to make sure the Button element stays accessible.',
    ],
  });

  if (!children && !specifiedLabel) {
    label = 'Unnamed'; // fix to avoid warning in production
  }

  const hasLeftIcon = !!(hasLeftSlot || isLoading);
  const hasChildren = children != null;
  const singleIcon = !!(
    ((hasLeftIcon && !hasRightSlot) || (hasRightSlot && !hasLeftIcon)) &&
    !hasChildren
  );

  const hasIcons = hasLeftIcon || hasRightSlot;
  const rawChildren = !!(
    hasChildren &&
    typeof children !== 'string' &&
    !Children.toArray(children).some((child) => typeof child === 'string')
  );

  const [isIconShown, setIsIconShown] = useState(hasLeftIcon);
  const [isRightIconShown, setIsRightIconShown] = useState(hasRightSlot);
  const isFirstRender = useIsFirstRender();

  const modifiers = useMemo<ButtonMods>(
    () => ({
      ...baseMods,
      'has-icons': hasIcons,
      'has-icon': hasLeftIcon,
      'is-icon-shown': isIconShown,
      'has-right-icon': hasRightSlot,
      'is-right-icon-shown': isRightIconShown,
      'single-icon': singleIcon,
      'text-only': !!(hasChildren && typeof children === 'string' && !hasIcons),
      'raw-children': rawChildren,
      'has-content': children != null,
    }),
    [
      baseMods,
      children,
      hasLeftIcon,
      hasRightSlot,
      singleIcon,
      hasIcons,
      hasChildren,
      rawChildren,
      isIconShown,
      isRightIconShown,
    ],
  );

  const {
    labelProps: finalLabelProps,
    labelRef,
    renderWithTooltip,
    isTooltipActive,
  } = useAutoTooltip({
    tooltip,
    children,
    labelProps: undefined,
  });

  // A disabled button still has to be able to show its tooltip — that is
  // usually where the reason for being unavailable is written. The native
  // `disabled` attribute would make the browser drop the hover that opens it,
  // so when a tooltip is present the button is marked `aria-disabled` and kept
  // inert instead. The attribute is skipped for links too, where it is not
  // valid markup and `aria-disabled` is the only thing announcing the state.
  const { isNativelyDisabled, inertProps } = getDisabledElementProps({
    isDisabled: isDisabledElement,
    keepEvents: isTooltipActive,
    as: typeof actionProps.as === 'string' ? actionProps.as : undefined,
  });

  // Render function that creates the button element
  const renderButtonElement = (
    tooltipTriggerProps?: HTMLAttributes<HTMLElement>,
    tooltipRef?: RefObject<HTMLElement>,
  ): ReactNode => {
    // Use callback ref to merge multiple refs without calling hooks
    const handleRef = (element: HTMLElement | null) => {
      // Set the component's forwarded ref from useAction
      const domRef = actionProps.ref as any;
      if (typeof domRef === 'function') {
        domRef(element);
      } else if (domRef) {
        domRef.current = element;
      }
      // Set the tooltip ref if provided
      if (tooltipRef) {
        (tooltipRef as any).current = element;
      }
      // Track the rendered DOM node so the dismiss wrapper around `onPress`
      // can read it synchronously without coupling to `useAction`'s ref shape.
      buttonElementRef.current = element;
    };

    // Determine if size is custom (number or unrecognized string)
    const isCustomSize =
      typeof size === 'number' ||
      (size != null &&
        !(BUTTON_SIZE_VALUES as readonly string[]).includes(size));
    const sizeTokenValue =
      typeof size === 'number' ? `${size}px` : isCustomSize ? size : undefined;

    // The `special` theme has no `outline-2` variant (it paints over
    // `#special-surface`, not `#surface-2`/`#surface-3`); fall back to
    // `outline` so the button still renders.
    const effectiveType =
      theme === 'special' && type === 'outline-2' ? 'outline' : type;

    return (
      <ButtonElement
        download={download}
        {...mergeProps(actionProps, tooltipTriggerProps || {}, inertProps)}
        ref={handleRef}
        mods={{ ...actionProps.mods, ...modifiers }}
        disabled={isNativelyDisabled}
        variant={`${theme}.${effectiveType ?? 'outline'}` as ButtonVariant}
        data-theme={theme}
        data-type={effectiveType ?? 'outline'}
        data-size={size}
        data-popover-dismiss=""
        styles={styles}
        tokens={{
          ...tokens,
          ...(sizeTokenValue ? { $size: sizeTokenValue } : {}),
        }}
      >
        <DisplayTransition
          isShown={hasLeftIcon}
          animateOnMount={!isFirstRender}
          onToggle={setIsIconShown}
        >
          {({ ref }) => (
            <div ref={ref} data-element="Icon" aria-hidden="true">
              <IconSwitch noWrapper contentKey={iconKey}>
                {isLoading ? <LoadingIcon /> : icon}
              </IconSwitch>
            </div>
          )}
        </DisplayTransition>
        {hasChildren &&
          (rawChildren ? (
            children
          ) : (
            <div data-element="Label" {...finalLabelProps} ref={labelRef}>
              {children}
            </div>
          ))}
        <DisplayTransition
          isShown={hasRightSlot}
          animateOnMount={!isFirstRender}
          onToggle={setIsRightIconShown}
        >
          {({ ref }) => (
            <div ref={ref} data-element="RightIcon" aria-hidden="true">
              <IconSwitch noWrapper contentKey={rightIconKey}>
                {rightIcon}
              </IconSwitch>
            </div>
          )}
        </DisplayTransition>
      </ButtonElement>
    );
  };

  return renderWithTooltip(renderButtonElement, defaultTooltipPlacement);
});
