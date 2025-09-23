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

const LINK_PRESS_EVENT = 'Link Press';
const BUTTON_PRESS_EVENT = 'Button Press';

// React Router compatible types
export interface Path {
  pathname: string; // starts with "/"
  search: string; // starts with "?"
  hash: string; // starts with "#"
}

export type To = string | Partial<Path>;
export type NavigateArg = To | number;

export interface CubeUseActionProps<
  T extends TagName = 'a' | 'button' | 'span' | 'div',
> extends AllBaseProps<T>,
    Omit<AriaButtonProps, 'type'> {
  to?: NavigateArg;
  label?: string;
  htmlType?: 'button' | 'submit' | 'reset' | undefined;
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
 * Converts a Path object to a string URL
 */
function pathToString(path: Partial<Path>): string {
  let { pathname = '', search = '', hash = '' } = path;
  if (pathname && !pathname.startsWith('/')) pathname = `/${pathname}`;
  if (search && !search.startsWith('?')) search = `?${search}`;
  if (hash && !hash.startsWith('#')) hash = `#${hash}`;
  return `${pathname}${search}${hash}`;
}

export function parseTo(to: NavigateArg | undefined): {
  newTab: boolean;
  nativeRoute: boolean;
  href: string | undefined;
  isHistoryNavigation: boolean;
  historyDelta?: number;
} {
  // Handle number (history navigation)
  if (typeof to === 'number') {
    return {
      newTab: false,
      nativeRoute: false,
      href: undefined,
      isHistoryNavigation: true,
      historyDelta: to,
    };
  }

  // Handle object path
  if (to && typeof to === 'object') {
    const href = pathToString(to);
    return {
      newTab: false,
      nativeRoute: false,
      href,
      isHistoryNavigation: false,
    };
  }

  // Handle string (existing logic)
  const newTab = to && typeof to === 'string' && to.startsWith('!');
  const nativeRoute = to && typeof to === 'string' && to.startsWith('@');
  const href: string | undefined =
    to && typeof to === 'string'
      ? newTab || nativeRoute
        ? to.slice(1)
        : to
      : undefined;

  return {
    newTab: !!newTab,
    nativeRoute: !!nativeRoute,
    href,
    isHistoryNavigation: false,
  };
}

export function performClickHandler(evt, { router, to, onPress, tracking }) {
  const { newTab, nativeRoute, href, isHistoryNavigation, historyDelta } =
    parseTo(to);
  const element = evt.target;
  const qa = element?.getAttribute('data-qa');

  onPress?.(evt);

  if (!to && to !== 0) {
    // Allow 0 as valid navigation (go to current page)
    tracking.event(BUTTON_PRESS_EVENT, { qa }, element);

    return;
  }

  // Handle history navigation (back/forward)
  if (isHistoryNavigation && typeof historyDelta === 'number') {
    if (router && typeof router.go === 'function') {
      tracking.event(
        LINK_PRESS_EVENT,
        { qa, delta: historyDelta, type: 'router-history' },
        element,
      );
      router.go(historyDelta);
    } else {
      tracking.event(
        LINK_PRESS_EVENT,
        { qa, delta: historyDelta, type: 'native-history' },
        element,
      );
      window.history.go(historyDelta);
    }
    return;
  }

  if (evt.shiftKey || evt.metaKey || newTab) {
    openLink(href, true);

    tracking.event(LINK_PRESS_EVENT, { qa, href, type: 'tab' }, element);

    return;
  }

  if (nativeRoute) {
    openLink(href || window.location.href);
    tracking.event(LINK_PRESS_EVENT, { qa, href, type: 'native' }, element);
  } else if (href && href.startsWith('#')) {
    const id = href.slice(1);
    const element = document.getElementById(id);

    tracking.event(
      LINK_PRESS_EVENT,
      { qa, href, type: 'hash', target: id },
      element,
    );

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });

      return;
    }
  }

  if (router) {
    tracking.event(LINK_PRESS_EVENT, { qa, href, type: 'router' }, element);

    // For object paths, pass the original to value; for strings, use href
    if (typeof to === 'object' && to !== null) {
      // Modern React Router supports object navigation
      if (typeof router.navigate === 'function') {
        router.navigate(to);
      } else {
        // Fallback to push with string href for older routers
        router.push(href);
      }
    } else {
      router.push(href);
    }
  } else if (href) {
    tracking.event(LINK_PRESS_EVENT, { qa, href, type: 'native' }, element);
    window.location.href = href;
  }
}

export const useAction = function useAction(
  { to, as, htmlType, label, mods, onPress, ...props }: CubeUseActionProps,
  ref: FocusableRef<HTMLElement>,
) {
  const tracking = useTracking();
  const router = useContext(UIKitContext).router;
  const isDisabled = props.isDisabled;
  const { newTab, href, isHistoryNavigation } = parseTo(to);

  as = to && !isHistoryNavigation ? 'a' : as || 'button';
  const target = newTab ? '_blank' : undefined;
  const domRef = useFocusableRef(ref);

  const customOnPress = useEvent((evt: PressEvent) => {
    performClickHandler(evt, { router, to, onPress, tracking });
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
