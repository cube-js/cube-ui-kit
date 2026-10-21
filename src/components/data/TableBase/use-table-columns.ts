import { useMemo } from 'react';

import type {
  CubeResolvedColumn,
  CubeTableColumn,
  CubeTableColumnLayout,
} from './types';

/** @default when a column declares neither `width` nor `minWidth`. */
export const DEFAULT_MIN_WIDTH = 150;

/**
 * Every column's current width, so a resize can change exactly one of them.
 *
 * A column with no explicit width is `flex: 1` and shares the leftover (see the
 * spec builder below). Making only the DRAGGED column fixed leaves every other
 * one in the flex pool, re-splitting a leftover that just changed — so one
 * divider moved all of them, including columns to the LEFT of the handle, which
 * cannot be what dragging a right edge means. Measured before this existed:
 * dragging column B by +8px took 3px off A, C and D each.
 *
 * Freezing first means a drag changes one width. Columns after it are pushed
 * along, which is what being after it means, and the table grows or shrinks
 * rather than the neighbours absorbing the difference.
 *
 * Structural columns are skipped — they are sized by the table, not the user.
 */
export function freezeColumnWidths<T>(
  layout: CubeTableColumnLayout<T> | null,
  base: Record<string, number>,
): Record<string, number> {
  return (layout?.columns ?? []).reduce<Record<string, number>>(
    (widths, column) => {
      if (!column.isStructural && column.width != null) {
        widths[column.key] = Math.round(column.width);
      }

      return widths;
    },
    { ...base },
  );
}

/**
 * Reads `key` as a data path. A plain key is a single property lookup; dots
 * walk nested objects (`'owner.name'`). Anything richer belongs in `getValue`.
 */
export function readPath(row: any, path: string): unknown {
  if (row == null) return undefined;
  if (!path.includes('.')) return row[path];

  let current: any = row;

  for (const part of path.split('.')) {
    if (current == null) return undefined;
    current = current[part];
  }

  return current;
}

/** Only the value-pipeline members, so both raw and resolved columns fit. */
type ValueColumn<T> = Pick<CubeTableColumn<T>, 'key' | 'getValue' | 'format'>;

export function getColumnValue<T>(
  column: ValueColumn<T>,
  row: T,
  rowIndex: number,
): unknown {
  return column.getValue
    ? column.getValue(row, rowIndex)
    : readPath(row, column.key);
}

/**
 * Display text for a cell — what client sort, client search and TSV copy all
 * operate on. Deliberately NOT the rendered output: `render` may return
 * arbitrary React, and stringifying that is how cloud's filter ended up
 * matching `"[object Object]"` against the query `"object"`.
 *
 * Returns `null` when the column cannot produce text, so callers can skip it
 * rather than coerce a non-primitive.
 */
export function getColumnText<T>(
  column: ValueColumn<T>,
  row: T,
  rowIndex: number,
): string | null {
  const value = getColumnValue(column, row, rowIndex);

  if (column.format) return column.format(value, row, rowIndex);
  if (value == null) return '';

  const type = typeof value;

  if (type === 'string') return value as string;
  if (type === 'number' || type === 'boolean' || type === 'bigint') {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();

  return null;
}

function clamp(value: number, min: number, max: number | null): number {
  return Math.min(Math.max(value, min), max ?? Number.POSITIVE_INFINITY);
}

export interface UseTableColumnsOptions<T> {
  columns: CubeTableColumn<T>[];
  /** Content-box width of the scroller, or `null` before the first measure. */
  containerWidth: number | null;
  /** User-resized widths, keyed by column key. Wins over `column.width`. */
  columnWidths?: Record<string, number>;
  /** Extra leading columns owned by the table (selection, drag handle). */
  leadingColumns?: CubeTableColumn<T>[];
  /** Extra trailing columns owned by the table (row menu). */
  trailingColumns?: CubeTableColumn<T>[];
}

/** A column's sizing inputs, before the container is split between columns. */
interface ColumnSpec<T> {
  column: CubeTableColumn<T>;
  isStructural: boolean;
  fixed: number | null;
  minWidth: number;
  maxWidth: number | null;
  flex: number | null;
}

/**
 * The visible columns in visual order. Pinned columns lead and trail
 * regardless of their position in the source array, so `aria-colindex` and DOM
 * order agree and nothing needs CSS `order:` to be reshuffled.
 */
function orderColumns<T>(columns: CubeTableColumn<T>[]): CubeTableColumn<T>[] {
  const visible = columns.filter((column) => !column.isHidden);

  return [
    ...visible.filter((c) => c.pin === 'start'),
    ...visible.filter((c) => !c.pin),
    ...visible.filter((c) => c.pin === 'end'),
  ];
}

function toColumnSpec<T>(
  column: CubeTableColumn<T>,
  isStructural: boolean,
  columnWidths: Record<string, number> | undefined,
): ColumnSpec<T> {
  const explicit = columnWidths?.[column.key] ?? column.width;
  const minWidth =
    column.minWidth ??
    (explicit != null ? explicit : isStructural ? 0 : DEFAULT_MIN_WIDTH);

  return {
    column,
    isStructural,
    fixed: explicit ?? null,
    minWidth,
    maxWidth: column.maxWidth ?? null,
    flex: explicit != null ? null : (column.flex ?? 1),
  };
}

function sumFlex<T>(specs: ColumnSpec<T>[]): number {
  return specs.reduce((sum, s) => sum + (s.flex ?? 1), 0);
}

/**
 * Splits `available` pixels across the flex columns by weight. Each pass
 * assigns proportional widths, freezes whatever hit a bound, and re-splits the
 * leftover among the rest.
 */
function distributeFlexWidths<T>(
  flexSpecs: ColumnSpec<T>[],
  available: number,
  resolved: Map<string, number>,
): void {
  let remaining = available;
  let pool = flexSpecs;

  while (pool.length > 0) {
    const totalFlex = sumFlex(pool);
    const nextPool: typeof pool = [];
    let consumed = 0;

    for (const spec of pool) {
      const ideal = (remaining * (spec.flex ?? 1)) / (totalFlex || 1);
      const clamped = clamp(ideal, spec.minWidth, spec.maxWidth);

      if (clamped !== ideal) {
        resolved.set(spec.column.key, clamped);
        consumed += clamped;
      } else {
        nextPool.push(spec);
      }
    }

    if (nextPool.length === pool.length) {
      // Nothing was clamped this pass — the proportional split stands.
      const totalLeft = sumFlex(nextPool);
      for (const spec of nextPool) {
        resolved.set(
          spec.column.key,
          (remaining * (spec.flex ?? 1)) / (totalLeft || 1),
        );
      }
      break;
    }

    remaining -= consumed;
    pool = nextPool;
  }
}

/**
 * Each column's pixel width, keyed by column key; none before the container is
 * measured. When even the minimums do not fit, every column takes its minimum
 * and the table overflows.
 */
function resolveWidths<T>(
  specs: ColumnSpec<T>[],
  containerWidth: number | null,
): { resolved: Map<string, number>; isOverflowing: boolean } {
  const resolved = new Map<string, number>();
  const isMeasured = containerWidth != null && containerWidth > 0;

  if (!isMeasured) return { resolved, isOverflowing: false };

  const minTotal = specs.reduce((sum, s) => sum + (s.fixed ?? s.minWidth), 0);

  if (minTotal > containerWidth) {
    for (const spec of specs) {
      resolved.set(spec.column.key, spec.fixed ?? spec.minWidth);
    }

    return { resolved, isOverflowing: true };
  }

  const fixedTotal = specs.reduce((sum, s) => sum + (s.fixed ?? 0), 0);

  distributeFlexWidths(
    specs.filter((s) => s.fixed == null),
    containerWidth - fixedTotal,
    resolved,
  );

  for (const spec of specs) {
    if (spec.fixed != null) resolved.set(spec.column.key, spec.fixed);
  }

  return { resolved, isOverflowing: false };
}

/**
 * Sets each pinned column's sticky offset, which accumulates inwards from its
 * edge, and marks the innermost pinned column on each side. Returns the width
 * pinned to each side.
 */
function applyPinOffsets<T>(columns: CubeResolvedColumn<T>[]): {
  pinnedStartWidth: number;
  pinnedEndWidth: number;
} {
  let pinnedStartWidth = 0;
  let pinnedEndWidth = 0;

  for (const column of columns) {
    if (column.pin !== 'start') continue;
    column.pinOffset = pinnedStartWidth;
    pinnedStartWidth += column.width ?? column.minWidth;
  }

  for (let i = columns.length - 1; i >= 0; i--) {
    const column = columns[i];
    if (column.pin !== 'end') continue;
    column.pinOffset = pinnedEndWidth;
    pinnedEndWidth += column.width ?? column.minWidth;
  }

  const lastPinnedStart = columns.filter((c) => c.pin === 'start').at(-1);
  const firstPinnedEnd = columns.find((c) => c.pin === 'end');

  if (lastPinnedStart) lastPinnedStart.isPinEdge = true;
  if (firstPinnedEnd) firstPinnedEnd.isPinEdge = true;

  return { pinnedStartWidth, pinnedEndWidth };
}

function resolveColumnLayout<T>({
  columns,
  containerWidth,
  columnWidths,
  leadingColumns,
  trailingColumns,
}: UseTableColumnsOptions<T>): CubeTableColumnLayout<T> {
  const leading = leadingColumns ?? [];
  const trailing = trailingColumns ?? [];
  const structuralKeys = new Set([...leading, ...trailing].map((c) => c.key));
  const specs = orderColumns([...leading, ...columns, ...trailing]).map(
    (column) =>
      toColumnSpec(column, structuralKeys.has(column.key), columnWidths),
  );
  const { resolved, isOverflowing } = resolveWidths(specs, containerWidth);

  const out: CubeResolvedColumn<T>[] = specs.map((spec, index) => ({
    ...spec.column,
    index,
    ariaColIndex: index + 1,
    width: resolved.get(spec.column.key) ?? null,
    minWidth: spec.minWidth,
    maxWidth: spec.maxWidth,
    flex: spec.flex,
    align: spec.column.align ?? 'start',
    pinOffset: null,
    isPinEdge: false,
    isStructural: spec.isStructural,
  }));

  const { pinnedStartWidth, pinnedEndWidth } = applyPinOffsets(out);

  const totalWidth = out.every((c) => c.width != null)
    ? out.reduce((sum, c) => sum + (c.width ?? 0), 0)
    : null;

  return {
    columns: out,
    pinnedStartWidth,
    pinnedEndWidth,
    totalWidth,
    isOverflowing,
  };
}

/**
 * Normalizes the public column list into resolved leaves: visual order, ARIA
 * indices, pixel widths, and sticky offsets for pinned columns.
 *
 * Width resolution mirrors ag-grid's `fitGridWidth`: fixed columns take their
 * width, the remainder is split across flex columns by weight, and each result
 * is clamped to `[minWidth, maxWidth]`. Clamping perturbs the sum, so the
 * residual is redistributed across the still-unclamped columns until it
 * settles. When even the minimums do not fit, every column takes its minimum
 * and the table scrolls horizontally.
 */
export function useTableColumns<T>({
  columns,
  containerWidth,
  columnWidths,
  leadingColumns,
  trailingColumns,
}: UseTableColumnsOptions<T>): CubeTableColumnLayout<T> {
  return useMemo(
    () =>
      resolveColumnLayout({
        columns,
        containerWidth,
        columnWidths,
        leadingColumns,
        trailingColumns,
      }),
    [columns, containerWidth, columnWidths, leadingColumns, trailingColumns],
  );
}
