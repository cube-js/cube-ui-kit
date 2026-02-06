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
  DANGER_OUTLINE_STYLES,
  DANGER_PRIMARY_STYLES,
  DANGER_SECONDARY_STYLES,
  DEFAULT_CLEAR_STYLES,
  DEFAULT_NEUTRAL_STYLES,
  DEFAULT_OUTLINE_STYLES,
  DEFAULT_PRIMARY_STYLES,
  DEFAULT_SECONDARY_STYLES,
  ITEM_ACTION_BASE_STYLES,
  NOTE_CLEAR_STYLES,
  NOTE_NEUTRAL_STYLES,
  NOTE_OUTLINE_STYLES,
  NOTE_PRIMARY_STYLES,
  NOTE_SECONDARY_STYLES,
  SPECIAL_CLEAR_STYLES,
  SPECIAL_NEUTRAL_STYLES,
  SPECIAL_OUTLINE_STYLES,
  SPECIAL_PRIMARY_STYLES,
  SPECIAL_SECONDARY_STYLES,
  SUCCESS_CLEAR_STYLES,
  SUCCESS_NEUTRAL_STYLES,
  SUCCESS_OUTLINE_STYLES,
  SUCCESS_PRIMARY_STYLES,
  SUCCESS_SECONDARY_STYLES,
  WARNING_CLEAR_STYLES,
  WARNING_NEUTRAL_STYLES,
  WARNING_OUTLINE_STYLES,
  WARNING_PRIMARY_STYLES,
  WARNING_SECONDARY_STYLES,
} from '../../../data/item-themes';
import { CheckIcon } from '../../../icons/CheckIcon';
import { LoadingIcon } from '../../../icons/LoadingIcon';
import { BaseProps, Styles, tasty } from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { TooltipProvider } from '../../overlays/Tooltip/TooltipProvider';
import { useItemActionContext } from '../ItemActionContext';
import { CubeUseActionProps, useAction } from '../use-action';

export interface CubeItemActionProps
  extends Omit<CubeUseActionProps, 'as' | 'htmlType'>,
    Omit<BaseProps, 'as'> {
  icon?: ReactNode | 'checkbox';
  children?: ReactNode;
  isLoading?: boolean;
  isSelected?: boolean;
  type?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'neutral'
    | 'clear'
    | (string & {});
  theme?:
    | 'default'
    | 'danger'
    | 'success'
    | 'warning'
    | 'note'
    | 'special'
    | (string & {});
  tooltip?:
    | string
    | (Omit<ComponentProps<typeof TooltipProvider>, 'children'> & {
        title?: string;
      });
  styles?: Styles;
  tabIndex?: number;
}

type ItemActionVariant =
  | 'default.primary'
  | 'default.secondary'
  | 'default.outline'
  | 'default.neutral'
  | 'default.clear'
  | 'danger.primary'
  | 'danger.secondary'
  | 'danger.outline'
  | 'danger.neutral'
  | 'danger.clear'
  | 'success.primary'
  | 'success.secondary'
  | 'success.outline'
  | 'success.neutral'
  | 'success.clear'
  | 'warning.primary'
  | 'warning.secondary'
  | 'warning.outline'
  | 'warning.neutral'
  | 'warning.clear'
  | 'note.primary'
  | 'note.secondary'
  | 'note.outline'
  | 'note.neutral'
  | 'note.clear'
  | 'special.primary'
  | 'special.secondary'
  | 'special.outline'
  | 'special.neutral'
  | 'special.clear';

const ItemActionElement = tasty({
  qa: 'ItemAction',
  styles: {
    ...ITEM_ACTION_BASE_STYLES,
    reset: 'button',
    appearance: 'none',
    touchAction: 'manipulation',
    textDecoration: 'none',
    outline: 0,
    outlineOffset: 1,
    cursor: { '': '$pointer', disabled: 'default' },
    padding: {
      '': '0 $inline-padding',
      'has-icon': 0,
      'has-icon & has-label': '0 $inline-padding 0 0',
    },

    '$inline-padding': {
      '': 'max($min-inline-padding, (($action-size - 1lh - 2bw) / 2 + $inline-compensation))',
      'size=inline': '.25x',
    },
    '$inline-compensation': '.5x',
    '$min-inline-padding': '(.5x - 1bw)',
    '$local-icon-size': '$icon-size',

    Icon: {
      $: '>',
      ...(ITEM_ACTION_BASE_STYLES.Icon as Styles),
      '$icon-size': 'min($local-icon-size, ($action-size - .25x))',
    },
  },
  variants: {
    // Default theme
    'default.primary': DEFAULT_PRIMARY_STYLES,
    'default.secondary': DEFAULT_SECONDARY_STYLES,
    'default.outline': DEFAULT_OUTLINE_STYLES,
    'default.neutral': DEFAULT_NEUTRAL_STYLES,
    'default.clear': DEFAULT_CLEAR_STYLES,

    // Danger theme
    'danger.primary': DANGER_PRIMARY_STYLES,
    'danger.secondary': DANGER_SECONDARY_STYLES,
    'danger.outline': DANGER_OUTLINE_STYLES,
    'danger.neutral': DANGER_NEUTRAL_STYLES,
    'danger.clear': DANGER_CLEAR_STYLES,

    // Success theme
    'success.primary': SUCCESS_PRIMARY_STYLES,
    'success.secondary': SUCCESS_SECONDARY_STYLES,
    'success.outline': SUCCESS_OUTLINE_STYLES,
    'success.neutral': SUCCESS_NEUTRAL_STYLES,
    'success.clear': SUCCESS_CLEAR_STYLES,

    // Warning theme
    'warning.primary': WARNING_PRIMARY_STYLES,
    'warning.secondary': WARNING_SECONDARY_STYLES,
    'warning.outline': WARNING_OUTLINE_STYLES,
    'warning.neutral': WARNING_NEUTRAL_STYLES,
    'warning.clear': WARNING_CLEAR_STYLES,

    // Note theme
    'note.primary': NOTE_PRIMARY_STYLES,
    'note.secondary': NOTE_SECONDARY_STYLES,
    'note.outline': NOTE_OUTLINE_STYLES,
    'note.neutral': NOTE_NEUTRAL_STYLES,
    'note.clear': NOTE_CLEAR_STYLES,

    // Special theme
    'special.primary': SPECIAL_PRIMARY_STYLES,
    'special.secondary': SPECIAL_SECONDARY_STYLES,
    'special.outline': SPECIAL_OUTLINE_STYLES,
    'special.neutral': SPECIAL_NEUTRAL_STYLES,
    'special.clear': SPECIAL_CLEAR_STYLES,
  },
});

export const ItemAction = forwardRef(function ItemAction(
  allProps: CubeItemActionProps,
  ref: FocusableRef<HTMLElement>,
) {
  const {
    type: contextType,
    theme: contextTheme,
    disableActionsFocus,
    isDisabled: contextIsDisabled,
  } = useItemActionContext();

  // Note: 'outline' type is only supported when explicitly provided, not from context
  const {
    type = contextType === 'outline' ? 'neutral' : contextType ?? 'neutral',
    theme = contextTheme ?? 'default',
    icon,
    children,
    isLoading = false,
    isSelected = false,
    tooltip,
    mods,
    styles,
    isDisabled: isDisabledProp,
    ...rest
  } = allProps;

  // Inherit disabled state from context, but allow local override
  const isDisabled = isDisabledProp ?? contextIsDisabled;

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
      'has-label': !!children,
      context: !!contextType,
      'has-icon': !!icon,
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
      isDisabled,
      'aria-label': ariaLabel,
      mods: finalMods,
      htmlType: 'button',
    },
    ref,
  );

  // Set tabIndex when in context
  const finalTabIndex = disableActionsFocus ? -1 : rest.tabIndex;

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

  const finalType = useMemo(() => {
    return theme !== 'default' && type === 'neutral' ? 'clear' : type;
  }, [theme, type]);

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
        variant={`${theme}.${finalType}` as ItemActionVariant}
        data-theme={theme}
        data-type={finalType}
        tabIndex={finalTabIndex}
        styles={styles}
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
