import { MouseEventHandler, useCallback, useContext } from 'react';
import { useHover } from '@react-aria/interactions';
import { useButton } from '@react-aria/button';
import { AriaButtonProps } from '@react-types/button';
import { useFocusableRef } from '@react-spectrum/utils';
import { FocusableRef } from '@react-types/shared';

import { UIKitContext } from '../../provider';
import { mergeProps } from '../../utils/react';
import { useFocus } from '../../utils/react/interactions';
import { BaseProps, filterBaseProps, TagNameProps } from '../../tasty';

export interface CubeUseActionProps
  extends BaseProps,
    TagNameProps,
    Omit<AriaButtonProps, 'type'> {
  to?: string;
  label?: string;
  htmlType?: 'button' | 'submit' | 'reset' | undefined;
  onClick?: MouseEventHandler;
  onMouseEnter?: MouseEventHandler;
  onMouseLeave?: MouseEventHandler;
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
  }

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
}

export function parseTo(to): {
  newTab: boolean;
  nativeRoute: boolean;
  href: string | undefined;
} {
  const newTab = to && typeof to === 'string' && to.startsWith('!');
  const nativeRoute = to && typeof to === 'string' && to.startsWith('@');
  const href: string | undefined =
    to && typeof to === 'string'
      ? newTab || nativeRoute
        ? to.slice(1)
        : to
      : undefined;

  return {
    newTab,
    nativeRoute,
    href,
  };
}

export function performClickHandler(evt, router, to, onPress) {
  const { newTab, nativeRoute, href } = parseTo(to);

  onPress?.(evt);

  if (!to) return;

  if (evt.shiftKey || evt.metaKey || newTab) {
    openLink(href, true);

    return;
  }

  if (nativeRoute) {
    openLink(href || window.location.href);
  } else if (href && href.startsWith('#')) {
    const id = href.slice(1);
    const element = document.getElementById(id);

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
    router.push(href);
  } else if (href) {
    window.location.href = href;
  }
}

export const useAction = function useAction(
  { to, as, htmlType, label, mods, onPress, ...props }: CubeUseActionProps,
  ref: FocusableRef<HTMLElement>,
) {
  as = to ? 'a' : as || 'button';

  const router = useContext(UIKitContext).router;
  const isDisabled = props.isDisabled;
  const { newTab, href } = parseTo(to);
  const target = newTab ? '_blank' : undefined;
  const domRef = useFocusableRef(ref);

  const customOnPress = useCallback(
    (evt) => {
      performClickHandler(evt, router, to, onPress);
    },
    [router, to, onPress],
  );

  let { buttonProps, isPressed } = useButton(
    {
      ...props,
      onPress: customOnPress,
    },
    domRef,
  );
  let { hoverProps, isHovered } = useHover({ isDisabled });
  let { focusProps, isFocused } = useFocus({ isDisabled }, true);

  const customProps = to
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
      'aria-label': label,
      ref: domRef,
      type: htmlType || 'button',
      rel: as === 'a' && newTab ? 'rel="noopener noreferrer"' : undefined,
      as,
      isDisabled,
      target,
      href,
    },
  };
};
