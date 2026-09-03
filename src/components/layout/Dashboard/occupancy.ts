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
  /** Stacks only: what the current children can be squeezed down to. */
  stackFloor = 0,
): DashboardFreeCell[] {
  // A stack's children fill it, so its insertion point is never leftover space:
  // it sits in a track of its own past the last column (or row), and it exists
  // whenever the residents could squeeze far enough to seat one more item.
  if (kind === 'horizontal-stack') {
    return stackFloor < columns ? [{ column: columns, row: 0 }] : [];
  }

  if (kind === 'vertical-stack') {
    return stackFloor < rows ? [{ column: 0, row: rows }] : [];
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
  /** Stacks only: what the existing children can be squeezed down to. */
  stackFloor = 0,
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

    // A stack shares itself out, so an arriving item does not need free space
    // of its own size — it needs the residents to be able to squeeze down far
    // enough to seat its minimum. Its span is stored as a weight and the
    // distribution decides what it is actually drawn at, so it is only held
    // inside what the stack has left to give.
    const available =
      (isHorizontal ? parentColumns : parentRows) - Math.max(0, stackFloor);
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
 * How a stack hands its own capacity to its children.
 *
 * A stack's children are a sequence, not a set of addresses, so a stored span
 * is a *preference* rather than a position: the stack always fills itself, and
 * the spans only say how the space is shared out. Everyone starts at their own
 * minimum and each surplus track goes to whichever child sits furthest below
 * its proportional share — so widening a stack stretches its children and
 * narrowing one squeezes them, down to the floor their own constraints set.
 *
 * The two ends are deliberate rather than clamped away. Above the sum of the
 * children's maxima nothing can take the surplus, so it is left as trailing
 * space. Below the sum of their minima no distribution exists at all, and the
 * largest children give way one track at a time rather than the last child
 * being pushed out of the container — a container's own bounds should keep it
 * out of that range, but a consumer writing placements directly can still get
 * there.
 */
export function distributeDashboardStackSpans(
  items: readonly DashboardStackItem[],
  capacity: number,
): number[] {
  if (items.length === 0) return [];

  const sizes = items.map((item) => Math.max(1, Math.min(item.min, item.max)));
  const totalWeight = items.reduce(
    (total, item) => total + Math.max(1, item.weight),
    0,
  );
  let total = sizes.reduce((sum, size) => sum + size, 0);

  while (total > capacity) {
    let largest = -1;
    for (const [index, size] of sizes.entries()) {
      if (size > 1 && (largest < 0 || size > sizes[largest])) largest = index;
    }
    if (largest < 0) break;
    sizes[largest] -= 1;
    total -= 1;
  }

  while (total < capacity) {
    let best = -1;
    let bestDeficit = 0;

    for (const [index, item] of items.entries()) {
      if (sizes[index] >= item.max) continue;
      const share = (capacity * Math.max(1, item.weight)) / totalWeight;
      const deficit = share - sizes[index];
      if (best < 0 || deficit > bestDeficit) {
        best = index;
        bestDeficit = deficit;
      }
    }

    if (best < 0) break;
    sizes[best] += 1;
    total += 1;
  }

  return sizes;
}

/** One child's room to move when a neighbour is resized. */
export interface DashboardStackBound {
  min: number;
  max: number;
}

/**
 * A stack child's resize, resolved the way a splitter behaves.
 *
 * A stack is always full, so a child cannot simply claim more space: it grows
 * only by taking tracks from a neighbour and shrinks only by handing them over.
 * Tracks are taken from — or given to — the next child in the sequence first
 * and the previous one after, which is what makes dragging the grip on a
 * child's trailing edge read as moving the seam between it and what follows.
 *
 * Without this a size command inside a stack does nothing visible: it would
 * only nudge the stored span, and `distributeDashboardStackSpans` hands the
 * same track straight back to the child that is already proportionally the
 * largest — usually the one that just grew.
 *
 * Returns every child's new span, or `null` when nothing can give way.
 */
export function resolveDashboardStackResize(
  sizes: readonly number[],
  bounds: readonly DashboardStackBound[],
  index: number,
  target: number,
): number[] | null {
  const own = bounds[index];
  if (!own || index < 0 || index >= sizes.length) return null;

  const next = [...sizes];
  const wanted = clamp(target, own.min, own.max);
  const order: number[] = [];
  for (let position = index + 1; position < next.length; position += 1) {
    order.push(position);
  }
  for (let position = index - 1; position >= 0; position -= 1) {
    order.push(position);
  }

  while (next[index] < wanted) {
    const donor = order.find(
      (position) => next[position] > bounds[position].min,
    );
    if (donor === undefined) break;
    next[donor] -= 1;
    next[index] += 1;
  }

  while (next[index] > wanted) {
    const taker = order.find(
      (position) => next[position] < bounds[position].max,
    );
    if (taker === undefined) break;
    next[taker] += 1;
    next[index] -= 1;
  }

  return next[index] === sizes[index] ? null : next;
}

/**
 * The children of a stack, re-spanned to fill it exactly.
 *
 * Applied at render rather than written back through `onPlacementChange`: the
 * distribution is a function of the stored spans and the stack's own size, so
 * making the consumer persist it would mean a write on every frame of a stack
 * resize to arrive back at a value the layout can derive on its own. Cloning
 * also keeps the DOM honest — a child reports the span it is actually drawn at,
 * so the drag engine, the free-cell map and the node menu all agree with the
 * picture.
 */
export function applyDashboardStackDistribution(
  kind: DashboardContainerKind,
  children: ReactNode,
  columns: number,
  rows: number,
): ReactNode {
  const isHorizontal = kind === 'horizontal-stack';
  if (!isHorizontal && kind !== 'vertical-stack') return children;

  const list = Children.toArray(children);
  const positions: number[] = [];
  const items: DashboardStackItem[] = [];

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
  });

  if (items.length === 0) return children;

  const sizes = distributeDashboardStackSpans(
    items,
    isHorizontal ? columns : rows,
  );
  const next = [...list];
  let cursor = 0;
  let changed = false;

  positions.forEach((position, index) => {
    const child = next[position];
    const size = sizes[index];
    const origin = cursor;
    cursor += size;
    if (!isValidElement<DashboardBoundedProps>(child)) return;

    // The origin is re-derived alongside the span. A stack packs by sequence,
    // so a child's stored coordinate is only whatever the consumer last wrote
    // and would otherwise contradict the span it is drawn at — and that
    // coordinate is what the midpoint maths behind reordering reads back off
    // the DOM.
    const applied = isHorizontal
      ? { columns: size, column: origin, row: 0 }
      : { rows: size, row: origin, column: 0 };

    if (
      child.props.columns === applied.columns &&
      child.props.rows === applied.rows &&
      child.props.column === applied.column &&
      child.props.row === applied.row
    ) {
      return;
    }

    next[position] = cloneElement(child, applied);
    changed = true;
  });

  return changed ? next : children;
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
