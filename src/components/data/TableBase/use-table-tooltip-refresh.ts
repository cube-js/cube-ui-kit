import { useEffect, useRef } from 'react';

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

export function useTableTooltipRefresh(scroller: HTMLDivElement | null) {
  const fontCountRef = useRef<number | undefined>(undefined);

  // Adding an already-loaded FontFace need not emit loadingdone. Check it on
  // commits, including scroll, without remeasuring an unchanged font set.
  useEffect(() => {
    const root = scroller?.parentElement;
    if (!root) return;
    const fontCount = (document.fonts as FontFaceSet & ReadonlySet<FontFace>)
      ?.size;
    if (fontCountRef.current !== fontCount) {
      fontCountRef.current = fontCount;
      refreshAutoTooltipsWithin(root);
    }
  });

  useEffect(() => {
    const root = scroller?.parentElement;
    if (!root) return;

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
        refreshAutoTooltipsWithin(root);
      }
    });
    const refresh = () => refreshAutoTooltipsWithin(root);
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
      document.fonts?.removeEventListener('loadingdone', refresh);
    };
  }, [scroller]);
}
