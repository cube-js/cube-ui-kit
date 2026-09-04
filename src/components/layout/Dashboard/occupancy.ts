import { Children, cloneElement, isValidElement } from 'react';

import {
  clamp,
  clampRows,
  clampSpan,
  normalizePlacement,
  placementsOverlap,
} from './placement';

import type { ReactNode } from 'react';
import type {
  DashboardAddItemDefinition,
  DashboardContainerKind,
  DashboardPlacement,
  DashboardPlacementProps,
} from './types';

export interface DashboardFreeCell {
  column: number;
  row: number;
}

export function getDashboardChildPlacements(
  kind: DashboardContainerKind,
  children: ReactNode,
  columns: number,
  rows: number,
): DashboardPlacement[] {
  const childPlacements = Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return [];
    const props = child.props as DashboardPlacementProps & {
      'data-dashboard-add-slot'?: unknown;
    };
    if (props['data-dashboard-add-slot'] !== undefined) return [];

    return [normalizePlacement(props, columns, rows)];
  });

  if (kind === 'horizontal-stack') {
    let nextColumn = 0;

    return childPlacements.map((placement) => {
      const next = { ...placement, column: nextColumn, row: 0 };
      nextColumn += placement.columns;

      return next;
    });
  }

  if (kind === 'vertical-stack') {
    let nextRow = 0;

    return childPlacements.map((placement) => {
      const next = { ...placement, column: 0, row: nextRow };
      nextRow += placement.rows;

      return next;
    });
  }

  return childPlacements;
}

export function getDashboardFreeCells(
  kind: DashboardContainerKind,
  placements: DashboardPlacement[],
  columns: number,
  rows: number,
): DashboardFreeCell[] {
  // A stack has one insertion point, at the end of what its children occupy.
  if (kind === 'horizontal-stack') {
    const column = placements.reduce(
      (end, placement) => Math.max(end, placement.column + placement.columns),
      0,
    );

    return column < columns ? [{ column, row: 0 }] : [];
  }

  if (kind === 'vertical-stack') {
    const row = placements.reduce(
      (end, placement) => Math.max(end, placement.row + placement.rows),
      0,
    );

    return row < rows ? [{ column: 0, row }] : [];
  }

  if (kind === 'tabs') {
    return placements.length === 0 ? [{ column: 0, row: 0 }] : [];
  }

  const cells: DashboardFreeCell[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const isOccupied = placements.some(
        (placement) =>
          column >= placement.column &&
          column < placement.column + placement.columns &&
          row >= placement.row &&
          row < placement.row + placement.rows,
      );

      if (!isOccupied) cells.push({ column, row });
    }
  }

  return cells;
}

export function getDashboardAddPlacement(
  definition: DashboardAddItemDefinition,
  cell: DashboardFreeCell,
  kind: DashboardContainerKind,
  placements: DashboardPlacement[],
  parentColumns: number,
  parentRows: number,
  parentDepth: number,
  region?: DashboardPlacement,
): DashboardPlacement | null {
  if (
    definition.isDisabled ||
    (kind === 'tabs' &&
      (!definition.kind ||
        definition.kind === 'widget' ||
        definition.kind === 'tabs')) ||
    (definition.kind && definition.kind !== 'widget' && parentDepth >= 3)
  ) {
    return null;
  }

  const minColumns = clampSpan(definition.minColumns, 1);
  const maxColumns = Math.max(
    minColumns,
    clampSpan(definition.maxColumns, parentColumns),
  );
  const minRows = clampRows(definition.minRows, 1);
  const maxRows = Math.max(minRows, clampRows(definition.maxRows, parentRows));
  let resolvedColumns = clamp(
    clampSpan(definition.defaultColumns, minColumns),
    minColumns,
    maxColumns,
  );
  let resolvedRows = clamp(
    clampRows(definition.defaultRows, minRows),
    minRows,
    maxRows,
  );

  if (kind === 'horizontal-stack' || kind === 'vertical-stack') {
    const isHorizontal = kind === 'horizontal-stack';

    if (isHorizontal) {
      resolvedRows = Math.min(parentRows, maxRows);
    } else {
      resolvedColumns = Math.min(parentColumns, maxColumns);
    }

    // A stack child owns its span, so an arriving item needs room of its own
    // at the end of the sequence: at least its minimum, and no more than what
    // the residents have left over.
    const used = placements.reduce(
      (total, occupied) =>
        total + (isHorizontal ? occupied.columns : occupied.rows),
      0,
    );
    const available = (isHorizontal ? parentColumns : parentRows) - used;
    const minimum = isHorizontal ? minColumns : minRows;
    if (minimum > available) return null;

    if (isHorizontal) {
      resolvedColumns = clamp(
        resolvedColumns,
        minColumns,
        Math.min(maxColumns, available),
      );
    } else {
      resolvedRows = clamp(resolvedRows, minRows, Math.min(maxRows, available));
    }

    return {
      column: isHorizontal ? cell.column : 0,
      row: isHorizontal ? 0 : cell.row,
      columns: resolvedColumns,
      rows: resolvedRows,
    };
  }

  if (kind === 'tabs') {
    resolvedColumns = parentColumns;
    resolvedRows = Math.min(parentRows, maxRows);
  }

  // A claimed region is a demand, not a hint: the item has to be able to *be*
  // that size, or it does not belong in this region's menu at all. Without a
  // region the definition's own defaults grow from the cell, which is what a
  // plain click on the add button has always done.
  if (region) {
    if (
      region.columns < minColumns ||
      region.columns > maxColumns ||
      region.rows < minRows ||
      region.rows > maxRows
    ) {
      return null;
    }

    resolvedColumns = region.columns;
    resolvedRows = region.rows;
  }

  if (
    resolvedColumns < minColumns ||
    resolvedRows < minRows ||
    resolvedColumns > parentColumns ||
    resolvedRows > parentRows
  ) {
    return null;
  }

  // Both stacks have already returned, so only a grid or a tab panel is left
  // and the landing is a plain rectangle that must not overlap an occupant.
  const origin = region ?? cell;
  const placement: DashboardPlacement = {
    column: kind === 'tabs' ? 0 : origin.column,
    row: kind === 'tabs' ? 0 : origin.row,
    columns: resolvedColumns,
    rows: resolvedRows,
  };

  if (
    placement.column + placement.columns > parentColumns ||
    placement.row + placement.rows > parentRows
  ) {
    return null;
  }

  return placements.some((occupied) => placementsOverlap(placement, occupied))
    ? null
    : placement;
}

/**
 * The anchor→pointer rectangle, trimmed so that every cell inside it is free.
 *
 * The region grows *from* the anchor, so the trim walks outward and stops at the
 * first obstruction rather than jumping over it — a region straddling an
 * occupied cell could never be filled by a single item. Width is settled first,
 * along the anchor's own row, and the height then only extends while every
 * column of that width stays free, which keeps the result a rectangle without
 * making the user's dominant drag axis lose to their incidental one.
 */
export function getDashboardFreeRegion(
  anchor: DashboardFreeCell,
  cell: DashboardFreeCell,
  freeCells: readonly DashboardFreeCell[],
  columns: number,
  rows: number,
): DashboardPlacement {
  const free = new Set(freeCells.map(({ column, row }) => `${column}:${row}`));
  const isFree = (column: number, row: number) => free.has(`${column}:${row}`);
  const reach = (
    from: number,
    to: number,
    limit: number,
    canTake: (value: number) => boolean,
  ) => {
    const step = to >= from ? 1 : -1;
    let last = from;

    for (let value = from + step; step > 0 ? value <= to : value >= to; ) {
      if (value < 0 || value >= limit || !canTake(value)) break;
      last = value;
      value += step;
    }

    return last;
  };

  const lastColumn = reach(anchor.column, cell.column, columns, (column) =>
    isFree(column, anchor.row),
  );
  const column = Math.min(anchor.column, lastColumn);
  const spannedColumns = Math.abs(lastColumn - anchor.column) + 1;
  const lastRow = reach(anchor.row, cell.row, rows, (row) => {
    for (let offset = 0; offset < spannedColumns; offset += 1) {
      if (!isFree(column + offset, row)) return false;
    }

    return true;
  });

  return {
    column,
    row: Math.min(anchor.row, lastRow),
    columns: spannedColumns,
    rows: Math.abs(lastRow - anchor.row) + 1,
  };
}

export interface DashboardChildMinimum {
  columns: number;
  rows: number;
  /**
   * Stacks only, and only on the stack's own axis: past this the surplus has no
   * child able to take it, so growing further would only add trailing space.
   */
  maxColumns?: number;
  maxRows?: number;
}

const CONTAINER_KIND_BY_DISPLAY_NAME: Record<string, DashboardContainerKind> = {
  DashboardGrid: 'grid',
  DashboardHorizontalStack: 'horizontal-stack',
  DashboardVerticalStack: 'vertical-stack',
  DashboardTabs: 'tabs',
};

const LAYOUT_CONTAINER_DISPLAY_NAMES = new Set(
  Object.keys(CONTAINER_KIND_BY_DISPLAY_NAME),
);

/**
 * Identity by `displayName` rather than by reference. A duplicated module
 * instance — two copies of Dashboard in one graph, or an element created against
 * a separately bundled re-export — is a different function object for the same
 * component, and a reference check silently reports depth 0 for it. Depth 0 then
 * widens the drop guard, the tree accepts a fourth nesting level, and the commit
 * throws during render instead of being rejected during the drag.
 */
function getDashboardChildDisplayName(child: ReactNode): string | undefined {
  if (!isValidElement(child)) return undefined;

  return (child.type as { displayName?: string }).displayName;
}

export function getDashboardDescendantContainerDepth(
  children: ReactNode,
): number {
  return Children.toArray(children).reduce<number>((maximumDepth, child) => {
    const displayName = getDashboardChildDisplayName(child);
    if (!displayName || !isValidElement(child)) return maximumDepth;
    const childChildren = (child.props as { children?: ReactNode }).children;

    if (LAYOUT_CONTAINER_DISPLAY_NAMES.has(displayName)) {
      return Math.max(
        maximumDepth,
        1 + getDashboardDescendantContainerDepth(childChildren),
      );
    }

    if (displayName === 'DashboardTab') {
      return Math.max(
        maximumDepth,
        getDashboardDescendantContainerDepth(childChildren),
      );
    }

    return maximumDepth;
  }, 0);
}

/** The placement props a layout node accepts, as read off an unrendered child. */
type DashboardBoundedProps = DashboardPlacementProps & {
  minColumns?: number;
  maxColumns?: number;
  minRows?: number;
  maxRows?: number;
  'data-dashboard-add-slot'?: unknown;
  children?: ReactNode;
};

/** A node's own span limits, floored by whatever it contains. */
export interface DashboardNodeBounds {
  minColumns: number;
  maxColumns: number;
  minRows: number;
  maxRows: number;
  columns: number;
  rows: number;
}

/**
 * What one child of a container can be squeezed to, and stretched to.
 *
 * A container's declared `minColumns` is not the whole story: it cannot be
 * narrower than its own contents need either, and that floor is only knowable
 * one level further down. So this recurses through `getContainerChildMinimum`,
 * which is how a stack learns that the nested stack inside it has a floor of
 * its own rather than the `1` its props claim.
 */
export function getDashboardNodeBounds(
  child: ReactNode,
  capacityColumns: number,
  capacityRows: number,
): DashboardNodeBounds | null {
  if (!isValidElement(child)) return null;
  const props = child.props as DashboardBoundedProps;
  if (props['data-dashboard-add-slot'] !== undefined) return null;

  const placement = normalizePlacement(props, capacityColumns, capacityRows);
  let minColumns = clampSpan(props.minColumns, 1);
  let minRows = clampRows(props.minRows, 1);
  const displayName = getDashboardChildDisplayName(child);
  const kind = displayName
    ? CONTAINER_KIND_BY_DISPLAY_NAME[displayName]
    : undefined;

  if (kind) {
    const nested = getContainerChildMinimum(
      kind,
      props.children,
      placement.columns,
      placement.rows,
    );
    minColumns = Math.max(minColumns, nested.columns);
    minRows = Math.max(minRows, nested.rows);
  }

  return {
    minColumns: Math.min(minColumns, capacityColumns),
    maxColumns: Math.max(
      minColumns,
      clampSpan(props.maxColumns, capacityColumns),
    ),
    minRows: Math.min(minRows, capacityRows),
    maxRows: Math.max(minRows, clampRows(props.maxRows, capacityRows)),
    columns: placement.columns,
    rows: placement.rows,
  };
}

/** One child's share of a stack, in the terms the distribution reasons about. */
export interface DashboardStackItem {
  min: number;
  max: number;
  /** The stored span, which acts as a preference rather than a position. */
  weight: number;
}

/**
 * Re-share a stack's capacity among its children after the stack itself has
 * been resized.
 *
 * Only the stack's own resize runs this. A child's span is otherwise its own:
 * it is a size, not a weight, and nothing else may move it — which is why
 * resizing one child leaves every other child exactly where it was.
 *
 * Everyone starts at the span they already hold and only the difference is
 * reconciled: surplus tracks go to whichever child sits furthest below its
 * proportional share, and a shortfall is taken from whichever sits furthest
 * above it. So widening a stack stretches its children and narrowing one
 * squeezes them, down to the floor their own constraints set, while a stack
 * whose children already fit is left untouched.
 *
 * The two ends are deliberate rather than clamped away. Above the sum of the
 * children's maxima nothing can take the surplus, so it is left as trailing
 * space. Below the sum of their minima no distribution exists at all, and the
 * largest children give way one track at a time rather than the last child
 * being pushed out of the container.
 */
export function distributeDashboardStackSpans(
  items: readonly DashboardStackItem[],
  capacity: number,
): number[] {
  if (items.length === 0) return [];

  const sizes = items.map((item) =>
    Math.max(1, clamp(item.weight, item.min, item.max)),
  );
  const totalWeight = items.reduce(
    (total, item) => total + Math.max(1, item.weight),
    0,
  );
  const share = (index: number) =>
    (capacity * Math.max(1, items[index].weight)) / totalWeight;
  let total = sizes.reduce((sum, size) => sum + size, 0);

  while (total > capacity) {
    let worst = -1;
    let excess = 0;

    for (const [index, size] of sizes.entries()) {
      if (size <= Math.max(1, items[index].min)) continue;
      const over = size - share(index);
      if (worst < 0 || over > excess) {
        worst = index;
        excess = over;
      }
    }

    if (worst < 0) break;
    sizes[worst] -= 1;
    total -= 1;
  }

  while (total < capacity) {
    let best = -1;
    let deficit = 0;

    for (const [index, item] of items.entries()) {
      if (sizes[index] >= item.max) continue;
      const under = share(index) - sizes[index];
      if (best < 0 || under > deficit) {
        best = index;
        deficit = under;
      }
    }

    if (best < 0) break;
    sizes[best] += 1;
    total += 1;
  }

  return sizes;
}

/**
 * The span a stack's children take up along its own axis.
 *
 * A stack child's span is its own size, so this is simply the sum — and the
 * room left over is what an arriving item, or a child growing, has to fit in.
 */
export function getDashboardStackUsage(
  kind: DashboardContainerKind,
  children: ReactNode,
  columns: number,
  rows: number,
): number {
  const isHorizontal = kind === 'horizontal-stack';
  if (!isHorizontal && kind !== 'vertical-stack') return 0;

  return getDashboardChildPlacements(kind, children, columns, rows).reduce(
    (total, placement) =>
      total + (isHorizontal ? placement.columns : placement.rows),
    0,
  );
}

/**
 * A stack's children, squeezed back inside it when they no longer fit.
 *
 * Every path Dashboard controls keeps a stack's children within its capacity —
 * the stack's own resize reports their new spans, and an arriving item has to
 * fit in what is left over. This is the guard for the states it does not
 * control: a controlled `columns` written straight onto a stack, or a stack
 * carried into a narrower parent. Without it the overflow wraps onto a second
 * row, which reads as a broken layout rather than a rejected value.
 *
 * It never stretches. A child that fits is drawn at exactly the span the
 * consumer stored, which is what makes resizing one child a local change.
 */
export function fitDashboardStackChildren(
  kind: DashboardContainerKind,
  children: ReactNode,
  columns: number,
  rows: number,
): ReactNode {
  const isHorizontal = kind === 'horizontal-stack';
  if (!isHorizontal && kind !== 'vertical-stack') return children;

  const capacity = isHorizontal ? columns : rows;
  const list = Children.toArray(children);
  const positions: number[] = [];
  const items: DashboardStackItem[] = [];
  let used = 0;

  list.forEach((child, position) => {
    const bounds = getDashboardNodeBounds(child, columns, rows);
    if (!bounds) return;

    positions.push(position);
    items.push(
      isHorizontal
        ? {
            min: bounds.minColumns,
            max: bounds.maxColumns,
            weight: bounds.columns,
          }
        : { min: bounds.minRows, max: bounds.maxRows, weight: bounds.rows },
    );
    used += isHorizontal ? bounds.columns : bounds.rows;
  });

  if (items.length === 0 || used <= capacity) return children;

  const sizes = distributeDashboardStackSpans(items, capacity);
  const next = [...list];
  let cursor = 0;

  positions.forEach((position, index) => {
    const child = next[position];
    const size = sizes[index];
    const origin = cursor;
    cursor += size;
    if (!isValidElement<DashboardBoundedProps>(child)) return;

    next[position] = cloneElement(
      child,
      isHorizontal
        ? { columns: size, column: origin, row: 0 }
        : { rows: size, row: origin, column: 0 },
    );
  });

  return next;
}

export function getContainerChildMinimum(
  kind: DashboardContainerKind,
  children: ReactNode,
  capacityColumns: number,
  capacityRows: number,
): DashboardChildMinimum {
  const directChildren =
    kind === 'tabs'
      ? Children.toArray(children).flatMap((tab) => {
          if (!isValidElement(tab)) return [];
          return Children.toArray(
            (tab.props as { children?: ReactNode }).children,
          );
        })
      : Children.toArray(children);
  const placements = directChildren.flatMap((child) => {
    if (!isValidElement(child)) return [];
    const props = child.props as DashboardPlacementProps & {
      'data-dashboard-add-slot'?: unknown;
    };
    if (props['data-dashboard-add-slot'] !== undefined) return [];

    return [normalizePlacement(props, capacityColumns, capacityRows)];
  });

  if (placements.length === 0) return { columns: 1, rows: 1 };

  // A stack distributes its own axis, so its floor there is the sum of what its
  // children can be squeezed to — not the sum of the spans they happen to hold,
  // which would pin the stack at its current size. The cross axis is not
  // distributed, so it keeps the tallest (or widest) child as its floor.
  if (kind === 'horizontal-stack' || kind === 'vertical-stack') {
    const bounds = directChildren.flatMap((child) => {
      const childBounds = getDashboardNodeBounds(
        child,
        capacityColumns,
        capacityRows,
      );

      return childBounds ? [childBounds] : [];
    });

    if (kind === 'horizontal-stack') {
      return {
        columns: Math.min(
          capacityColumns,
          bounds.reduce((total, item) => total + item.minColumns, 0),
        ),
        rows: Math.min(
          capacityRows,
          Math.max(...placements.map((placement) => placement.rows)),
        ),
        maxColumns: bounds.reduce((total, item) => total + item.maxColumns, 0),
      };
    }

    return {
      columns: Math.min(
        capacityColumns,
        Math.max(...placements.map((placement) => placement.columns)),
      ),
      rows: Math.min(
        capacityRows,
        bounds.reduce((total, item) => total + item.minRows, 0),
      ),
      maxRows: bounds.reduce((total, item) => total + item.maxRows, 0),
    };
  }

  return {
    columns: Math.min(
      capacityColumns,
      Math.max(
        ...placements.map((placement) => placement.column + placement.columns),
      ),
    ),
    rows: Math.min(
      capacityRows,
      Math.max(
        ...placements.map((placement) => placement.row + placement.rows),
      ),
    ),
  };
}

export function hasContainerLayoutChildren(
  kind: DashboardContainerKind,
  children: ReactNode,
): boolean {
  const directChildren =
    kind === 'tabs'
      ? Children.toArray(children).flatMap((tab) => {
          if (!isValidElement(tab)) return [];
          return Children.toArray(
            (tab.props as { children?: ReactNode }).children,
          );
        })
      : Children.toArray(children);

  return directChildren.some((child) => {
    if (!isValidElement(child)) return child !== null && child !== undefined;
    const props = child.props as { 'data-dashboard-add-slot'?: unknown };

    return props['data-dashboard-add-slot'] === undefined;
  });
}

/**
 * The largest box a node can grow into from its own origin.
 *
 * Scans right then down from the origin, shrinking the row budget as an occupied
 * column is met — the standard largest-rectangle-from-a-corner walk. Used by the
 * "Fill available space" command and to cap the press-and-drag add region.
 *
 * `Board/grid-core` ships `maxFreeRectAt`, which does exactly this and is already
 * in the bundle; Dashboard keeps its own placement maths for now, so this stays
 * local until that engine is adopted wholesale.
 */
export function getLargestFreeRect(
  origin: DashboardFreeCell,
  occupied: readonly DashboardPlacement[],
  columns: number,
  rows: number,
  maxColumns = columns,
  maxRows = rows,
): DashboardPlacement {
  const isFree = (column: number, row: number) =>
    !occupied.some(
      (placement) =>
        column >= placement.column &&
        column < placement.column + placement.columns &&
        row >= placement.row &&
        row < placement.row + placement.rows,
    );

  const columnLimit = Math.min(columns, origin.column + maxColumns);
  const rowLimit = Math.min(rows, origin.row + maxRows);
  let best: DashboardPlacement = {
    column: origin.column,
    row: origin.row,
    columns: 1,
    rows: 1,
  };
  let rowBudget = rowLimit - origin.row;

  for (let column = origin.column; column < columnLimit; column += 1) {
    let reach = 0;
    while (reach < rowBudget && isFree(column, origin.row + reach)) reach += 1;
    if (reach === 0) break;

    rowBudget = Math.min(rowBudget, reach);
    const candidate: DashboardPlacement = {
      column: origin.column,
      row: origin.row,
      columns: column - origin.column + 1,
      rows: rowBudget,
    };

    if (candidate.columns * candidate.rows > best.columns * best.rows) {
      best = candidate;
    }
  }

  return best;
}
