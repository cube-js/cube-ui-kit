import { useLayoutEffect, useState } from 'react';

/**
 * Content-box width of the scroller, measured before paint and kept current
 * with a `ResizeObserver`.
 *
 * Takes the **element**, not a ref: in the virtualized path the scroller is
 * created by Virtuoso and handed over through a callback after mount, so a hook
 * that peeked at `ref.current` once would see `null` and never measure
 * anything — leaving every column unsized.
 *
 * `useLayoutEffect` rather than `useEffect` on purpose: column widths are
 * derived from this value, so measuring after paint would show one frame of
 * min-width columns before they snap to their real size.
 */
export function useContainerWidth(element: HTMLElement | null): number | null {
  const [width, setWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    // Virtuoso's `scrollerRef` reports `HTMLElement | Window | null`, and
    // `ResizeObserver.observe` throws on anything that is not an Element.
    if (!element || !(element instanceof Element)) return;

    const measure = () => {
      // `clientWidth` excludes the vertical scrollbar, which is what we want:
      // the columns must fit the content box, not the border box, or a
      // scrollbar appearing would push the last column out and bring a
      // horizontal scrollbar with it.
      setWidth((current) =>
        current === element.clientWidth ? current : element.clientWidth,
      );
    };

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(element);

    return () => observer.disconnect();
  }, [element]);

  return width;
}
