import { Children, isValidElement } from 'react';

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

  if (kind === 'horizontal-stack') {
    resolvedRows = Math.min(parentRows, maxRows);
  } else if (kind === 'vertical-stack') {
    resolvedColumns = Math.min(parentColumns, maxColumns);
  } else if (kind === 'tabs') {
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

  const origin = region ?? cell;
  const placement: DashboardPlacement = {
    column: kind === 'vertical-stack' || kind === 'tabs' ? 0 : origin.column,
    row: kind === 'horizontal-stack' || kind === 'tabs' ? 0 : origin.row,
    columns: resolvedColumns,
    rows: resolvedRows,
  };

  if (
    placement.column + placement.columns > parentColumns ||
    placement.row + placement.rows > parentRows
  ) {
    return null;
  }

  const isBlocked = placements.some((occupied) => {
    if (kind === 'horizontal-stack') {
      return !(
        placement.column + placement.columns <= occupied.column ||
        occupied.column + occupied.columns <= placement.column
      );
    }

    if (kind === 'vertical-stack') {
      return !(
        placement.row + placement.rows <= occupied.row ||
        occupied.row + occupied.rows <= placement.row
      );
    }

    return placementsOverlap(placement, occupied);
  });

  return isBlocked ? null : placement;
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
}

const LAYOUT_CONTAINER_DISPLAY_NAMES = new Set([
  'DashboardGrid',
  'DashboardHorizontalStack',
  'DashboardVerticalStack',
  'DashboardTabs',
]);

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

  if (kind === 'horizontal-stack') {
    return {
      columns: Math.min(
        capacityColumns,
        placements.reduce((total, placement) => total + placement.columns, 0),
      ),
      rows: Math.min(
        capacityRows,
        Math.max(...placements.map((placement) => placement.rows)),
      ),
    };
  }

  if (kind === 'vertical-stack') {
    return {
      columns: Math.min(
        capacityColumns,
        Math.max(...placements.map((placement) => placement.columns)),
      ),
      rows: Math.min(
        capacityRows,
        placements.reduce((total, placement) => total + placement.rows, 0),
      ),
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
