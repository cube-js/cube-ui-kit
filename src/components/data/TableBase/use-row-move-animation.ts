import { useLayoutEffect, useRef } from 'react';

import type { RefObject } from 'react';

/** Matches ag-grid's row animation closely enough to feel familiar. */
export const ROW_MOVE_DURATION = 120;

export interface UseRowMoveAnimationOptions {
  isEnabled: boolean;
  /** The `<tbody>` the rows live in. */
  bodyRef: RefObject<HTMLTableSectionElement | null>;
  /** @default 120 */
  duration?: number;
}

/** Matches `DisplayTransition`'s check, which is the kit's existing precedent. */
function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
  );
}

/**
 * Slides rows to their new positions when the order changes.
 *
 * FLIP: the previous commit's positions are the First, this commit's are the
 * Last, and each row is Inverted with a `translateY` back to where it was and
 * then Played to zero. The DOM is already correct the whole time — only the
 * paint is behind — so a test or a screen reader sees the new order
 * immediately, and nothing has to be delayed or double-rendered.
 *
 * Sorting a table otherwise teleports every row at once, and the eye has no way
 * to follow a particular one to where it went. The whole value is in tracking
 * one row, which is why this animates positions rather than cross-fading.
 *
 * **Only rows that actually moved**, and only ones that were already on screen.
 * A page turn or fresh data brings keys with no previous position, so nothing
 * slides; a filter slides the survivors, which is what ag-grid does too.
 *
 * Scrolling is not movement, and that falls out of measuring `offsetTop` rather
 * than viewport coordinates: it is relative to the scroller's content, so it
 * does not change as the content scrolls past. Without that, every scroll tick
 * would look like a reorder of the entire page.
 */
export function useRowMoveAnimation({
  isEnabled,
  bodyRef,
  duration = ROW_MOVE_DURATION,
}: UseRowMoveAnimationOptions) {
  const previousRef = useRef<Map<string, number> | null>(null);

  // No dependency array: the previous positions have to be captured after every
  // commit, because any of them may turn out to be the one a reorder starts
  // from.
  useLayoutEffect(() => {
    const body = bodyRef.current;

    if (!body) return;

    const rows = Array.from(
      body.querySelectorAll<HTMLTableRowElement>(
        // Pinned rows are excluded by the selector rather than filtered later:
        // they do not take part in the order, so they never move.
        'tr[data-element="Row"][data-key]:not([data-pinned])',
      ),
    );

    // `offsetTop`, not `getBoundingClientRect()`: it is relative to the
    // scroller, so scrolling does not read as movement. Otherwise every scroll
    // tick would look like a reorder of the whole page.
    const next = new Map<string, number>();

    for (const row of rows) next.set(row.dataset.key!, row.offsetTop);

    const previous = previousRef.current;

    previousRef.current = next;

    // Checked per commit rather than once: the setting can change mid-session,
    // and the position bookkeeping above must keep running either way so the
    // animation is correct the moment it is turned back on.
    if (!isEnabled || prefersReducedMotion() || !previous) return;

    const moved: { row: HTMLTableRowElement; delta: number }[] = [];

    for (const row of rows) {
      const from = previous.get(row.dataset.key!);

      // A row that was not here before has nowhere to come from. Skipped rather
      // than bailing on the whole batch: a virtualized window swaps some of its
      // rows on every re-sort, and refusing to animate unless ALL of them are
      // familiar means a virtualized grid — most result grids — never animates
      // at all.
      if (from === undefined) continue;

      const delta = from - next.get(row.dataset.key!)!;

      if (delta !== 0) moved.push({ row, delta });
    }

    if (!moved.length) return;

    // Invert: put every moved row back where it was, with transitions off so
    // this jump is not itself animated.
    for (const { row, delta } of moved) {
      row.style.transition = 'none';
      row.style.transform = `translateY(${delta}px)`;
    }

    // Flush the inverted state into layout, so the browser has something to
    // animate FROM. A forced reflow rather than `requestAnimationFrame`,
    // deliberately: rAF does not fire in a hidden tab, and a sort that lands
    // while the tab is in the background would leave every row frozen at its
    // old position until the next reorder. One reflow, once per animation.
    void body.offsetHeight;

    // Play.
    for (const { row } of moved) {
      row.style.transition = `transform ${duration}ms ease-out`;
      row.style.transform = '';
    }

    // Clear on arrival. A `transition` left inline would go on to animate
    // transforms this hook never set — a dragged row, for one.
    //
    // A timer rather than `transitionend`, for the same reason the invert does
    // not use `requestAnimationFrame`: in a hidden tab the transition never
    // runs, so the event never fires and every animated row keeps its inline
    // `transition` for the rest of the session. The duration is known exactly,
    // so there is nothing to wait to be told.
    const clear = () => {
      for (const { row } of moved) {
        row.style.transition = '';
        row.style.transform = '';
      }
    };
    const timer = setTimeout(clear, duration);

    return () => {
      // A reorder landing mid-animation starts over from wherever the rows are,
      // so nothing may be left behind.
      clearTimeout(timer);
      clear();
    };
  });
}
