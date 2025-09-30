import { useFocusableRef } from '@react-spectrum/utils';
import { FocusableRef, PressEvent } from '@react-types/shared';
import { useContext } from 'react';
import { AriaButtonProps, useButton, useHover } from 'react-aria';

import { useEvent } from '../../_internal';
import { UIKitContext } from '../../provider';
import { useTracking } from '../../providers/TrackingProvider';
import { AllBaseProps, filterBaseProps, TagName } from '../../tasty';
import { mergeProps } from '../../utils/react';
import { useFocus } from '../../utils/react/interactions';

// Import specific types for internal usage
import type {
  NavigateArg,
  NavigateOptions,
  Path,
  To,
} from '../../providers/navigation.types';

const LINK_PRESS_EVENT = 'Link Press';
const BUTTON_PRESS_EVENT = 'Button Press';

// Re-export types for convenience
export type {
  NavigateLike,
  Path,
  To,
  NavigateArg,
  NavigateOptions,
  RelativeRoutingType,
} from '../../providers/navigation.types';

export interface CubeUseActionProps<
  T extends TagName = 'a' | 'button' | 'span' | 'div',
> extends AllBaseProps<T>,
    Omit<AriaButtonProps, 'type'> {
  to?: NavigateArg;
  label?: string;
  htmlType?: 'button' | 'submit' | 'reset' | undefined;
  navigationOptions?: NavigateOptions;
}

const FILTER_OPTIONS = { propNames: new Set(['onMouseEnter', 'onMouseLeave']) };

/**
 * Helper to open link.
 * @param {String} href
 * @param {String|Boolean} [target]
 */
export function openLink(href, target?) {
  const link = document.createElement('a');

  link.href = href;

  if (target) {
    link.target = target === true ? '_blank' : target;
    // Prevent reverse tabnabbing when opening in a new tab
    link.rel = 'noopener noreferrer';
  }

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
}

/**
 * Checks if a URL is external (absolute HTTP(S), protocol-relative, or non-http protocols)
 */
function isExternalUrl(url: string): boolean {
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('//') ||
    (url.includes(':') && !url.startsWith('#'))
  );
}

export function parseTo(to: NavigateArg | undefined): {
  newTab: boolean;
  nativeRoute: boolean;
  cleanTo: To | undefined;
  isHistoryNavigation: boolean;
  historyDelta?: number;
  isHashNavigation: boolean;
  isExternal: boolean;
} {
  // Handle number (history navigation)
  if (typeof to === 'number') {
    return {
      newTab: false,
      nativeRoute: false,
      cleanTo: undefined,
      isHistoryNavigation: true,
      historyDelta: to,
      isHashNavigation: false,
      isExternal: false,
    };
  }

  // Handle object path
  if (to && typeof to === 'object') {
    return {
      newTab: false,
      nativeRoute: false,
      cleanTo: to,
      isHistoryNavigation: false,
      isHashNavigation: false,
      isExternal: false,
    };
  }

  // Handle string
  if (!to || typeof to !== 'string') {
    return {
      newTab: false,
      nativeRoute: false,
      cleanTo: undefined,
      isHistoryNavigation: false,
      isHashNavigation: false,
      isExternal: false,
    };
  }

  const newTab = to.startsWith('!');
  const nativeRoute = to.startsWith('@');
  const isHashNavigation = to.startsWith('#');
  const cleanTo = newTab || nativeRoute ? to.slice(1) : to;
  const isExternal = typeof cleanTo === 'string' && isExternalUrl(cleanTo);

  return {
    newTab,
    nativeRoute,
    cleanTo,
    isHistoryNavigation: false,
    isHashNavigation,
    isExternal,
  };
}

function sanitizePressEvent(evt: PressEvent): PressEvent {
  const safeEvt: any = {
    type: (evt as any)?.type,
    pointerType: (evt as any)?.pointerType,
    shiftKey: !!(evt as any)?.shiftKey,
    metaKey: !!(evt as any)?.metaKey,
    ctrlKey: !!(evt as any)?.ctrlKey,
    altKey: !!(evt as any)?.altKey,
  };
  try {
    Object.defineProperty(safeEvt, 'target', {
      value: (evt as any)?.target,
      enumerable: false,
      configurable: true,
    });
  } catch (e) {
    // Failed to define target property - continue without it
  }
  return safeEvt;
}

export function performClickHandler(
  evt,
  { navigate, resolvedHref, to, onPress, tracking, navigationOptions },
) {
  const {
    newTab,
    nativeRoute,
    cleanTo,
    isHistoryNavigation,
    historyDelta,
    isHashNavigation,
    isExternal,
  } = parseTo(to);
  const element = evt.target;
  const qa = element?.getAttribute('data-qa');

  onPress?.(sanitizePressEvent(evt));

  if (to == null) {
    // Allow 0 as valid navigation (go to current page)
    tracking.event(BUTTON_PRESS_EVENT, { qa }, element);
    return;
  }

  // Handle history navigation (back/forward)
  if (isHistoryNavigation && typeof historyDelta === 'number') {
    tracking.event(
      LINK_PRESS_EVENT,
      { qa, delta: historyDelta, type: 'router-history' },
      element,
    );
    navigate(historyDelta);
    return;
  }

  // Handle hash navigation (smooth scroll)
  if (isHashNavigation && typeof to === 'string') {
    const id = to.slice(1);
    const targetElement = document.getElementById(id);

    tracking.event(
      LINK_PRESS_EVENT,
      { qa, href: to, type: 'hash', target: id },
      element,
    );

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    }
    return;
  }

  // Handle new tab (via ! prefix or user modifiers)
  if (evt.shiftKey || evt.metaKey || (evt as any).ctrlKey || newTab) {
    openLink(resolvedHref, true);
    tracking.event(
      LINK_PRESS_EVENT,
      { qa, href: resolvedHref, type: 'tab' },
      element,
    );
    return;
  }

  // Handle @ prefix (native navigation)
  if (nativeRoute) {
    if (cleanTo === '' || cleanTo === undefined) {
      // @'' or @ -> reload current page
      tracking.event(LINK_PRESS_EVENT, { qa, type: 'native' }, element);
      window.location.reload();
    } else {
      // @path -> navigate to resolved path natively
      tracking.event(
        LINK_PRESS_EVENT,
        { qa, href: resolvedHref, type: 'native' },
        element,
      );
      window.location.assign(resolvedHref);
    }
    return;
  }

  // Handle external URLs (always native)
  if (isExternal && typeof cleanTo === 'string') {
    tracking.event(
      LINK_PRESS_EVENT,
      { qa, href: cleanTo, type: 'native' },
      element,
    );
    window.location.assign(cleanTo);
    return;
  }

  // Handle router navigation
  if (cleanTo !== undefined) {
    tracking.event(
      LINK_PRESS_EVENT,
      { qa, href: resolvedHref, type: 'router' },
      element,
    );
    navigate(cleanTo, navigationOptions);
  }
}

export const useAction = function useAction(
  {
    to,
    as,
    htmlType,
    label,
    mods,
    onPress,
    navigationOptions,
    ...props
  }: CubeUseActionProps,
  ref: FocusableRef<HTMLElement>,
) {
  const tracking = useTracking();
  const navigation = useContext(UIKitContext).navigation;
  const isDisabled = props.isDisabled;

  const {
    newTab,
    nativeRoute,
    cleanTo,
    isHistoryNavigation,
    isHashNavigation,
    isExternal,
  } = parseTo(to);

  // Always call navigation hooks (using fallback when to is not provided)
  const fallbackTo = to || '.';
  const navigate = navigation.useNavigate();
  const resolvedHref = navigation.useHref(fallbackTo);
  // Always resolve cleanTo href to avoid conditional hook calls
  const cleanToHref = navigation.useHref(cleanTo || '.');

  // Determine element type: 'a' for navigation, 'button' for actions
  as = to && !isHistoryNavigation ? 'a' : as || 'button';

  // Compute target (prefixes override explicit target prop per spec)
  const target = newTab ? '_blank' : props.target;

  // Compute href for anchor elements
  let href: string | undefined;
  if (as === 'a' && cleanTo !== undefined) {
    if (newTab || nativeRoute) {
      // For ! and @ prefixes, resolve the clean path
      href =
        typeof cleanTo === 'string' && isExternal
          ? cleanTo // External URLs as-is
          : cleanToHref;
    } else {
      // Regular navigation
      href = resolvedHref;
    }
  }

  const domRef = useFocusableRef(ref);

  // Use navigation options directly
  const mergedNavigationOptions = navigationOptions;

  const customOnPress = useEvent((evt: PressEvent) => {
    performClickHandler(evt, {
      navigate,
      resolvedHref: href || resolvedHref,
      to,
      onPress,
      tracking,
      navigationOptions: mergedNavigationOptions,
    });
  });

  let { buttonProps, isPressed } = useButton(
    {
      'aria-label': label,
      ...props,
      onPress: customOnPress,
    },
    domRef,
  );
  let { hoverProps, isHovered } = useHover({ isDisabled });
  let { focusProps, isFocused } = useFocus({ isDisabled }, true);

  const customProps =
    to && !isHistoryNavigation
      ? {
          onClick(evt) {
            evt.preventDefault();
          },
        }
      : {};

  return {
    actionProps: {
      mods: {
        hovered: isHovered && !isDisabled,
        pressed: isPressed && !isDisabled,
        focused: isFocused && !isDisabled,
        disabled: isDisabled,
        ...mods,
      },
      ...(mergeProps(
        buttonProps,
        hoverProps,
        focusProps,
        customProps,
        filterBaseProps(props, FILTER_OPTIONS),
      ) as object),
      ref: domRef,
      type: htmlType || 'button',
      rel: as === 'a' && newTab ? 'noopener noreferrer' : undefined,
      as,
      isDisabled,
      target,
      href,
    },
  };
};
