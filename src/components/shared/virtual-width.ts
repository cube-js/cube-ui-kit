import { defaultRangeExtractor } from '@tanstack/react-virtual';
import { useEffect, useState } from 'react';

import type { Range } from '@tanstack/react-virtual';
import type { RefObject } from 'react';

/**
 * How a virtualized list (ListBox, Tree) sizes a popover to its rows.
 *
 * The list stacks its rendered rows in one grid cell, each moved down to its
 * offset, so their widths size the list as a list that isn't virtualized is
 * sized by all of its rows. Only the rendered rows count, so the list also:
 *
 * - keeps the rows with the longest text rendered wherever it is scrolled
 *   (`getLongestRows`, `rangeWithRows`), so its width is set when it opens;
 * - holds the widest width it has had (`useHeldWidth`), so a row the text
 *   length missed only widens it, and a filter that leaves only short rows
 *   doesn't narrow it. ListBox holds it itself; a Tree's is held by
 *   FilterPicker's FilterTree, which filters it.
 */

/** How many of a virtualized list's longest rows stay rendered. */
const LONGEST_ROW_COUNT = 3;

/**
 * The indexes of the rows whose text is longest, by `getLength`, in no set
 * order. Text length stands in for width only to choose the rows: the browser
 * sizes the list from the rows it renders, icons and suffixes included.
 */
export function getLongestRows(
  count: number,
  getLength: (index: number) => number,
): number[] {
  const rows: { index: number; length: number }[] = [];

  for (let index = 0; index < count; index++) {
    const length = getLength(index);
    const shortest = rows[LONGEST_ROW_COUNT - 1];

    // On a tie the earlier row stays.
    if (shortest && length <= shortest.length) continue;

    rows.splice(LONGEST_ROW_COUNT - 1, 1, { index, length });
    rows.sort((a, b) => b.length - a.length);
  }

  return rows.map((row) => row.index);
}

/**
 * A `rangeExtractor` result: the rows react-virtual renders for `range`, and
 * `rows` with them, in index order.
 */
export function rangeWithRows(range: Range, rows: readonly number[]) {
  const indexes = defaultRangeExtractor(range);
  const extra = rows.filter(
    (index) => index < range.count && !indexes.includes(index),
  );

  return extra.length ? [...indexes, ...extra].sort((a, b) => a - b) : indexes;
}

/**
 * The widest the element's content box has been since it mounted, in whole
 * pixels. The element gives it to an empty spacer of its own as a preferred
 * width with a `100%` floor and cap: sized to its content, the element counts
 * a percentage floor and cap as none, so the spacer widens its `max-content`;
 * otherwise the spacer just fills it. Observe an element that outlives the rows
 * it holds the width of: ListBox's scroll element, which stays when a
 * reorderable list swaps its `ul` as a search starts, and FilterTree's list,
 * which stays when a search that matches nothing replaces the tree. A popover
 * unmounts its list when it closes, so each opening starts afresh.
 */
export function useHeldWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;

    // A consumer's jsdom may have no ResizeObserver.
    if (!element || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => {
      // Rounded up: a fraction of a pixel less cuts the widest row's text.
      const next = Math.ceil(entry.contentRect.width);

      setWidth((current) => Math.max(current, next));
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return width;
}
