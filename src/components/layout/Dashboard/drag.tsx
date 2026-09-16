import { useState } from 'react';
import { createPortal } from 'react-dom';

import { useEvent } from '../../../_internal/hooks';
import { CloseCircleIcon } from '../../../icons/CloseCircleIcon';

import { distributeDashboardStackSpans } from './occupancy';
import {
  clamp,
  DASHBOARD_ROOT_GAP,
  placementsOverlap,
  pointToCell,
} from './placement';
import { DropPlaceholderElement } from './styles';

import type { CSSProperties } from 'react';
import type {
  DashboardContainerKind,
  DashboardMetrics,
  DashboardParentKind,
  DashboardPlacement,
  DashboardPlacementChangeInput,
  DashboardPlacementChangeItem,
  DashboardPlacementChangeReason,
} from './types';

export interface DashboardPlacementGesture {
  origin: DashboardPlacement;
  current: DashboardPlacement;
  currentItems: DashboardPlacementChangeItem[];
  /** Siblings the current landing pushes aside; reported alongside the group. */
  currentDisplaced?: DashboardPlacementChangeItem[];
  sourceParentId: string | null;
  destinationParentId: string | null;
  /** Accumulated page-space movement, used for quantized same-parent steps. */
  deltaX: number;
  deltaY: number;
  /**
   * The live pointer position in client space.
   *
   * Not `pointerStart + delta`: `useMove` reports page-space deltas, while every
   * rectangle hit testing compares against is client-space, so scrolling during
   * a drag put the two coordinate systems a scroll-offset apart and the pointer
   * appeared to be somewhere it was not.
   */
  clientX: number;
  clientY: number;
  grabOffsetX: number;
  grabOffsetY: number;
  /** Destination rectangles measured once, at gesture start. */
  frozen?: DashboardTargetGeometry;
  /** Set by Escape or `pointercancel`; suppresses the commit. */
  cancelled?: boolean;
  /**
   * A stack container's own children as they stood before the gesture.
   *
   * Only a stack container fills this, and only so a cancelled resize can put
   * its children back exactly — see `readOwnDashboardStackChildren` for why
   * re-resolving the origin span is not the same thing.
   */
  originChildren: DashboardPlacementChangeItem[];
  /**
   * The source parent's other children as they stood before the gesture.
   *
   * A cancel has to undo more than the moved item: a consumer that applies
   * previews has also written every sibling the landing pushed aside, and their
   * pre-gesture placements are no longer anywhere to be read — the DOM now
   * holds the previewed arrangement. Snapshotting them at the start is the only
   * moment they exist. Cross-parent previews are proposals a consumer is not
   * expected to persist before the commit, so only the source is captured.
   */
  originSiblings: DashboardPlacementChangeItem[];
  /**
   * A stack child's growing room, measured once at gesture start.
   *
   * Read live it would be a feedback loop: the consumer applies each preview,
   * so the space the drag has already claimed disappears from the parent's
   * total and the next frame would clamp the child straight back.
   */
  stackFree: number;
  keyboardColumns: number;
  keyboardRows: number;
  columnStep: number;
  rowStep: number;
  input: DashboardPlacementChangeInput;
  canCommit: boolean;
  items: DashboardGestureItem[];
}

export interface DashboardGestureItem {
  id: string;
  origin: DashboardPlacement;
  element: HTMLElement;
  minColumns: number;
  maxColumns: number;
  minRows: number;
  maxRows: number;
}

export interface DashboardDropTarget {
  parentId: string | null;
  kind: DashboardParentKind;
  columns: number;
  rows: number;
  depth: number;
  rect: DOMRect;
  element: HTMLElement;
}

export type DashboardDropStatus = 'valid' | 'danger';

export interface DashboardDropPreview {
  id: string;
  target: HTMLElement;
  placement: DashboardPlacement;
  status: DashboardDropStatus;
  coversAddSlot: boolean;
  style: CSSProperties;
}

export function parseDashboardAncestorIds(element: HTMLElement): string[] {
  const value = element.dataset.dashboardAncestorIds;
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

/**
 * Every destination under the pointer, best first.
 *
 * Returning a list rather than a winner is load-bearing. The best candidate is
 * the deepest one, and the deepest one is also the most likely to refuse — a
 * nested container is small, so a node that does not fit it is common. When the
 * caller only had the winner, a refusal ended the frame with no proposal at all
 * and the gesture froze; releasing there discarded the whole drag even though an
 * ancestor under the same pointer would have taken it. The caller now walks the
 * list and keeps the first destination that actually yields a placement.
 */
export function findDashboardDropTargets(
  node: HTMLElement,
  clientX: number,
  clientY: number,
  movingId: string,
  isContainer: boolean,
  maximumContainerParentDepth = 2,
  frozen?: DashboardTargetGeometry,
): DashboardDropTarget[] {
  const root = node.closest<HTMLElement>('[data-dashboard-root]');
  if (!root) return [];

  const candidates = collectDashboardDropElements(root)
    .flatMap((element) => {
      const rect =
        readFrozenRect(frozen, element) ?? element.getBoundingClientRect();
      if (
        rect.width <= 0 ||
        rect.height <= 0 ||
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return [];
      }

      const parentId = element.dataset.dashboardParentId || null;
      const kind = (element.dataset.dashboardContainerKind ??
        'root') as DashboardParentKind;
      const depth = Number(element.dataset.dashboardDepth ?? 0);
      const ancestorIds = parseDashboardAncestorIds(element);

      if (!isContainer && kind === 'root') return [];
      if (
        isContainer &&
        (depth > maximumContainerParentDepth ||
          parentId === movingId ||
          ancestorIds.includes(movingId))
      ) {
        return [];
      }

      return [
        {
          parentId,
          kind,
          columns: Math.max(1, Number(element.dataset.dashboardColumns ?? 12)),
          rows: Math.max(1, Number(element.dataset.dashboardRows ?? 1)),
          depth,
          rect,
          element,
        },
      ];
    })
    .sort(
      (first, second) =>
        second.depth - first.depth ||
        first.rect.width * first.rect.height -
          second.rect.width * second.rect.height,
    );

  return candidates;
}

/**
 * The drop targets belonging to one Dashboard.
 *
 * `querySelectorAll` alone is wrong twice over: the root carries the drop-target
 * attribute itself, so passing it explicitly *and* matching it lists it twice;
 * and a second Dashboard rendered inside a widget of this one contributes its
 * own content grids, whose depths restart at 1. Those win the depth sort and
 * hand the outer consumer a `destinationParentId` from a tree it does not own.
 */
function collectDashboardDropElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>('[data-dashboard-drop-target]'),
  )
    .filter((element) => element.closest('[data-dashboard-root]') === root)
    .concat(root);
}

/**
 * The node's own parent, as a drop target.
 *
 * Keyboard movement never leaves the parent and has no pointer to hit-test, but
 * it still lands on occupied cells — before this it skipped occupancy entirely
 * and committed overlaps with no danger signal at all.
 */
export function getOwnDashboardDropTarget(
  node: HTMLElement,
): DashboardDropTarget | null {
  const element = node.parentElement;
  if (!element || element.dataset.dashboardDropTarget === undefined) {
    return null;
  }

  return {
    parentId: element.dataset.dashboardParentId || null,
    kind: (element.dataset.dashboardContainerKind ??
      'root') as DashboardParentKind,
    columns: Math.max(1, Number(element.dataset.dashboardColumns ?? 12)),
    rows: Math.max(1, Number(element.dataset.dashboardRows ?? 1)),
    depth: Number(element.dataset.dashboardDepth ?? 0),
    rect: element.getBoundingClientRect(),
    element,
  };
}

/**
 * Destination rectangles, measured once at the start of a gesture.
 *
 * Hit testing cannot read live geometry here. The consumer owns the layout and
 * applies every `preview` placement, so the node moves as the pointer moves —
 * which moves the rectangles the next frame's hit test depends on, and the
 * result oscillates between two destinations. Freezing at gesture start makes
 * the pointer the only thing that varies. `Board` reaches the same conclusion
 * for the same reason (see `use-board-registry.ts`).
 *
 * The scroll offset is frozen alongside the rectangles. A client-space rectangle
 * is only valid at the scroll position it was measured at, so reading one back
 * has to undo whatever scrolling has happened since — otherwise scrolling during
 * a drag silently moves every destination out from under the pointer.
 */
export interface DashboardTargetGeometry {
  rects: Map<HTMLElement, DOMRect>;
  scrollX: number;
  scrollY: number;
}

export function freezeDashboardTargetGeometry(
  node: HTMLElement,
): DashboardTargetGeometry {
  const root = node.closest<HTMLElement>('[data-dashboard-root]');
  const frozen: DashboardTargetGeometry = {
    rects: new Map(),
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  };
  if (!root) return frozen;

  for (const element of collectDashboardDropElements(root)) {
    frozen.rects.set(element, element.getBoundingClientRect());
  }

  return frozen;
}

/** A frozen rectangle brought back into the current client coordinate space. */
function readFrozenRect(
  frozen: DashboardTargetGeometry | undefined,
  element: HTMLElement,
): DOMRect | undefined {
  const rect = frozen?.rects.get(element);
  if (!rect || !frozen) return undefined;

  const shiftX = frozen.scrollX - window.scrollX;
  const shiftY = frozen.scrollY - window.scrollY;
  if (shiftX === 0 && shiftY === 0) return rect;

  return new DOMRect(
    rect.left + shiftX,
    rect.top + shiftY,
    rect.width,
    rect.height,
  );
}

export function getCrossParentPlacement(
  target: DashboardDropTarget,
  gesture: DashboardPlacementGesture,
  minColumns: number,
  minRows: number,
  isContainer: boolean,
  metrics: DashboardMetrics,
): DashboardPlacement | null {
  if (target.kind === 'root') {
    if (!isContainer) return null;

    const siblingMidpoints = Array.from(target.element.children)
      .filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement &&
          child.dataset.dashboardNode === 'container' &&
          child.dataset.dashboardNodeId !== undefined,
      )
      .map((child) => {
        const rect = child.getBoundingClientRect();
        return rect.top + rect.height / 2;
      })
      .filter((midpoint) => Number.isFinite(midpoint));
    const pointerY = gesture.clientY;

    return {
      column: 0,
      row: siblingMidpoints.filter((midpoint) => midpoint < pointerY).length,
      columns: 12,
      rows: gesture.origin.rows,
    };
  }

  const grabbedItem = gesture.items[0];
  const columns = Math.min(
    target.kind === 'vertical-stack'
      ? grabbedItem.maxColumns
      : gesture.origin.columns,
    target.columns,
  );
  const rows = Math.min(
    target.kind === 'horizontal-stack'
      ? grabbedItem.maxRows
      : gesture.origin.rows,
    target.rows,
  );
  if (columns < minColumns || rows < minRows) return null;

  const corner = pointToCell(
    {
      x: gesture.clientX - gesture.grabOffsetX,
      y: gesture.clientY - gesture.grabOffsetY,
    },
    target.rect,
    target.columns,
    target.rows,
    metrics,
    'nearest',
  );

  return {
    column:
      target.kind === 'vertical-stack'
        ? 0
        : Math.min(corner.column, target.columns - columns),
    row:
      target.kind === 'horizontal-stack'
        ? 0
        : Math.min(corner.row, target.rows - rows),
    columns,
    rows,
  };
}

export function readDashboardNodePlacement(
  element: HTMLElement,
): DashboardPlacement | null {
  const column = Number(element.dataset.dashboardColumn);
  const row = Number(element.dataset.dashboardRow);
  const columns = Number(element.dataset.dashboardColumns);
  const rows = Number(element.dataset.dashboardRows);

  if (![column, row, columns, rows].every(Number.isFinite)) return null;

  return { column, row, columns, rows };
}

export function getDashboardGestureItem(
  id: string,
  origin: DashboardPlacement,
  element: HTMLElement,
): DashboardGestureItem {
  const readConstraint = (
    value: string | undefined,
    fallback: number,
  ): number => {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return {
    id,
    origin,
    element,
    minColumns: readConstraint(
      element.dataset.dashboardMinColumns,
      origin.columns,
    ),
    maxColumns: readConstraint(
      element.dataset.dashboardMaxColumns,
      origin.columns,
    ),
    minRows: readConstraint(element.dataset.dashboardMinRows, origin.rows),
    maxRows: readConstraint(element.dataset.dashboardMaxRows, origin.rows),
  };
}

export interface DashboardSibling {
  id: string;
  placement: DashboardPlacement;
  /** How far this node can be squeezed, which is what a stack asks about. */
  minColumns: number;
  minRows: number;
}

/** The stationary nodes a landing has to coexist with, read from the DOM. */
export function getDashboardDropSiblings(
  target: DashboardDropTarget,
  movingIds: ReadonlySet<string>,
): DashboardSibling[] {
  return Array.from(target.element.children).flatMap((child) => {
    if (!(child instanceof HTMLElement)) return [];
    if (!child.dataset.dashboardNode) return [];
    const id = child.dataset.dashboardNodeId ?? '';
    if (movingIds.has(id)) return [];
    if (child.dataset.dashboardAddSlot !== undefined) return [];

    const placement = readDashboardNodePlacement(child);
    if (!placement) return [];

    const minColumns = Number(child.dataset.dashboardMinColumns);
    const minRows = Number(child.dataset.dashboardMinRows);

    return [
      {
        id,
        placement,
        minColumns: Number.isFinite(minColumns) ? minColumns : 1,
        minRows: Number.isFinite(minRows) ? minRows : 1,
      },
    ];
  });
}

/** One child's room to move when the stack around it is resized. */
export interface DashboardStackBound {
  min: number;
  max: number;
}

/** One child's room to move when the stack around it is resized. */
export interface DashboardStackBound {
  min: number;
  max: number;
}

/** A stack's children in sequence, with the room each has to give or take. */
export interface DashboardStackRow {
  ids: string[];
  placements: DashboardPlacement[];
  sizes: number[];
  bounds: DashboardStackBound[];
}

/** The axis a stack shares out, or `null` for a layout addressed by position. */
export function readDashboardStackAxis(
  parentElement: HTMLElement | null,
): 'columns' | 'rows' | null {
  const kind = parentElement?.dataset.dashboardContainerKind;

  if (kind === 'horizontal-stack') return 'columns';
  if (kind === 'vertical-stack') return 'rows';

  return null;
}

/**
 * Read a stack's row off the DOM, in order and with its constraints.
 *
 * The sibling readers elsewhere in this module deliberately drop the moving
 * node, because a landing only has to coexist with what stays put. Re-sharing a
 * stack is the opposite: every child takes part, so the sequence has to be
 * complete and ordered for "the next child" to mean anything.
 */
export function readDashboardStackRow(
  content: HTMLElement | null,
  axis: 'columns' | 'rows',
): DashboardStackRow | null {
  if (!content) return null;
  const row: DashboardStackRow = {
    ids: [],
    placements: [],
    sizes: [],
    bounds: [],
  };

  for (const child of Array.from(content.children)) {
    if (!(child instanceof HTMLElement)) continue;
    if (!child.dataset.dashboardNode) continue;
    if (child.dataset.dashboardAddSlot !== undefined) continue;
    const placement = readDashboardNodePlacement(child);
    if (!placement) continue;

    const min = Number(
      axis === 'columns'
        ? child.dataset.dashboardMinColumns
        : child.dataset.dashboardMinRows,
    );
    const max = Number(
      axis === 'columns'
        ? child.dataset.dashboardMaxColumns
        : child.dataset.dashboardMaxRows,
    );
    const size = placement[axis];

    row.ids.push(child.dataset.dashboardNodeId ?? '');
    row.placements.push(placement);
    row.sizes.push(size);
    row.bounds.push({
      min: Number.isFinite(min) ? Math.min(min, size) : 1,
      max: Number.isFinite(max) ? Math.max(max, size) : size,
    });
  }

  return row.ids.length > 0 ? row : null;
}

/**
 * A stack's children, re-shared after the stack's own capacity changed.
 *
 * A stack child's span is its own, so nothing but the stack's own resize gets
 * to move it — and when that happens every child has to follow, or the stack
 * either overflows or ends up with dead space at the end. Dashboard resolves
 * the whole row here and reports it as `info.displaced`, so the consumer
 * writes the children's spans alongside the container's.
 *
 * Empty for anything that is not a stack, and for a capacity its children
 * already fill exactly.
 */
/** A stack container's own content grid, which is not its parent's. */
function findOwnStackRow(
  node: HTMLElement,
  nodeId: string,
  kind: DashboardContainerKind | undefined,
): { axis: 'columns' | 'rows'; row: DashboardStackRow } | null {
  const isHorizontal = kind === 'horizontal-stack';
  if (!isHorizontal && kind !== 'vertical-stack') return null;

  const axis = isHorizontal ? 'columns' : 'rows';
  const content = Array.from(
    node.querySelectorAll<HTMLElement>('[data-dashboard-drop-target]'),
  ).find((element) => element.dataset.dashboardParentId === nodeId);
  const row = readDashboardStackRow(content ?? null, axis);

  return row ? { axis, row } : null;
}

/**
 * A stack container's children exactly as they stand.
 *
 * For a gesture to snapshot before it starts redistributing them. Handing a
 * stack back a span it held earlier does not hand each child back the columns
 * it gave up — `distributeDashboardStackSpans` reconciles against proportional
 * shares, with no memory of who shed what — so an exact restore has to come
 * from a snapshot rather than from re-resolving.
 */
export function readOwnDashboardStackChildren(
  node: HTMLElement,
  nodeId: string,
  kind: DashboardContainerKind | undefined,
): DashboardPlacementChangeItem[] {
  const own = findOwnStackRow(node, nodeId, kind);
  if (!own) return [];

  return own.row.ids.map((id, position) => ({
    id,
    placement: own.row.placements[position],
  }));
}

export function resolveDashboardStackCapacity(
  node: HTMLElement,
  nodeId: string,
  kind: DashboardContainerKind | undefined,
  placement: DashboardPlacement,
): DashboardPlacementChangeItem[] {
  const own = findOwnStackRow(node, nodeId, kind);
  if (!own) return [];
  const { axis, row } = own;

  const sizes = distributeDashboardStackSpans(
    row.bounds.map((bound, index) => ({ ...bound, weight: row.sizes[index] })),
    placement[axis],
  );

  return row.ids.flatMap((id, position) =>
    sizes[position] === row.sizes[position]
      ? []
      : [
          {
            id,
            placement: {
              ...row.placements[position],
              [axis]: sizes[position],
            },
          },
        ],
  );
}

/**
 * Where a stack child has to land to move one position under the arrow keys.
 *
 * A stack packs its children edge to edge, so a one-cell arrow step never
 * reaches the neighbour's midpoint: `resolveStackOccupancy` packs the item
 * straight back to where it started, the placement never changes, and the
 * gesture reports nothing at all. Stepping to the *neighbour's own start*
 * clears that midpoint, which is what "one position" means in a sequence.
 *
 * Returns `null` for every layout where an arrow already means one cell, and at
 * either end of the stack, where the caller's clamped step is a no-op anyway.
 */
export function getStackKeyboardPlacement(
  node: HTMLElement,
  id: string,
  placement: DashboardPlacement,
  columns: number,
  rows: number,
): DashboardPlacement | null {
  const target = getOwnDashboardDropTarget(node);
  if (!target) return null;
  const isHorizontal = target.kind === 'horizontal-stack';
  if (!isHorizontal && target.kind !== 'vertical-stack') return null;

  const direction = Math.sign(isHorizontal ? columns : rows);
  if (direction === 0) return null;

  const axis = isHorizontal ? 'column' : 'row';
  const span = isHorizontal ? 'columns' : 'rows';
  const siblings = getDashboardDropSiblings(target, new Set([id]));

  // Sibling offsets with this item lifted out — the same sequence
  // `resolveStackOccupancy` measures its midpoints against.
  const offsets: number[] = [];
  let cursor = 0;
  for (const sibling of siblings) {
    offsets.push(cursor);
    cursor += sibling.placement[span];
  }

  const index = siblings.filter(
    (sibling) => sibling.placement[axis] < placement[axis],
  ).length;
  const next = index + direction;
  if (next < 0 || next > siblings.length) return null;

  const coordinate = offsets[next] ?? cursor;

  return isHorizontal
    ? { ...placement, column: coordinate, row: 0 }
    : { ...placement, column: 0, row: coordinate };
}

/** What a destination will accept, and what has to move out of the way for it. */
export interface DashboardDropResolution {
  status: DashboardDropStatus;
  /** The moving group, normalized for the destination's layout. */
  items: DashboardPlacementChangeItem[];
  /** Stationary siblings this landing pushes to a new placement. */
  displaced: DashboardPlacementChangeItem[];
}

const REJECTED: Omit<DashboardDropResolution, 'items'> = {
  status: 'danger',
  displaced: [],
};

/**
 * Where a single blocker can go inside the box the moving node is vacating.
 *
 * Deliberately narrow. Relocating a blocker anywhere in the grid is easy to
 * implement and unpleasant to use: dropping one widget can shove an unrelated
 * section across the dashboard. Restricting the search to the vacated box makes
 * the operation a swap — the only rearrangement a user can predict from the
 * gesture — and anything that does not fit there is refused instead.
 */
function findSwapPlacement(
  target: DashboardDropTarget,
  blocker: DashboardPlacement,
  vacated: DashboardPlacement,
  occupied: DashboardPlacement[],
): DashboardPlacement | null {
  const candidates: DashboardPlacement[] = [];

  for (
    let row = vacated.row;
    row <= vacated.row + vacated.rows - blocker.rows;
    row += 1
  ) {
    for (
      let column = vacated.column;
      column <= vacated.column + vacated.columns - blocker.columns;
      column += 1
    ) {
      const candidate = {
        column,
        row,
        columns: blocker.columns,
        rows: blocker.rows,
      };

      if (
        candidate.column + candidate.columns > target.columns ||
        candidate.row + candidate.rows > target.rows
      ) {
        continue;
      }
      if (
        occupied.some((placement) => placementsOverlap(candidate, placement))
      ) {
        continue;
      }
      candidates.push(candidate);
    }
  }

  const distance = (candidate: DashboardPlacement) =>
    Math.abs(candidate.column - blocker.column) +
    Math.abs(candidate.row - blocker.row);

  return (
    candidates.sort((first, second) => distance(first) - distance(second))[0] ??
    null
  );
}

/**
 * Resolve a grid landing, swapping one occupant into the vacated box.
 *
 * Returns the siblings that have to move, or `null` when the landing cannot be
 * arranged — which the caller reports as a danger placeholder rather than
 * silently applying half of it.
 */
function resolveGridOccupancy(
  target: DashboardDropTarget,
  items: DashboardPlacementChangeItem[],
  siblings: DashboardSibling[],
  vacated?: DashboardPlacement,
): DashboardPlacementChangeItem[] | null {
  const landings = items.map((item) => item.placement);
  const blockers = siblings.filter((sibling) =>
    landings.some((landing) => placementsOverlap(sibling.placement, landing)),
  );
  if (!blockers.length) return [];
  // A swap needs one thing coming in and one thing going out, and somewhere
  // known for it to go.
  if (!vacated || blockers.length !== 1 || items.length !== 1) return null;

  const stationary = siblings
    .filter((sibling) => sibling !== blockers[0])
    .map((sibling) => sibling.placement);
  const spot = findSwapPlacement(target, blockers[0].placement, vacated, [
    ...landings,
    ...stationary,
  ]);

  return spot ? [{ id: blockers[0].id, placement: spot }] : null;
}

/**
 * Resolve a stack landing by reordering the sequence.
 *
 * A stack has no coordinates the consumer can trust — `getPlacementStyle` emits
 * `span N` and auto-flow decides the rest — so the useful answer is the order,
 * expressed as fresh sequential placements for every affected child.
 */
function resolveStackOccupancy(
  target: DashboardDropTarget,
  items: DashboardPlacementChangeItem[],
  siblings: DashboardSibling[],
  isSameParent: boolean,
  moving: DashboardGestureItem[],
): Omit<DashboardDropResolution, 'status'> | null {
  const isHorizontal = target.kind === 'horizontal-stack';
  const axisSpan = (placement: DashboardPlacement) =>
    isHorizontal ? placement.columns : placement.rows;
  const capacity = isHorizontal ? target.columns : target.rows;
  const floors = new Map(
    moving.map((item) => [
      item.id,
      isHorizontal ? item.minColumns : item.minRows,
    ]),
  );

  // A stack shares itself out among its children, so what decides whether one
  // more fits is the floor everything can be squeezed to — not the spans they
  // happen to be drawn at, which always add up to the stack's full width.
  const used = siblings.reduce(
    (total, sibling) =>
      total + (isHorizontal ? sibling.minColumns : sibling.minRows),
    0,
  );
  const incoming = items.reduce(
    (total, item) => total + (floors.get(item.id) ?? axisSpan(item.placement)),
    0,
  );

  if (used + incoming > capacity) return null;
  if (
    isHorizontal &&
    moving.some(
      (item) => Math.min(item.minRows, item.origin.rows) > target.rows,
    )
  ) {
    return null;
  }

  // Where the pointer put the grabbed item, in sequence terms: before the first
  // sibling whose midpoint it has passed.
  const start = isHorizontal
    ? items[0].placement.column
    : items[0].placement.row;
  let offset = 0;
  let index = siblings.length;

  for (const [position, sibling] of siblings.entries()) {
    const span = axisSpan(sibling.placement);
    if (start < offset + span / 2) {
      index = position;
      break;
    }
    offset += span;
  }

  const ordered = [
    ...siblings.slice(0, index).map((sibling) => ({
      id: sibling.id,
      placement: sibling.placement,
      moving: false,
    })),
    ...items.map((item) => ({
      id: item.id,
      placement: item.placement,
      moving: true,
    })),
    ...siblings.slice(index).map((sibling) => ({
      id: sibling.id,
      placement: sibling.placement,
      moving: false,
    })),
  ];

  let cursor = 0;
  const resolvedItems: DashboardPlacementChangeItem[] = [];
  const displaced: DashboardPlacementChangeItem[] = [];

  for (const entry of ordered) {
    const placement = {
      ...entry.placement,
      column: isHorizontal ? cursor : 0,
      row: isHorizontal ? 0 : cursor,
    };
    cursor += axisSpan(entry.placement);

    if (entry.moving) {
      resolvedItems.push({ id: entry.id, placement });
    } else if (
      placement.column !== entry.placement.column ||
      placement.row !== entry.placement.row
    ) {
      displaced.push({ id: entry.id, placement });
    }
  }

  // A same-parent reorder that changes nothing is not a move; let the caller's
  // own "did anything change" check see the original placements.
  if (!isSameParent || displaced.length || resolvedItems.length) {
    return { items: resolvedItems, displaced };
  }

  return { items, displaced: [] };
}

/**
 * What this destination would do with the landing.
 *
 * Dashboard used to only *judge* a landing — `valid` or `danger` — and leave the
 * arrangement to the consumer, which meant every consumer reimplemented the
 * swap and reflow policy the Playground demonstrated. Resolving it here means
 * the reported `info.items` already describes the whole arrangement, and the
 * consumer only writes placements.
 */
export function resolveDashboardDrop(
  target: DashboardDropTarget,
  items: DashboardPlacementChangeItem[],
  movingIds: ReadonlySet<string>,
  sourceParentId: string | null,
  moving: DashboardGestureItem[],
): DashboardDropResolution {
  if (target.kind === 'root') return { status: 'valid', items, displaced: [] };

  const siblings = getDashboardDropSiblings(target, movingIds);
  const isSameParent = target.parentId === sourceParentId;

  if (target.kind === 'horizontal-stack' || target.kind === 'vertical-stack') {
    const resolved = resolveStackOccupancy(
      target,
      items,
      siblings,
      isSameParent,
      moving,
    );

    return resolved ? { status: 'valid', ...resolved } : { ...REJECTED, items };
  }

  const displaced = resolveGridOccupancy(
    target,
    items,
    siblings,
    isSameParent && moving.length === 1 ? moving[0].origin : undefined,
  );

  return displaced
    ? { status: 'valid', items, displaced }
    : { ...REJECTED, items };
}

export function getDashboardDropPreviewStyle(
  target: DashboardDropTarget,
  placement: DashboardPlacement,
  movingElement: HTMLElement,
  metrics: DashboardMetrics,
  movingIds: ReadonlySet<string>,
): CSSProperties {
  if (target.kind === 'root') {
    const rootRect = target.element.getBoundingClientRect();
    const siblings = Array.from(target.element.children).filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement &&
        child.dataset.dashboardNode === 'container' &&
        !movingIds.has(child.dataset.dashboardNodeId ?? ''),
    );
    const index = clamp(placement.row, 0, siblings.length);
    const previousRect = siblings[index - 1]?.getBoundingClientRect();
    const nextRect = siblings[index]?.getBoundingClientRect();
    const top = nextRect
      ? nextRect.top - rootRect.top
      : previousRect
        ? previousRect.bottom - rootRect.top + DASHBOARD_ROOT_GAP
        : 0;

    return {
      left: 0,
      top,
      width: rootRect.width,
      height: movingElement.getBoundingClientRect().height,
    };
  }

  return {
    inset: 0,
    gridColumn:
      target.kind === 'vertical-stack'
        ? '1 / -1'
        : `${placement.column + 1} / span ${placement.columns}`,
    gridRow:
      target.kind === 'horizontal-stack'
        ? `1 / span ${placement.rows}`
        : `${placement.row + 1} / span ${placement.rows}`,
  };
}

export function getDashboardGestureItems(
  movingElement: HTMLElement,
  movingId: string,
  movingOrigin: DashboardPlacement,
  isSelected: boolean,
): DashboardGestureItem[] {
  const ownItem = getDashboardGestureItem(
    movingId,
    movingOrigin,
    movingElement,
  );
  if (!isSelected || !movingElement.parentElement) return [ownItem];

  const selectedSiblings = Array.from(
    movingElement.parentElement.children,
  ).flatMap((child) => {
    if (!(child instanceof HTMLElement)) return [];
    const id = child.dataset.dashboardNodeId;
    if (!id || id === movingId || child.dataset.selected === undefined) {
      return [];
    }

    const origin = readDashboardNodePlacement(child);

    return origin ? [getDashboardGestureItem(id, origin, child)] : [];
  });

  return [ownItem, ...selectedSiblings];
}

export function getDashboardGesturePlacements(
  target: DashboardDropTarget,
  gesture: DashboardPlacementGesture,
  grabbedPlacement: DashboardPlacement,
): DashboardPlacementChangeItem[] | null {
  if (gesture.items.length === 1) {
    return [{ id: gesture.items[0].id, placement: grabbedPlacement }];
  }

  if (target.kind === 'root') {
    if (
      gesture.items.some(
        (item) => item.element.dataset.dashboardNode !== 'container',
      )
    ) {
      return null;
    }

    return gesture.items.map((item, index) => ({
      id: item.id,
      placement: {
        ...item.origin,
        column: 0,
        row: grabbedPlacement.row + index,
        columns: 12,
      },
    }));
  }

  const columnDelta = grabbedPlacement.column - gesture.origin.column;
  const rowDelta = grabbedPlacement.row - gesture.origin.row;
  const placements = gesture.items.map((item) => ({
    id: item.id,
    placement: {
      ...item.origin,
      column:
        target.kind === 'vertical-stack' ? 0 : item.origin.column + columnDelta,
      row: target.kind === 'horizontal-stack' ? 0 : item.origin.row + rowDelta,
      columns: Math.min(
        target.kind === 'vertical-stack'
          ? item.maxColumns
          : item.origin.columns,
        target.columns,
      ),
      rows: Math.min(
        target.kind === 'horizontal-stack' ? item.maxRows : item.origin.rows,
        target.rows,
      ),
    },
  }));
  if (
    placements.some((item, index) => {
      const constraints = gesture.items[index];

      return (
        item.placement.columns < constraints.minColumns ||
        item.placement.rows < constraints.minRows
      );
    })
  ) {
    return null;
  }
  const minimumColumn = Math.min(
    ...placements.map((item) => item.placement.column),
  );
  const minimumRow = Math.min(...placements.map((item) => item.placement.row));
  const maximumColumn = Math.max(
    ...placements.map((item) => item.placement.column + item.placement.columns),
  );
  const maximumRow = Math.max(
    ...placements.map((item) => item.placement.row + item.placement.rows),
  );
  const groupColumns = maximumColumn - minimumColumn;
  const groupRows = maximumRow - minimumRow;

  if (groupColumns > target.columns || groupRows > target.rows) return null;

  const shiftColumn =
    minimumColumn < 0
      ? -minimumColumn
      : maximumColumn > target.columns
        ? target.columns - maximumColumn
        : 0;
  const shiftRow =
    minimumRow < 0
      ? -minimumRow
      : maximumRow > target.rows
        ? target.rows - maximumRow
        : 0;

  return placements.map((item) => ({
    ...item,
    placement: {
      ...item.placement,
      column: item.placement.column + shiftColumn,
      row: item.placement.row + shiftRow,
    },
  }));
}

/**
 * One placeholder per moving item. The status is resolved by the caller, which
 * needs the displaced siblings anyway and should not resolve the same landing
 * twice.
 */
export function createDashboardDropPreviews(
  target: DashboardDropTarget,
  items: DashboardPlacementChangeItem[],
  gestureItems: DashboardGestureItem[],
  metrics: DashboardMetrics,
  status: DashboardDropStatus,
): DashboardDropPreview[] {
  const movingIds = new Set(gestureItems.map((item) => item.id));
  let rootOffset = 0;
  const addSlotPlacement = Array.from(target.element.children).flatMap(
    (child) => {
      if (!(child instanceof HTMLElement)) return [];
      if (child.dataset.dashboardAddSlot === undefined) return [];

      const placement = readDashboardNodePlacement(child);

      return placement ? [placement] : [];
    },
  )[0];

  return items.map((item) => {
    const gestureItem = gestureItems.find(
      (candidate) => candidate.id === item.id,
    );
    const style = getDashboardDropPreviewStyle(
      target,
      item.placement,
      gestureItem?.element ?? gestureItems[0].element,
      metrics,
      movingIds,
    );

    if (target.kind === 'root') {
      style.top = Number(style.top ?? 0) + rootOffset;
      rootOffset += Number(style.height ?? 0) + DASHBOARD_ROOT_GAP;
    }

    return {
      id: item.id,
      target: target.element,
      placement: item.placement,
      status,
      coversAddSlot:
        addSlotPlacement !== undefined &&
        placementsOverlap(item.placement, addSlotPlacement),
      style,
    };
  });
}

export function useDashboardDropPreview() {
  const [preview, setPreview] = useState<DashboardDropPreview[]>([]);
  const updatePreview = useEvent((next: DashboardDropPreview[] | null) => {
    setPreview(next ?? []);
  });

  return [preview, updatePreview] as const;
}

export function renderDashboardDropPreview(
  previews: DashboardDropPreview[],
  blockedLabel: string,
) {
  return previews.map((preview) => {
    const isBlocked = preview.status === 'danger';

    return createPortal(
      <DropPlaceholderElement
        key={preview.id}
        aria-hidden={isBlocked ? undefined : 'true'}
        data-dashboard-drop-status={preview.status}
        data-dashboard-drop-item-id={preview.id}
        data-dashboard-drop-covers-add-slot={preview.coversAddSlot || undefined}
        mods={{ danger: isBlocked }}
        style={preview.style}
      >
        <div
          data-element="Icon"
          role={isBlocked ? 'img' : undefined}
          aria-label={isBlocked ? blockedLabel : undefined}
          aria-hidden={isBlocked ? undefined : 'true'}
        >
          <CloseCircleIcon />
        </div>
      </DropPlaceholderElement>,
      preview.target,
      preview.id,
    );
  });
}
