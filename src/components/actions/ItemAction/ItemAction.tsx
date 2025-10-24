import { FocusableRef } from '@react-types/shared';
import {
  ComponentProps,
  forwardRef,
  HTMLAttributes,
  ReactNode,
  RefObject,
  useMemo,
} from 'react';

import {
  DANGER_CLEAR_STYLES,
  DANGER_NEUTRAL_STYLES,
  DANGER_PRIMARY_STYLES,
  DANGER_SECONDARY_STYLES,
  DEFAULT_CLEAR_STYLES,
  DEFAULT_NEUTRAL_STYLES,
  DEFAULT_PRIMARY_STYLES,
  DEFAULT_SECONDARY_STYLES,
  SPECIAL_CLEAR_STYLES,
  SPECIAL_NEUTRAL_STYLES,
  SPECIAL_PRIMARY_STYLES,
  SPECIAL_SECONDARY_STYLES,
  SUCCESS_CLEAR_STYLES,
  SUCCESS_NEUTRAL_STYLES,
  SUCCESS_PRIMARY_STYLES,
  SUCCESS_SECONDARY_STYLES,
} from '../../../data/item-themes';
import { CheckIcon } from '../../../icons/CheckIcon';
import { LoadingIcon } from '../../../icons/LoadingIcon';
import { tasty } from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { TooltipProvider } from '../../overlays/Tooltip/TooltipProvider';
import { useItemActionContext } from '../ItemActionContext';
import { CubeUseActionProps, useAction } from '../use-action';

export interface CubeItemActionProps
  extends Omit<CubeUseActionProps, 'as' | 'htmlType'> {
  icon?: ReactNode | 'checkbox';
  children?: ReactNode;
  isLoading?: boolean;
  isSelected?: boolean;
  type?: 'primary' | 'secondary' | 'neutral' | 'clear' | (string & {});
  theme?: 'default' | 'danger' | 'success' | 'special' | (string & {});
  tooltip?:
    | string
    | (Omit<ComponentProps<typeof TooltipProvider>, 'children'> & {
        title?: string;
      });
}

type ItemActionVariant =
  | 'default.primary'
  | 'default.secondary'
  | 'default.neutral'
  | 'default.clear'
  | 'danger.primary'
  | 'danger.secondary'
  | 'danger.neutral'
  | 'danger.clear'
  | 'success.primary'
  | 'success.secondary'
  | 'success.neutral'
  | 'success.clear'
  | 'special.primary'
  | 'special.secondary'
  | 'special.neutral'
  | 'special.clear';

const ItemActionElement = tasty({
  qa: 'ItemAction',
  styles: {
    display: 'inline-grid',
    flow: 'column',
    placeItems: 'center',
    placeContent: 'center',
    gap: '.75x',
    position: 'relative',
    margin: {
      '': '0 1bw 0 1bw',
      ':last-child & !:first-child': '0 $side-padding 0 0',
      '!:last-child & :first-child': '0 0 0 $side-padding',
      ':last-child & :first-child': '0 $side-padding',
      context: '0',
    },
    padding: 0,
    reset: 'button',
    outline: 0,
    outlineOffset: 1,
    cursor: { '': 'pointer', disabled: 'default' },
    radius: true,
    transition: 'theme',
    flexShrink: 0,
    textDecoration: 'none',
    boxSizing: 'border-box',
    whiteSpace: 'nowrap',
    border: 0,
    height: '$action-size',
    width: {
      '': '$action-size',
      'with-label': 'auto',
    },
    placeSelf: 'center',

    // Size using custom property
    '$action-size': 'min(max((2x + 2bw), ($size - 1x - 2bw)), (3x - 2bw))',
    // Side padding for the button
    '$side-padding': 'max(min(.5x, (($size - 3x + 2bw) / 2)), 1bw)',

    // Icon styles
    Icon: {
      display: 'grid',
      placeItems: 'center',
      aspectRatio: '1 / 1',
      width: '$action-size',
      opacity: {
        '': 1,
        'checkbox & selected': 1,
        'checkbox & !selected': 0,
        'checkbox & !selected & hovered': 0.4,
      },
    },
  },
  variants: {
    // Default theme
    'default.primary': DEFAULT_PRIMARY_STYLES,
    'default.secondary': DEFAULT_SECONDARY_STYLES,
    'default.neutral': DEFAULT_NEUTRAL_STYLES,
    'default.clear': DEFAULT_CLEAR_STYLES,

    // Danger theme
    'danger.primary': DANGER_PRIMARY_STYLES,
    'danger.secondary': DANGER_SECONDARY_STYLES,
    'danger.neutral': DANGER_NEUTRAL_STYLES,
    'danger.clear': DANGER_CLEAR_STYLES,

    // Success theme
    'success.primary': SUCCESS_PRIMARY_STYLES,
    'success.secondary': SUCCESS_SECONDARY_STYLES,
    'success.neutral': SUCCESS_NEUTRAL_STYLES,
    'success.clear': SUCCESS_CLEAR_STYLES,

    // Special theme
    'special.primary': SPECIAL_PRIMARY_STYLES,
    'special.secondary': SPECIAL_SECONDARY_STYLES,
    'special.neutral': SPECIAL_NEUTRAL_STYLES,
    'special.clear': SPECIAL_CLEAR_STYLES,
  },
});

export const ItemAction = forwardRef(function ItemAction(
  allProps: CubeItemActionProps,
  ref: FocusableRef<HTMLElement>,
) {
  const { type: contextType } = useItemActionContext();

  const {
    type = contextType ?? 'neutral',
    theme = 'default',
    icon,
    children,
    isLoading = false,
    isSelected = false,
    tooltip,
    mods,
    ...rest
  } = allProps;

  // Determine if we should show checkbox
  const hasCheckbox = icon === 'checkbox';

  // Determine final icon (loading takes precedence)
  const finalIcon = isLoading ? (
    <LoadingIcon />
  ) : hasCheckbox ? (
    <CheckIcon />
  ) : (
    icon
  );

  // Build modifiers
  const finalMods = useMemo(
    () => ({
      checkbox: hasCheckbox,
      selected: isSelected,
      loading: isLoading,
      'with-label': !!children,
      context: !!contextType,
      ...mods,
    }),
    [hasCheckbox, isSelected, isLoading, children, contextType, mods],
  );

  // Extract aria-label from tooltip if needed
  const ariaLabel = useMemo(() => {
    if (typeof tooltip === 'string') {
      return tooltip;
    }
    if (typeof tooltip === 'object' && tooltip.title) {
      return tooltip.title;
    }
    return rest['aria-label'];
  }, [tooltip, rest]);

  // Call useAction hook
  const { actionProps } = useAction(
    {
      ...rest,
      'aria-label': ariaLabel,
      mods: finalMods,
      htmlType: 'button',
    },
    ref,
  );

  // Set tabIndex when in context
  const finalTabIndex = contextType ? -1 : undefined;

  // Determine if we should show tooltip (icon-only buttons)
  const showTooltip = !children && tooltip;

  // Extract tooltip content and props
  const tooltipContent = useMemo(() => {
    if (typeof tooltip === 'string') {
      return tooltip;
    }
    if (typeof tooltip === 'object' && tooltip.title) {
      return tooltip.title;
    }
    return undefined;
  }, [tooltip]);

  const tooltipProps = useMemo(() => {
    if (typeof tooltip === 'object') {
      const { title, ...rest } = tooltip;
      return rest;
    }
    return {};
  }, [tooltip]);

  // Render function that accepts tooltip trigger props and ref
  const renderButton = (
    tooltipTriggerProps?: HTMLAttributes<HTMLElement>,
    tooltipRef?: RefObject<HTMLElement>,
  ) => {
    // Merge tooltip ref with actionProps if provided
    const mergedProps = tooltipRef
      ? mergeProps(actionProps, tooltipTriggerProps || {}, {
          ref: (element: HTMLElement | null) => {
            // Set the tooltip ref
            if (tooltipRef) {
              (tooltipRef as any).current = element;
            }
            // Set the action ref if it exists in actionProps
            const actionRef = (actionProps as any).ref;
            if (actionRef) {
              if (typeof actionRef === 'function') {
                actionRef(element);
              } else {
                actionRef.current = element;
              }
            }
          },
        })
      : mergeProps(actionProps, tooltipTriggerProps || {});

    return (
      <ItemActionElement
        {...mergedProps}
        variant={`${theme}.${type}` as ItemActionVariant}
        data-theme={theme}
        data-type={type}
        tabIndex={finalTabIndex}
      >
        {finalIcon && <div data-element="Icon">{finalIcon}</div>}
        {children}
      </ItemActionElement>
    );
  };

  // Wrap with tooltip if needed
  if (showTooltip && tooltipContent) {
    return (
      <TooltipProvider title={tooltipContent} {...tooltipProps}>
        {(triggerProps, tooltipRef) => renderButton(triggerProps, tooltipRef)}
      </TooltipProvider>
    );
  }

  return renderButton();
});

export type { CubeItemActionProps as ItemActionProps };
