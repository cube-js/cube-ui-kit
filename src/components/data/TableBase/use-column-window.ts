import { CONTAINER_STYLES } from '@tenphi/tasty';
import { useLayoutEffect, useState } from 'react';

import { useEvent } from '../../../_internal/hooks/use-event';

import type { Styles } from '@tenphi/tasty';
import type { CubeResolvedColumn, CubeTableColumnLayout } from './types';

// Keep nearby cells ready for a horizontal flick without multiplying the
// mounted row window by the entire column collection.
const COLUMN_OVERSCAN = 300;
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
): ColumnWindowRange {
  const start = Math.max(0, offset + layout.pinnedStartWidth - COLUMN_OVERSCAN);
  const end = offset + viewportWidth - layout.pinnedEndWidth + COLUMN_OVERSCAN;
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
  const [range, setRange] = useState<ColumnWindowRange | null>(null);
  const [fitsRow, setFitsRow] = useState(false);
  const refreshAppearance = useEvent(() => {
    if (
      !isEnabled ||
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
    if (!isEnabled || !scroller) {
      return;
    }

    const update = () => {
      const width = scroller.clientWidth;
      const next =
        width > 0 && layout.totalWidth! > width
          ? getColumnWindowRange(layout, Math.abs(scroller.scrollLeft), width)
          : null;
      // Vertical scroll and movement within the same column band add no render.
      setRange((previous) => (sameRange(previous, next) ? previous : next));
    };
    refreshAppearance();
    update();
    const observer = new ResizeObserver(() => {
      refreshAppearance();
      update();
    });
    observer.observe(scroller);
    scroller.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener('scroll', update);
    };
  }, [isEnabled, layout, refreshAppearance, scroller]);

  return {
    segments: getColumnWindowSegments(
      layout.columns,
      isEnabled && fitsRow ? range : null,
      treeColumnKey,
    ),
    refreshAppearance,
  };
}
