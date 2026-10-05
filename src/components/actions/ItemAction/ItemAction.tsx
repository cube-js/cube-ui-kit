import { FocusableRef } from '@react-types/shared';
import { BaseProps, Styles, tasty } from '@tenphi/tasty';
import {
  ComponentProps,
  forwardRef,
  HTMLAttributes,
  ReactNode,
  RefObject,
} from 'react';

import {
  CURRENT_CLEAR_STYLES,
  CURRENT_OUTLINE_STYLES,
  CURRENT_PRIMARY_STYLES,
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
import {
  getDisabledElementProps,
  mergeProps,
  omitActivationEventProps,
} from '../../../utils/react';
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
    | 'current'
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
  // Inherited-color theme — see the CURRENT THEME section of `item-themes`.
  | 'current.primary'
  | 'current.outline'
  | 'current.clear'
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
    // eslint-disable-next-line tasty/no-style-spread -- action base shared with ItemBadge
    ...ITEM_ACTION_BASE_STYLES,
    recipe: 'reset button',
    // Every variant below defines its own ring and overrides this one, which is
    // kept as the floor for a custom `type` that resolves to no variant at all.
    // It uses the same `#primary-accent-text` as every variant in
    // `item-themes.ts`.
    outline: {
      '': '0 #primary-accent-text.0',
      focused: '1bw #primary-accent-text',
    },
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
      // eslint-disable-next-line tasty/no-style-spread -- Icon base shared with ItemBadge
      ...(ITEM_ACTION_BASE_STYLES.Icon as Styles),
      '$icon-size': 'min($local-icon-size, ($action-size - .25x))',
    },
  },
  variants: {
    // Current theme — colors mixed from the inherited `currentcolor`. The
    // default `clear` flavour is borderless, so an action does not put a resting
    // chip on every row.
    'current.primary': CURRENT_PRIMARY_STYLES,
    'current.outline': CURRENT_OUTLINE_STYLES,
    'current.clear': CURRENT_CLEAR_STYLES,

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
    disableActionsFocus,
    isDisabled: contextIsDisabled,
  } = useItemActionContext();

  const {
    // Borderless by default: an action sits inside a row, where a resting chip
    // on every one of them would read as noise.
    type = 'clear',
    // The `current` theme derives every color from the row's inherited
    // `currentcolor`, so one default covers every host type and theme — no need
    // to mirror the row's own `theme` from context. An action that names a theme
    // is asking to paint itself rather than match its host, and gets it.
    theme = 'current',
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

  // Inherit disabled state from context, but allow local override. Loading
  // always disables, as on `Button`: a second press while the first is still
  // running would run the action again, so not even `isDisabled={false}`
  // re-enables a loading action.
  const isDisabled = isLoading || (isDisabledProp ?? contextIsDisabled);

  // The host row is disabled too. The `current` theme paints from the inherited
  // color, which a disabled host has already faded, so fading a second time
  // washes the label out (see `CURRENT_ITEM_STYLES.color`). And like a disabled
  // fieldset, a disabled host leaves its button actions out of the tab order.
  const isDisabledInherited = !!contextIsDisabled && isDisabled;

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
  const finalMods = {
    checkmark: hasCheckmark,
    selected: isSelected,
    loading: isLoading,
    'has-label': !!children,
    context: !!contextType,
    // The spinner takes the icon slot, so it needs the icon's padding.
    'has-icon': !!finalIcon,
    'inherit-disabled': isDisabledInherited,
    ...mods,
  };

  // An explicit label always wins; a tooltip only fills in the accessible name
  // when there isn't one. Rich tooltip content can't serve as a name, so only
  // plain strings are used here.
  const ariaLabel =
    rest['aria-label'] ||
    (typeof tooltip === 'string'
      ? tooltip
      : typeof tooltip === 'object' && typeof tooltip.title === 'string'
        ? tooltip.title
        : undefined);

  // `isDisabled` is dropped from the element: tasty would turn it into the
  // native `disabled` attribute, which `getDisabledElementProps` decides below.
  const {
    actionProps: { isDisabled: _isDisabled, ...actionProps },
  } = useAction(
    {
      ...rest,
      isDisabled,
      'aria-label': ariaLabel,
      mods: finalMods,
      htmlType: 'button',
    },
    ref,
  );

  // Set tabIndex when in context. A loading action keeps focus it already has,
  // but Tab skips it until loading ends, tooltip or not.
  const finalTabIndex = disableActionsFocus || isLoading ? -1 : rest.tabIndex;

  // Extract tooltip content and props
  const tooltipContent =
    typeof tooltip === 'string'
      ? tooltip
      : typeof tooltip === 'object' && tooltip.title
        ? tooltip.title
        : undefined;

  const { title: _title, ...tooltipProps } =
    typeof tooltip === 'object' ? tooltip : {};

  // Only icon-only actions show their tooltip.
  const hasTooltip = !children && !!tooltipContent;

  // Native `disabled` drops focus. A loading action keeps it, so a keyboard
  // press doesn't lose its place. So does an action that disables itself while
  // showing a tooltip, often its only label, which keyboard users reach and read
  // as on `Button`. One whose host is disabled too stays native.
  const { isNativelyDisabled, isInert, inertProps } = getDisabledElementProps({
    isDisabled,
    keepEvents: isLoading || (hasTooltip && !isDisabledInherited),
    as: typeof actionProps.as === 'string' ? actionProps.as : undefined,
  });

  // Without the native attribute, handlers a parent passed in (a `MenuTrigger`'s
  // `onKeyDown`) would still activate the action.
  const elementProps = isInert
    ? omitActivationEventProps(actionProps)
    : actionProps;

  const finalType = type;

  // Render function that accepts tooltip trigger props and ref
  const renderButton = (
    tooltipTriggerProps?: HTMLAttributes<HTMLElement>,
    tooltipRef?: RefObject<HTMLElement>,
  ) => {
    // Merge tooltip ref with actionProps if provided
    const mergedProps = tooltipRef
      ? mergeProps(elementProps, tooltipTriggerProps || {}, inertProps, {
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
      : mergeProps(elementProps, tooltipTriggerProps || {}, inertProps);

    return (
      <ItemActionElement
        {...mergedProps}
        disabled={isNativelyDisabled}
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
  if (hasTooltip) {
    return (
      <TooltipProvider title={tooltipContent} {...tooltipProps}>
        {(triggerProps, tooltipRef) => renderButton(triggerProps, tooltipRef)}
      </TooltipProvider>
    );
  }

  return renderButton();
});

export type { CubeItemActionProps as ItemActionProps };
