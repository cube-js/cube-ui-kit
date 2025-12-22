import { FocusableRef } from '@react-types/shared';
import {
  Children,
  forwardRef,
  HTMLAttributes,
  isValidElement,
  ReactNode,
  RefObject,
  useMemo,
  useState,
} from 'react';
import { OverlayProps } from 'react-aria';

import { useIsFirstRender } from '../../../_internal/hooks/use-is-first-render';
import { useWarn } from '../../../_internal/hooks/use-warn';
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
  Mods,
  Styles,
  tasty,
  TEXT_STYLES,
} from '../../../tasty';
import { DynamicIcon, mergeProps, resolveIcon } from '../../../utils/react';
import { useAutoTooltip } from '../../content/use-auto-tooltip';
import { DisplayTransition } from '../../helpers/DisplayTransition';
import { IconSwitch } from '../../helpers/IconSwitch/IconSwitch';
import { CubeTooltipProviderProps } from '../../overlays/Tooltip/TooltipProvider';
import { CubeActionProps } from '../Action/Action';
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
    | 'secondary'
    | 'danger'
    | 'link'
    | 'clear'
    | 'outline'
    | 'neutral'
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

export const DEFAULT_BUTTON_STYLES = {
  display: 'inline-grid',
  flow: 'column dense',
  gap: 0,
  placeItems: {
    '': 'stretch',
    'raw-children': 'center stretch',
  },
  placeContent: 'center',
  position: 'relative',
  margin: 0,
  boxSizing: 'border-box',
  cursor: {
    '': 'default',
    ':is(a)': 'pointer',
    ':is(button)': '$pointer',
    disabled: 'not-allowed',
  },
  preset: {
    '': 't3m',
    'size=xsmall': 't4',
    'size=xlarge': 't2m',
  },
  textDecoration: 'none',
  reset: 'button',
  outline: 0,
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
    maxWidth: '100%',
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
    size: sizeProp,
    label,
    children,
    theme = 'default',
    icon: iconProp,
    rightIcon: rightIconProp,
    mods,
    download,
    tooltip = true,
    defaultTooltipPlacement = 'top',
    ...props
  } = allProps;

  const size = sizeProp ?? (type === 'link' ? 'inline' : 'medium');

  const isDisabled = props.isDisabled ?? props.isLoading;
  const isLoading = props.isLoading;
  const isSelected = props.isSelected;

  // Base mods for icon resolution (without icon-dependent mods)
  const baseMods = useMemo<ButtonMods>(
    () => ({
      loading: isLoading,
      selected: isSelected,
      ...mods,
    }),
    [isLoading, isSelected, mods],
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

  const { actionProps } = useAction(
    { ...allProps, isDisabled, mods: modifiers, ...(label ? { label } : {}) },
    ref,
  );

  const styles = extractStyles(props, STYLE_PROPS);
  const isDisabledElement = actionProps.isDisabled;

  delete actionProps.isDisabled;

  const {
    labelProps: finalLabelProps,
    labelRef,
    renderWithTooltip,
  } = useAutoTooltip({
    tooltip,
    children,
    labelProps: undefined,
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
    };

    // Determine if size is custom (number or unrecognized string)
    const isCustomSize =
      typeof size === 'number' ||
      (size != null &&
        !(BUTTON_SIZE_VALUES as readonly string[]).includes(size));
    const sizeTokenValue =
      typeof size === 'number' ? `${size}px` : isCustomSize ? size : undefined;

    return (
      <ButtonElement
        download={download}
        {...mergeProps(actionProps, tooltipTriggerProps || {})}
        ref={handleRef}
        disabled={isDisabledElement}
        variant={`${theme}.${type ?? 'outline'}` as ButtonVariant}
        data-theme={theme}
        data-type={type ?? 'outline'}
        data-size={size}
        styles={styles}
        tokens={sizeTokenValue ? { $size: sizeTokenValue } : undefined}
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
