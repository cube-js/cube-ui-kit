import { useMemo } from 'react';

import type {
  CubeResolvedColumn,
  CubeTableColumn,
  CubeTableColumnLayout,
} from './types';

/** @default when a column declares neither `width` nor `minWidth`. */
export const DEFAULT_MIN_WIDTH = 150;

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
  return useMemo(() => {
    const visible = [
      ...(leadingColumns ?? []),
      ...columns,
      ...(trailingColumns ?? []),
    ].filter((column) => !column.isHidden);

    // Pinned columns lead and trail regardless of their position in the source
    // array, so `aria-colindex` and DOM order agree and nothing needs CSS
    // `order:` to be reshuffled.
    const ordered = [
      ...visible.filter((c) => c.pin === 'start'),
      ...visible.filter((c) => !c.pin),
      ...visible.filter((c) => c.pin === 'end'),
    ];

    const structuralKeys = new Set(
      [...(leadingColumns ?? []), ...(trailingColumns ?? [])].map((c) => c.key),
    );

    const specs = ordered.map((column) => {
      const isStructural = structuralKeys.has(column.key);
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
        flex: explicit != null ? null : column.flex ?? 1,
      };
    });

    const resolved = new Map<string, number>();
    let isOverflowing = false;

    if (containerWidth != null && containerWidth > 0) {
      const fixedTotal = specs.reduce((sum, s) => sum + (s.fixed ?? 0), 0);
      const flexSpecs = specs.filter((s) => s.fixed == null);
      const minTotal = specs.reduce(
        (sum, s) => sum + (s.fixed ?? s.minWidth),
        0,
      );

      if (minTotal > containerWidth) {
        isOverflowing = true;
        for (const spec of specs) {
          resolved.set(spec.column.key, spec.fixed ?? spec.minWidth);
        }
      } else {
        let remaining = containerWidth - fixedTotal;
        let pool = flexSpecs;

        // Each pass assigns proportional widths, freezes whatever hit a bound,
        // and re-splits the leftover among the rest.
        while (pool.length > 0) {
          const totalFlex = pool.reduce((sum, s) => sum + (s.flex ?? 1), 0);
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
            const totalLeft = nextPool.reduce(
              (sum, s) => sum + (s.flex ?? 1),
              0,
            );
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

        for (const spec of specs) {
          if (spec.fixed != null) resolved.set(spec.column.key, spec.fixed);
        }
      }
    }

    let pinnedStartWidth = 0;
    let pinnedEndWidth = 0;

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

    // Sticky offsets accumulate inwards from each edge.
    for (const column of out) {
      if (column.pin !== 'start') continue;
      column.pinOffset = pinnedStartWidth;
      pinnedStartWidth += column.width ?? column.minWidth;
    }

    for (let i = out.length - 1; i >= 0; i--) {
      const column = out[i];
      if (column.pin !== 'end') continue;
      column.pinOffset = pinnedEndWidth;
      pinnedEndWidth += column.width ?? column.minWidth;
    }

    const lastPinnedStart = out.filter((c) => c.pin === 'start').at(-1);
    const firstPinnedEnd = out.find((c) => c.pin === 'end');

    if (lastPinnedStart) lastPinnedStart.isPinEdge = true;
    if (firstPinnedEnd) firstPinnedEnd.isPinEdge = true;

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
  }, [columns, containerWidth, columnWidths, leadingColumns, trailingColumns]);
}
