import { FocusableRef } from '@react-types/shared';
import { BaseProps, Styles, tasty } from '@tenphi/tasty';
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
  DANGER_OUTLINE_STYLES,
  DANGER_PRIMARY_STYLES,
  DEFAULT_CLEAR_STYLES,
  DEFAULT_OUTLINE_STYLES,
  DEFAULT_PRIMARY_STYLES,
  ITEM_ACTION_BASE_STYLES,
  NOTE_CLEAR_STYLES,
  NOTE_OUTLINE_STYLES,
  NOTE_PRIMARY_STYLES,
  SPECIAL_CLEAR_STYLES,
  SPECIAL_OUTLINE_STYLES,
  SPECIAL_PRIMARY_STYLES,
  SUCCESS_CLEAR_STYLES,
  SUCCESS_OUTLINE_STYLES,
  SUCCESS_PRIMARY_STYLES,
  WARNING_CLEAR_STYLES,
  WARNING_OUTLINE_STYLES,
  WARNING_PRIMARY_STYLES,
} from '../../../data/item-themes';
import { CheckIcon } from '../../../icons/CheckIcon';
import { LoadingIcon } from '../../../icons/LoadingIcon';
import { mergeProps } from '../../../utils/react';
import { TooltipProvider } from '../../overlays/Tooltip/TooltipProvider';
import { useItemActionContext } from '../ItemActionContext';
import { CubeUseActionProps, useAction } from '../use-action';

export interface CubeItemActionProps
  extends Omit<CubeUseActionProps, 'as' | 'htmlType'>,
    Omit<BaseProps, 'as'> {
  icon?: ReactNode | 'checkmark';
  children?: ReactNode;
  isLoading?: boolean;
  isSelected?: boolean;
  type?: 'primary' | 'outline' | 'clear' | (string & {});
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
        title?: ReactNode;
      });
  styles?: Styles;
  tabIndex?: number;
}

type ItemActionVariant =
  | 'default.primary'
  | 'default.outline'
  | 'default.clear'
  | 'danger.primary'
  | 'danger.outline'
  | 'danger.clear'
  | 'success.primary'
  | 'success.outline'
  | 'success.clear'
  | 'warning.primary'
  | 'warning.outline'
  | 'warning.clear'
  | 'note.primary'
  | 'note.outline'
  | 'note.clear'
  | 'special.primary'
  | 'special.outline'
  | 'special.clear';

const ItemActionElement = tasty({
  qa: 'ItemAction',
  styles: {
    ...ITEM_ACTION_BASE_STYLES,
    recipe: 'reset button',
    outlineOffset: 1,
    cursor: { '': '$pointer', disabled: 'default' },
    preset: {
      '': 't4',
      'size=xlarge': 't3m',
    },
    padding: {
      '': '0 $inline-padding',
      'has-icon': 0,
      'has-icon & has-label': '$inline-padding right',
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
    'default.outline': DEFAULT_OUTLINE_STYLES,
    'default.clear': DEFAULT_CLEAR_STYLES,

    // Danger theme
    'danger.primary': DANGER_PRIMARY_STYLES,
    'danger.outline': DANGER_OUTLINE_STYLES,
    'danger.clear': DANGER_CLEAR_STYLES,

    // Success theme
    'success.primary': SUCCESS_PRIMARY_STYLES,
    'success.outline': SUCCESS_OUTLINE_STYLES,
    'success.clear': SUCCESS_CLEAR_STYLES,

    // Warning theme
    'warning.primary': WARNING_PRIMARY_STYLES,
    'warning.outline': WARNING_OUTLINE_STYLES,
    'warning.clear': WARNING_CLEAR_STYLES,

    // Note theme
    'note.primary': NOTE_PRIMARY_STYLES,
    'note.outline': NOTE_OUTLINE_STYLES,
    'note.clear': NOTE_CLEAR_STYLES,

    // Special theme
    'special.primary': SPECIAL_PRIMARY_STYLES,
    'special.outline': SPECIAL_OUTLINE_STYLES,
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

  const {
    type = contextType ?? 'clear',
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

  // Determine if we should show a checkmark
  const hasCheckmark = icon === 'checkmark';

  // Determine final icon (loading takes precedence)
  const finalIcon = isLoading ? (
    <LoadingIcon />
  ) : hasCheckmark ? (
    <CheckIcon />
  ) : (
    icon
  );

  // Build modifiers
  const finalMods = useMemo(
    () => ({
      checkmark: hasCheckmark,
      selected: isSelected,
      loading: isLoading,
      'has-label': !!children,
      context: !!contextType,
      'has-icon': !!icon,
      ...mods,
    }),
    [hasCheckmark, isSelected, isLoading, children, contextType, mods],
  );

  // An explicit label always wins; a tooltip only fills in the accessible name
  // when there isn't one. Rich tooltip content can't serve as a name, so only
  // plain strings are used here.
  const ariaLabel = useMemo(() => {
    if (rest['aria-label']) {
      return rest['aria-label'];
    }
    if (typeof tooltip === 'string') {
      return tooltip;
    }
    if (typeof tooltip === 'object' && typeof tooltip.title === 'string') {
      return tooltip.title;
    }
    return undefined;
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

  const finalType = type;

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
