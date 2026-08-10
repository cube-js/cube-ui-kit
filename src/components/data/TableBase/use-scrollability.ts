import { useLayoutEffect, useState } from 'react';

export interface CubeScrollability {
  x: boolean;
  y: boolean;
}

const NONE: CubeScrollability = { x: false, y: false };

/**
 * Whether the scroller can actually scroll, per axis.
 *
 * This exists for `overscroll-behavior`. `contain` is what stops a horizontal
 * swipe at the scroll edge from triggering browser back-navigation, but Chrome
 * applies it to any element with `overflow: auto` — including one whose content
 * fits. The wheel event is then swallowed by a scroller with nothing to scroll,
 * and the page behind it will not move. So the containment has to be scoped to
 * the axis that is genuinely scrollable, which means measuring.
 *
 * Both the scroller and its content are observed: the scroller's own box does
 * not change when rows are added, so observing it alone would miss a table that
 * grew past its container.
 */
export function useScrollability(
  element: HTMLElement | null,
): CubeScrollability {
  const [state, setState] = useState<CubeScrollability>(NONE);

  useLayoutEffect(() => {
    // Matches `useContainerWidth`: a scroller handed over by a callback ref can
    // be null, and `observe` throws on anything that is not an Element.
    if (!element || !(element instanceof Element)) {
      setState(NONE);

      return;
    }

    const measure = () => {
      // A 1px tolerance: sub-pixel layout regularly leaves `scrollHeight` a
      // fraction above `clientHeight` on a table that visibly does not scroll,
      // and trapping the wheel over that fraction is the exact bug this avoids.
      const next = {
        x: element.scrollWidth - element.clientWidth > 1,
        y: element.scrollHeight - element.clientHeight > 1,
      };

      setState((current) =>
        current.x === next.x && current.y === next.y ? current : next,
      );
    };

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(element);

    const content = element.firstElementChild;

    if (content) observer.observe(content);

    return () => observer.disconnect();
  }, [element]);

  return state;
}
