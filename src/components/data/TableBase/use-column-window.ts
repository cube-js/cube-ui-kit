import { CONTAINER_STYLES } from '@tenphi/tasty';
import { useLayoutEffect, useState } from 'react';

import { useEvent } from '../../../_internal/hooks/use-event';

import type { Styles } from '@tenphi/tasty';
import type { CubeResolvedColumn, CubeTableColumnLayout } from './types';

// Keep nearby cells ready for a horizontal flick without multiplying the
// mounted row window by the entire column collection.
const COLUMN_OVERSCAN = 300;
const MAX_REFILL_COLUMNS = 1;
const SAFE_FRAME_STYLES = new Set<string>(
  CONTAINER_STYLES.filter(
    (key) => !['font', 'preset', 'whiteSpace'].includes(key),
  ),
);

export interface ColumnWindowRange {
  first: number;
  last: number;
}

function sameRange(
  left: ColumnWindowRange | null,
  right: ColumnWindowRange | null,
) {
  if (left == null || right == null) return left === right;
  return left.first === right.first && left.last === right.last;
}

export type ColumnWindowSegment<T> =
  | { column: CubeResolvedColumn<T>; key: string }
  | { column?: undefined; key: string; span: number };

/** Arbitrary body styling and DOM spans need the complete intrinsic layout. */
export function canWindowColumns<T>(
  columns: readonly CubeResolvedColumn<T>[],
  styles?: Styles,
) {
  return (
    columns.every(
      (column) =>
        column.width != null &&
        column.width > 0 &&
        Number.isFinite(column.width) &&
        !column.cellProps,
    ) && Object.keys(styles ?? {}).every((key) => SAFE_FRAME_STYLES.has(key))
  );
}

export function getColumnWindowRange<T>(
  layout: CubeTableColumnLayout<T>,
  offset: number,
  viewportWidth: number,
  overscanStart = COLUMN_OVERSCAN,
  overscanEnd = COLUMN_OVERSCAN,
): ColumnWindowRange {
  const start = Math.max(0, offset + layout.pinnedStartWidth - overscanStart);
  const end = offset + viewportWidth - layout.pinnedEndWidth + overscanEnd;
  let position = 0;
  let first = layout.columns.length;
  let last = -1;

  for (const column of layout.columns) {
    const next = position + column.width!;
    if (next > start && position < end) {
      first = Math.min(first, column.index);
      last = column.index;
    }
    position = next;
  }

  return { first, last };
}

/** Refill the moving edge without rebuilding rows at every column boundary. */
export function getBufferedColumnWindowRange<T>(
  layout: CubeTableColumnLayout<T>,
  previous: ColumnWindowRange | null,
  offset: number,
  viewportWidth: number,
): ColumnWindowRange {
  const required = getColumnWindowRange(layout, offset, viewportWidth);
  if (!previous) return required;
  // Native scroll extents round fractional widths; no ahead buffer is
  // needed within a pixel of either endpoint.
  if (offset <= 0 || offset >= layout.totalWidth! - viewportWidth - 1)
    return required;
  const extendsStart = required.first < previous.first;
  const extendsEnd = required.last > previous.last;
  if (!extendsStart && !extendsEnd) {
    const first = Math.max(previous.first, required.first - MAX_REFILL_COLUMNS);
    const last = Math.min(previous.last, required.last + MAX_REFILL_COLUMNS);
    return first === previous.first && last === previous.last
      ? previous
      : { first, last };
  }
  // Both edges moving means the viewport/layout changed, not one scroll edge.
  if (extendsStart && extendsEnd) return required;
  const refilled = getColumnWindowRange(
    layout,
    offset,
    viewportWidth,
    extendsStart ? COLUMN_OVERSCAN * 2 : COLUMN_OVERSCAN,
    extendsEnd ? COLUMN_OVERSCAN * 2 : COLUMN_OVERSCAN,
  );
  // A pixel-only refill retains too many narrow cells during diagonal scroll.
  return {
    first: Math.max(refilled.first, required.first - MAX_REFILL_COLUMNS),
    last: Math.min(refilled.last, required.last + MAX_REFILL_COLUMNS),
  };
}

/** Preserve height-bearing cells, native controls and row naming offscreen. */
function retainColumn<T>(
  column: CubeResolvedColumn<T>,
  treeColumnKey?: string,
) {
  return (
    column.pin != null ||
    column.isStructural ||
    column.isRowHeader ||
    column.key === treeColumnKey ||
    column.autoHeight ||
    column.render != null ||
    column.cellStyles != null
  );
}

export function getColumnWindowSegments<T>(
  columns: readonly CubeResolvedColumn<T>[],
  range: ColumnWindowRange | null,
  treeColumnKey?: string,
): ColumnWindowSegment<T>[] {
  const segments: ColumnWindowSegment<T>[] = [];
  let omitted = 0;
  let firstOmittedKey = '';

  function flushGap() {
    if (!omitted) return;
    segments.push({ key: `column-gap:${firstOmittedKey}`, span: omitted });
    omitted = 0;
  }

  for (const column of columns) {
    if (
      range == null ||
      (column.index >= range.first && column.index <= range.last) ||
      retainColumn(column, treeColumnKey)
    ) {
      flushGap();
      segments.push({ key: `column-cell:${column.key}`, column });
    } else {
      if (!omitted) firstOmittedKey = column.key;
      omitted++;
      // Native table cells clamp colSpan to 1000.
      if (omitted === 1000) flushGap();
    }
  }
  flushGap();
  return segments;
}

export function useColumnWindow<T>(
  layout: CubeTableColumnLayout<T>,
  scroller: HTMLDivElement | null,
  isEnabled: boolean,
  treeColumnKey?: string,
) {
  const isWindowEnabled =
    isEnabled &&
    layout.columns.some((column) => !retainColumn(column, treeColumnKey));
  const [range, setRange] = useState<ColumnWindowRange | null>(null);
  const [fitsRow, setFitsRow] = useState(false);
  const resetRange = () => {
    const width = scroller?.clientWidth ?? 0;
    const next =
      isWindowEnabled && scroller && width > 0 && layout.totalWidth! > width
        ? getColumnWindowRange(layout, Math.abs(scroller.scrollLeft), width)
        : null;
    setRange((previous) => (sameRange(previous, next) ? previous : next));
  };
  const refreshAppearance = useEvent(() => {
    if (
      !isWindowEnabled ||
      !scroller ||
      scroller.clientWidth <= 0 ||
      layout.totalWidth! <= scroller.clientWidth
    ) {
      return;
    }
    const table = scroller?.querySelector('table');
    if (!table) return;
    const computed = getComputedStyle(table);
    const rowHeight = computed.getPropertyValue('--row-height').trim();
    const height = parseFloat(rowHeight);
    const lineHeight = parseFloat(computed.lineHeight);
    // Empty default cells can be shorter than text. Measure the inherited
    // tokens, since Root can override both typography and the size scale.
    setFitsRow(
      rowHeight === `${height}px` &&
        Number.isFinite(height) &&
        height >= lineHeight,
    );
  });

  useLayoutEffect(() => {
    if (!isWindowEnabled || !scroller) {
      return;
    }

    const update = (reset = false) => {
      const width = scroller.clientWidth;
      const offset = Math.abs(scroller.scrollLeft);
      // Only changed bands add a render. New rows use the ordinary band,
      // so diagonal scrolling does not multiply the extra refill cells.
      setRange((previous) => {
        const next =
          width > 0 && layout.totalWidth! > width
            ? getBufferedColumnWindowRange(
                layout,
                reset ? null : previous,
                offset,
                width,
              )
            : null;
        return sameRange(previous, next) ? previous : next;
      });
    };
    let lastOffset = Math.abs(scroller.scrollLeft);
    let lastVerticalOffset = scroller.scrollTop;
    const onScroll = () => {
      const offset = Math.abs(scroller.scrollLeft);
      const verticalOffset = scroller.scrollTop;
      const reset = verticalOffset !== lastVerticalOffset;
      lastVerticalOffset = verticalOffset;
      if (offset === lastOffset && !reset) return;
      lastOffset = offset;
      update(reset);
    };
    refreshAppearance();
    update(true);
    const observer = new ResizeObserver(() => {
      refreshAppearance();
      update(true);
    });
    observer.observe(scroller);
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener('scroll', onScroll);
    };
  }, [isWindowEnabled, layout, refreshAppearance, scroller]);

  return {
    resetRange,
    segments: getColumnWindowSegments(
      layout.columns,
      isWindowEnabled && fitsRow ? range : null,
      treeColumnKey,
    ),
    refreshAppearance,
  };
}
