import { useEffect } from 'react';

import { refreshAutoTooltipsWithin } from '../../content/use-auto-tooltip';

// These elements own inherited table typography and its state selectors.
const APPEARANCE_ELEMENTS = new Set([
  'Scroller',
  'Table',
  'Head',
  'HeadRow',
  'HeaderCell',
  'HeaderGroupCell',
  'Body',
  'Row',
  'Cell',
]);

export function useTableTooltipRefresh(
  scroller: HTMLDivElement | null,
  isScrolling: boolean,
  onAppearanceChange?: () => void,
  onRest?: () => void,
) {
  // A commit can change inherited appearance without changing the box or
  // font-set size. Refresh at rest, including the commit that settles scroll.
  useEffect(() => {
    const root = scroller?.parentElement;
    if (root && !isScrolling) {
      onAppearanceChange?.();
      // Range buffers settle here, separately from mid-gesture appearance.
      onRest?.();
      refreshAutoTooltipsWithin(root);
    }
  });

  useEffect(() => {
    const root = scroller?.parentElement;
    if (!root) return;

    const refresh = () => {
      onAppearanceChange?.();
      refreshAutoTooltipsWithin(root);
    };
    window.addEventListener('resize', refresh, { passive: true });
    const observer = new MutationObserver((records) => {
      if (
        records.some(
          ({ target }) =>
            target === root ||
            !root.contains(target) ||
            (target instanceof HTMLElement &&
              APPEARANCE_ELEMENTS.has(target.dataset.element ?? '')),
        )
      ) {
        // One scan per delivery also covers sibling/state selector changes.
        // Spacer height and tooltip-trigger mutations need no refresh.
        refresh();
      }
    });
    document.fonts?.addEventListener('loadingdone', refresh);
    observer.observe(root, { attributes: true, subtree: true });
    for (
      let parent = root.parentElement;
      parent;
      parent = parent.parentElement
    ) {
      observer.observe(parent, { attributes: true });
    }
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', refresh);
      document.fonts?.removeEventListener('loadingdone', refresh);
    };
  }, [onAppearanceChange, scroller]);
}
