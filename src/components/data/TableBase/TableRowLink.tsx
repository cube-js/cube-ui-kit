import { shouldClientNavigate } from '@react-aria/utils';

import { useTracking } from '../../../providers/TrackingProvider';
import { useNavigation } from '../../../providers/use-navigation';
import { parseTo, performClickHandler } from '../../actions/use-action';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import type { NavigateArg } from '../../../providers/navigation.types';

/** One navigation owner supplies the stretched link and its text hit targets. */
export function TableRowLink({
  to,
  children,
}: {
  to?: NavigateArg;
  children: (props?: AnchorHTMLAttributes<HTMLAnchorElement>) => ReactNode;
}) {
  const {
    cleanTo,
    newTab,
    nativeRoute,
    isExternal,
    isHistoryNavigation,
    isHashNavigation,
  } = parseTo(to);
  const { navigate, resolvedHref, isDefault } = useNavigation(
    isExternal ? '.' : cleanTo || '.',
  );
  const tracking = useTracking();
  const href =
    nativeRoute && cleanTo === ''
      ? ''
      : isExternal
        ? String(cleanTo)
        : cleanTo !== undefined
          ? resolvedHref
          : undefined;

  const nativeLinkProps: AnchorHTMLAttributes<HTMLAnchorElement> = {
    href,
    role: !href ? 'link' : undefined,
    target: newTab ? '_blank' : undefined,
    rel: newTab ? 'noopener noreferrer' : undefined,
    onMouseDown(event) {
      // Local text anchors are hidden from accessibility. Keep pointer focus
      // on the visible row without canceling the subsequent native click.
      if (event.button !== 0) return;
      const row = event.currentTarget.closest<HTMLTableRowElement>(
        'tr[data-element="Row"]',
      );
      if (row?.hasAttribute('tabindex')) row.focus({ preventScroll: true });
      event.preventDefault();
    },
    onClick(event) {
      if (event.defaultPrevented || event.button !== 0) return;
      const anchor = event.currentTarget;
      const isOrdinaryClick = shouldClientNavigate(anchor, event);

      // Preserve Action's history, reload and smooth hash contracts. Modified
      // hash gestures still belong to the browser, like other native links.
      if (
        isHistoryNavigation ||
        (nativeRoute && cleanTo === '' && isOrdinaryClick) ||
        (isHashNavigation && isOrdinaryClick && !newTab)
      ) {
        event.preventDefault();
        performClickHandler(event, {
          navigate,
          resolvedHref: href || resolvedHref,
          to,
          tracking,
          onPress: undefined,
          navigationOptions: undefined,
        });
        return;
      }

      if (
        isOrdinaryClick &&
        !isDefault &&
        !nativeRoute &&
        !isExternal &&
        !newTab &&
        cleanTo !== undefined
      ) {
        event.preventDefault();
        navigate(cleanTo, undefined);
      }

      tracking.event?.(
        'Link Press',
        {
          qa: anchor.getAttribute('data-qa'),
          href,
          type:
            newTab || !isOrdinaryClick
              ? 'tab'
              : nativeRoute || isExternal || isDefault
                ? 'native'
                : 'router',
        },
        anchor,
      );
    },
  };

  return children(to !== undefined ? nativeLinkProps : undefined);
}
