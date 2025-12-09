import { FocusableRef } from '@react-types/shared';
import {
  forwardRef,
  HTMLAttributes,
  ReactElement,
  ReactNode,
  RefObject,
  useMemo,
} from 'react';
import { OverlayProps } from 'react-aria';

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
  Styles,
  tasty,
  TEXT_STYLES,
} from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { useAutoTooltip } from '../../content/use-auto-tooltip';
import { CubeTooltipProviderProps } from '../../overlays/Tooltip/TooltipProvider';
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
  display: 'grid',
  placeItems: 'center',
  placeContent: 'stretch',
  aspectRatio: '1 / 1',
  width: '($size - 2bw)',
};

export const DEFAULT_BUTTON_STYLES = {
  display: 'inline-grid',
  flow: 'column dense',
  gap: 0,
  gridTemplate: {
    '': '"icon label rightIcon" auto / max-content 1sf max-content',
    'raw-children': 'initial',
  },
  placeItems: {
    '': 'stretch',
    'raw-children': 'center stretch',
  },
  placeContent: 'center stretch',
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
  transition: 'theme',
  reset: 'button',
  outline: 0,
  outlineOffset: 1,
  padding: {
    '': 0,
    'raw-children':
      '$block-padding $label-padding-right $block-padding $label-padding-left',
    'raw-children & type=link': 0,
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

  $size: {
    '': '$size-md',
    'size=xsmall': '$size-xs',
    'size=small': '$size-sm',
    'size=medium': '$size-md',
    'size=large': '$size-lg',
    'size=xlarge': '$size-xl',
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
  '$label-padding-left': {
    '': '$inline-padding',
    'has-icon': 0,
  },
  '$label-padding-right': {
    '': '$inline-padding',
    'has-right-icon': 0,
  },

  // Icon sub-element (recommended format)
  Icon: {
    ...DEFAULT_ICON_STYLES,
    gridArea: 'icon',
  },

  // RightIcon sub-element (recommended format)
  RightIcon: {
    ...DEFAULT_ICON_STYLES,
    gridArea: 'rightIcon',
  },

  // Label sub-element (recommended format)
  Label: {
    $: '>',
    gridArea: 'label',
    display: 'block',
    placeSelf: 'center stretch',
    boxSizing: 'border-box',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
    textAlign: 'center',
    padding: {
      '': '$block-padding $label-padding-right $block-padding $label-padding-left',
      'type=link': 0,
    },
  },

  // ButtonIcon sub-element (backward compatibility)
  ButtonIcon: {
    width: 'min 1fs',
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
    tooltip = true,
    defaultTooltipPlacement = 'top',
    ...props
  } = allProps;

  const isDisabled = props.isDisabled || props.isLoading;
  const isLoading = props.isLoading;
  const isSelected = props.isSelected;

  children = children || icon || rightIcon ? children : label;

  const specifiedLabel =
    label ?? props['aria-label'] ?? props['aria-labelledby'];

  // Warn about accessibility issues when button has no accessible label
  useWarn(!children && icon && !specifiedLabel, {
    key: ['button-icon-no-label', !!icon],
    args: [
      'accessibility issue:',
      'If you provide `icon` property for a Button and do not provide any children then you should specify the `aria-label` property to make sure the Button element stays accessible.',
    ],
  });

  useWarn(!children && !icon && !specifiedLabel, {
    key: ['button-no-content-no-label', !!icon],
    args: [
      'accessibility issue:',
      'If you provide no children for a Button then you should specify the `aria-label` property to make sure the Button element stays accessible.',
    ],
  });

  if (!children && !specifiedLabel) {
    label = 'Unnamed'; // fix to avoid warning in production
  }

  const hasLeftIcon = !!icon || isLoading;
  const hasChildren = children != null;
  const singleIcon = !!(
    ((hasLeftIcon && !rightIcon) || (rightIcon && !hasLeftIcon)) &&
    !hasChildren
  );

  const hasIcons = hasLeftIcon || !!rightIcon;
  const rawChildren = !!(
    hasChildren &&
    typeof children !== 'string' &&
    !hasIcons
  );

  const modifiers = useMemo(
    () => ({
      loading: isLoading,
      selected: isSelected,
      'has-icons': hasIcons,
      'has-icon': hasLeftIcon,
      'has-right-icon': !!rightIcon,
      'single-icon': singleIcon,
      'text-only': !!(hasChildren && typeof children === 'string' && !hasIcons),
      'raw-children': rawChildren,
      ...mods,
    }),
    [
      mods,
      children,
      icon,
      rightIcon,
      isLoading,
      isSelected,
      singleIcon,
      hasIcons,
      rawChildren,
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

    return (
      <ButtonElement
        download={download}
        {...mergeProps(actionProps, tooltipTriggerProps || {})}
        ref={handleRef}
        disabled={isDisabledElement}
        variant={`${theme}.${type ?? 'outline'}` as ButtonVariant}
        data-theme={theme}
        data-type={type ?? 'outline'}
        data-size={size ?? 'medium'}
        styles={styles}
      >
        {(icon || isLoading) && (
          <div data-element="Icon">{isLoading ? <LoadingIcon /> : icon}</div>
        )}
        {hasChildren &&
          (rawChildren ? (
            children
          ) : (
            <div data-element="Label" {...finalLabelProps} ref={labelRef}>
              {children}
            </div>
          ))}
        {rightIcon && <div data-element="RightIcon">{rightIcon}</div>}
      </ButtonElement>
    );
  };

  return renderWithTooltip(renderButtonElement, defaultTooltipPlacement);
});
