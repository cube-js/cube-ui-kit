import { BaseProps, mergeStyles, tasty } from '@tenphi/tasty';
import {
  ComponentProps,
  forwardRef,
  HTMLAttributes,
  ReactNode,
  RefObject,
  useMemo,
} from 'react';

import {
  CURRENT_ITEM_STYLES,
  DANGER_CLEAR_STYLES,
  DANGER_OUTLINE_STYLES,
  DANGER_PRIMARY_STYLES,
  DEFAULT_CLEAR_STYLES,
  DEFAULT_OUTLINE_STYLES,
  DEFAULT_PRIMARY_STYLES,
  ITEM_ACTION_BASE_STYLES,
  SPECIAL_CLEAR_STYLES,
  SPECIAL_OUTLINE_STYLES,
  SPECIAL_PRIMARY_STYLES,
  SUCCESS_CLEAR_STYLES,
  SUCCESS_OUTLINE_STYLES,
  SUCCESS_PRIMARY_STYLES,
} from '../../../data/item-themes';
import { CheckIcon } from '../../../icons/CheckIcon';
import { LoadingIcon } from '../../../icons/LoadingIcon';
import { mergeProps } from '../../../utils/react';
import { useItemActionContext } from '../../actions/ItemActionContext';
import { TooltipProvider } from '../../overlays/Tooltip/TooltipProvider';

export interface CubeItemBadgeProps extends BaseProps {
  icon?: ReactNode | 'checkmark';
  children?: ReactNode;
  isLoading?: boolean;
  isSelected?: boolean;
  type?: 'primary' | 'outline' | 'clear' | 'current' | (string & {});
  theme?: 'default' | 'danger' | 'success' | 'special' | (string & {});
  tooltip?:
    | string
    | (Omit<ComponentProps<typeof TooltipProvider>, 'children'> & {
        title?: ReactNode;
      });
}

type ItemBadgeVariant =
  // Theme-agnostic inherited-color type — see `CURRENT_ITEM_STYLES`.
  | 'default.current'
  | 'default.primary'
  | 'default.outline'
  | 'default.clear'
  | 'danger.primary'
  | 'danger.outline'
  | 'danger.clear'
  | 'success.primary'
  | 'success.outline'
  | 'success.clear'
  | 'special.primary'
  | 'special.outline'
  | 'special.clear';

const ItemBadgeElement = tasty({
  qa: 'ItemBadge',
  styles: mergeStyles(ITEM_ACTION_BASE_STYLES, {
    cursor: 'default',
    border: {
      // extend
      'type=primary': '#clear',
    },
  }),
  variants: {
    // Inherited-color type — theme-agnostic, see `CURRENT_ITEM_STYLES`. Badges
    // inside a row use the borderless item flavour, not the chip.
    'default.current': CURRENT_ITEM_STYLES,

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

    // Special theme
    'special.primary': SPECIAL_PRIMARY_STYLES,
    'special.outline': SPECIAL_OUTLINE_STYLES,
    'special.clear': SPECIAL_CLEAR_STYLES,
  },
});

export const ItemBadge = forwardRef<HTMLDivElement, CubeItemBadgeProps>(
  function ItemBadge(allProps, ref) {
    // `contextType` is read for its presence only — it marks "inside a row",
    // which drives the `context` mod below. The variant no longer depends on it.
    const { type: contextType, theme: contextTheme } = useItemActionContext();

    const {
      // See `ItemAction` for the full rationale: `current` tracks the host
      // through `currentcolor`, so the row's `type` no longer has to be mirrored
      // from context, and only an explicitly *themed* badge falls back to a
      // concrete type. `theme="default"` stays inert.
      type = allProps.theme && allProps.theme !== 'default'
        ? 'clear'
        : 'current',
      theme = contextTheme ?? 'default',
      icon,
      children,
      isLoading = false,
      isSelected = false,
      tooltip,
      mods,
      ...rest
    } = allProps;

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
        ...mods,
      }),
      [hasCheckmark, isSelected, isLoading, children, contextType, mods],
    );

    // An explicit label always wins; a tooltip only fills in the accessible
    // name when there isn't one. Rich tooltip content can't serve as a name, so
    // only plain strings are used here.
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

    // Determine if we should show tooltip (icon-only badges)
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
    const renderBadge = (
      tooltipTriggerProps?: HTMLAttributes<HTMLElement>,
      tooltipRef?: RefObject<HTMLElement>,
    ) => {
      // Merge tooltip ref with component ref if provided
      const handleRef = (element: HTMLDivElement | null) => {
        // Set the component ref
        if (typeof ref === 'function') {
          ref(element);
        } else if (ref) {
          (ref as any).current = element;
        }
        // Set the tooltip ref
        if (tooltipRef) {
          (tooltipRef as any).current = element;
        }
      };

      return (
        <ItemBadgeElement
          ref={handleRef}
          variant={
            // `current` has no per-theme flavours — it is registered once under
            // `default`. `data-theme` still carries the real theme, which is
            // what the ramp in `CURRENT_ITEM_STYLES` keys off.
            `${finalType === 'current' ? 'default' : theme}.${finalType}` as ItemBadgeVariant
          }
          data-theme={theme}
          data-type={finalType}
          aria-label={ariaLabel}
          mods={finalMods}
          {...mergeProps(rest, tooltipTriggerProps || {})}
        >
          {finalIcon && <div data-element="Icon">{finalIcon}</div>}
          {children}
        </ItemBadgeElement>
      );
    };

    // Wrap with tooltip if needed
    if (showTooltip && tooltipContent) {
      return (
        <TooltipProvider title={tooltipContent} {...tooltipProps}>
          {(triggerProps, tooltipRef) => renderBadge(triggerProps, tooltipRef)}
        </TooltipProvider>
      );
    }

    return renderBadge();
  },
);

export type { CubeItemBadgeProps as ItemBadgeProps };
