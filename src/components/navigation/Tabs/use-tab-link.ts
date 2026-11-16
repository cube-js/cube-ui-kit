import { shouldClientNavigate } from '@react-aria/utils';

import { isExternalUrl } from '../../../providers/navigation-url';
import { useNavigation } from '../../../providers/use-navigation';
import { parseTo } from '../../actions/use-action';

import type { KeyboardEvent, MouseEvent } from 'react';
import type { To } from '../../../providers/navigation.types';

/**
 * The link half of a tab with `to`, built from the same pieces as a `Button`'s
 * `to`: the anchor attributes, with the href the app's navigation adapter
 * resolves, and handlers to merge after React Aria's: one routes the click
 * React Aria opens the link with. Nothing for a tab that isn't a link.
 */
export function useTabLink(
  to: To | undefined,
  { isLink, isDisabled }: { isLink: boolean; isDisabled: boolean },
) {
  const { cleanTo, newTab, nativeRoute } = parseTo(to);
  const isExternal = typeof cleanTo === 'string' && isExternalUrl(cleanTo);
  const { navigate, resolvedHref, isDefault } = useNavigation(
    isExternal ? '.' : cleanTo || '.',
  );

  if (!isLink) return undefined;

  // React Aria opens a link tab by clicking its anchor: the one click it does
  // not cancel. A plain same-origin click goes through the app's router. A
  // modified click, a new-tab, native or external destination, or an app with
  // no router keeps the browser's default.
  const onClick = (e: MouseEvent<HTMLElement>) => {
    const anchor = e.currentTarget;

    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      !(anchor instanceof HTMLAnchorElement) ||
      !anchor.hasAttribute('href') ||
      cleanTo === undefined ||
      isDefault ||
      nativeRoute ||
      isExternal ||
      !shouldClientNavigate(anchor, e)
    ) {
      return;
    }

    e.preventDefault();
    navigate(cleanTo);
  };

  // Space activates a tab, but React Aria leaves its default alone on a link,
  // and that default scrolls the page. Keys typed into the title editor pass.
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === ' ' && e.target === e.currentTarget) e.preventDefault();
  };

  return {
    attributes: {
      // A disabled link must not open from a middle click or the context menu.
      href: isDisabled
        ? undefined
        : isExternal
          ? cleanTo
          : nativeRoute && cleanTo === ''
            ? ''
            : resolvedHref,
      target: newTab ? '_blank' : undefined,
      rel: newTab ? 'noopener noreferrer' : undefined,
    },
    handlers: { onClick, onKeyDown },
  };
}
