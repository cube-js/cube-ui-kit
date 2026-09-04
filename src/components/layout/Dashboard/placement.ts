import type { CSSProperties } from 'react';
import type {
  CubeDashboardProps,
  DashboardContainerKind,
  DashboardMetrics,
  DashboardPlacement,
  DashboardPlacementProps,
  DashboardTreeContextValue,
} from './types';

/**
 * The vertical channel between top-level containers, in pixels.
 *
 * Must stay in step with `gap: '2x'` on `DashboardElement`. It is deliberately
 * independent of the `gap` prop, which describes spacing *inside* a container's
 * grid, and the pointer maths for a root-level move reads it from here rather
 * than from `metrics.rowGap`.
 *
 * `2x` is also exactly twice the depth-one chrome bleed, so two adjacent
 * top-level containers' selectable boxes meet edge to edge instead of crossing.
 */
export const DASHBOARD_ROOT_GAP = 16;

export function normalizeGap(gap: CubeDashboardProps['gap']): [number, number] {
  if (Array.isArray(gap)) return gap;
  const value = gap ?? 16;
  return [value, value];
}

export function clampSpan(value: number | undefined, fallback: number): number {
  return Math.max(1, Math.min(12, Math.floor(value ?? fallback)));
}

export function clampRows(value: number | undefined, fallback: number): number {
  return Math.max(1, Math.floor(value ?? fallback));
}

export function clampOrigin(value: number | undefined): number {
  return Math.max(0, Math.min(11, Math.floor(value ?? 0)));
}

export function clampRowOrigin(value: number | undefined): number {
  return Math.max(0, Math.floor(value ?? 0));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizePlacement(
  placement: DashboardPlacementProps,
  parentColumns: number,
  parentRows: number,
): DashboardPlacement {
  const columns = Math.min(
    clampSpan(placement.columns, parentColumns),
    parentColumns,
  );
  const rows = Math.min(clampRows(placement.rows, 1), parentRows);

  return {
    column: Math.min(clampOrigin(placement.column), parentColumns - columns),
    row: Math.min(clampRowOrigin(placement.row), parentRows - rows),
    columns,
    rows,
  };
}

export function isSamePlacement(
  first: DashboardPlacement,
  second: DashboardPlacement,
): boolean {
  return (
    first.column === second.column &&
    first.row === second.row &&
    first.columns === second.columns &&
    first.rows === second.rows
  );
}

export function getPlacementStyle(
  tree: DashboardTreeContextValue,
  placement: DashboardPlacementProps,
): CSSProperties {
  if (tree.parentKind === 'root') {
    return { gridColumn: '1 / -1' };
  }

  const columns = Math.min(
    clampSpan(placement.columns, tree.parentColumns),
    tree.parentColumns,
  );
  const rows = Math.min(clampRows(placement.rows, 1), tree.parentRows);

  if (tree.parentKind === 'horizontal-stack') {
    return {
      gridColumn: `span ${columns}`,
      gridRow: `1 / span ${rows}`,
    };
  }

  if (tree.parentKind === 'vertical-stack') {
    return {
      gridColumn: `1 / span ${columns}`,
      gridRow: `span ${rows}`,
    };
  }

  return {
    gridColumn: `${Math.min(clampOrigin(placement.column), tree.parentColumns - columns) + 1} / span ${columns}`,
    gridRow: `${Math.min(clampRowOrigin(placement.row), tree.parentRows - rows) + 1} / span ${rows}`,
  };
}

/**
 * What a stack child can be resized to along its parent's axis.
 *
 * A stack child owns its span: it shrinks to its own minimum and grows only
 * into the room its siblings leave over, so resizing one never moves another.
 * `null` for every other layout, where the bound is a question about positions
 * rather than a running total.
 */
export function getStackSpanBounds(
  tree: DashboardTreeContextValue,
  placement: DashboardPlacement,
  minSpan: number,
  maxSpan: number,
): { axis: 'columns' | 'rows'; min: number; max: number } | null {
  const isHorizontal = tree.parentKind === 'horizontal-stack';
  if (!isHorizontal && tree.parentKind !== 'vertical-stack') return null;

  const axis = isHorizontal ? 'columns' : 'rows';
  const capacity = isHorizontal ? tree.parentColumns : tree.parentRows;
  const free = Math.max(0, capacity - tree.parentStackUsed);

  return {
    axis,
    min: minSpan,
    max: Math.max(minSpan, Math.min(maxSpan, placement[axis] + free)),
  };
}

export function getContentGridStyle(
  kind: DashboardContainerKind,
  columns: number,
  rows: number,
  metrics: DashboardMetrics,
): CSSProperties {
  return {
    gap: `${metrics.rowGap}px ${metrics.columnGap}px`,
    gridTemplateColumns: `repeat(${Math.max(1, Math.floor(columns))}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${Math.max(1, Math.floor(rows))}, minmax(${metrics.rowHeight}px, auto))`,
    gridAutoFlow: kind === 'horizontal-stack' ? 'row' : undefined,
  };
}

/**
 * The cell a client point falls in.
 *
 * Shared by the drag engine, which positions a box and therefore rounds to the
 * *nearest* track boundary, and by the add-region gesture, which asks which cell
 * the pointer is inside and therefore floors. Both read the same track maths, so
 * a region and a drop can never disagree about where a cell starts.
 */
export function pointToCell(
  point: { x: number; y: number },
  rect: { left: number; top: number; width: number },
  columns: number,
  rows: number,
  metrics: DashboardMetrics,
  rounding: 'floor' | 'nearest' = 'floor',
): { column: number; row: number } {
  const columnWidth =
    (rect.width - metrics.columnGap * (columns - 1)) / columns;
  const columnStep = Math.max(1, columnWidth + metrics.columnGap);
  const rowStep = Math.max(1, metrics.rowHeight + metrics.rowGap);
  const round = rounding === 'floor' ? Math.floor : Math.round;

  return {
    column: clamp(round((point.x - rect.left) / columnStep), 0, columns - 1),
    row: clamp(round((point.y - rect.top) / rowStep), 0, rows - 1),
  };
}

export function placementsOverlap(
  first: DashboardPlacement,
  second: DashboardPlacement,
): boolean {
  return (
    first.column < second.column + second.columns &&
    first.column + first.columns > second.column &&
    first.row < second.row + second.rows &&
    first.row + first.rows > second.row
  );
}
