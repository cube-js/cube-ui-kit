import { BaseProps, mergeStyles, tasty } from '@tenphi/tasty';
import {
  ComponentProps,
  forwardRef,
  HTMLAttributes,
  ReactNode,
  RefObject,
  useMemo,
} from 'react';

import { useDeprecationWarning } from '../../../_internal';
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
  type?: 'primary' | 'outline' | 'clear' | (string & {});
  theme?:
    | 'current'
    | 'default'
    | 'danger'
    | 'success'
    | 'special'
    | (string & {});
  tooltip?:
    | string
    | (Omit<ComponentProps<typeof TooltipProvider>, 'children'> & {
        title?: ReactNode;
      });
}

type ItemBadgeVariant =
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
    // Current theme — colors mixed from the inherited `currentcolor`. The
    // default `clear` flavour is borderless, so a badge does not put a resting
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

    // Special theme
    'special.primary': SPECIAL_PRIMARY_STYLES,
    'special.outline': SPECIAL_OUTLINE_STYLES,
    'special.clear': SPECIAL_CLEAR_STYLES,
  },
});

export const ItemBadge = forwardRef<HTMLDivElement, CubeItemBadgeProps>(
  function ItemBadge(allProps, ref) {
    // `contextType` is read for its presence only — it marks "inside a row",
    // which drives the `context` mod below. `contextTheme` names the surface the
    // badge is painted on, which the `current` ramp reads. Neither one picks the
    // variant any more.
    const { type: contextType, theme: contextTheme } = useItemActionContext();

    let {
      // See `ItemAction` for the full rationale: the `current` theme tracks the
      // host through `currentcolor`, so neither the row's `type` nor its `theme`
      // has to be mirrored from context, and a badge that names a theme is
      // asking to paint itself rather than match its host.
      type = 'clear',
      theme = 'current',
      icon,
      children,
      isLoading = false,
      isSelected = false,
      tooltip,
      mods,
      ...rest
    } = allProps;

    // `current` moved from the `type` axis to the `theme` axis. The old spelling
    // still renders — mapped to the flavour it used to be, the borderless
    // `clear` one — and warns.
    const isLegacyCurrentType = type === 'current';

    useDeprecationWarning(!isLegacyCurrentType, {
      property: 'type="current"',
      name: 'ItemBadge',
      betterAlternative: 'theme="current"',
      reason:
        '`current` is a color source rather than a shape, so it now lives on the `theme` axis and composes with every `type`. It is already the default theme, so `type="current"` can simply be dropped.',
    });

    if (isLegacyCurrentType) {
      type = 'clear';
      theme = 'current';
    }

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
          variant={`${theme}.${finalType}` as ItemBadgeVariant}
          data-theme={theme}
          data-type={finalType}
          // The surface this badge is painted ON, which is a different question
          // from its own theme now that `current` occupies that axis. The
          // `current` ramp reads it to pick the alphas that work over the
          // special theme's fixed dark-purple surface.
          data-surface={contextTheme}
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
