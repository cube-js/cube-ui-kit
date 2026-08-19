import { createContext, MutableRefObject, useContext } from 'react';

import type { BoardWidgetStore } from './board-store';
import type {
  CollisionMode,
  Compactor,
  LayoutConstraint,
  LayoutItem,
  PositionParams,
} from './grid-core';

/** A rectangle in viewport (client) coordinates. */
export interface ViewportRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Everything the cross-board registry needs to read from / write to a single
 * board. Methods read live refs so a single stable entry can be registered once
 * per board and stay current across renders.
 */
export interface BoardEntry {
  id: string;
  /** Viewport rect of the content area where widgets are positioned. */
  getContentRect: () => DOMRect | null;
  /** The DOM node of the content area (used to detect nested-in-drag boards). */
  getContentNode: () => HTMLElement | null;
  getPositionParams: () => PositionParams;
  getConstraints: () => LayoutConstraint[];
  getCompactor: () => Compactor;
  /**
   * How this board resolves a placement its compactor would otherwise refuse.
   * A board-level policy rather than part of the `Compactor`, which is a public
   * type consumers implement.
   */
  getCollisionMode: () => CollisionMode;
  getMaxRows: () => number;
  getContainerHeight: () => number;
  getLayout: () => LayoutItem[];
  /**
   * Keys of the widgets currently selected on this board, or `null` when the
   * board has no selection. Read at drag start to decide whether the gesture
   * moves one widget or a whole group.
   */
  getSelectedKeys: () => ReadonlySet<string> | null;
  /** Update the board layout. `commit` fires `onLayoutChange`. */
  applyLayout: (layout: LayoutItem[], commit: boolean) => void;
  /** Replace every drop-slot preview. Pass `[]` to clear. */
  setPlaceholders: (items: LayoutItem[]) => void;
  isDroppable: () => boolean;
}

/** Emitted when a widget is dropped from one board into another. */
export interface WidgetTransferInfo {
  widgetId: string;
  fromBoardId: string;
  toBoardId: string;
  item: LayoutItem;
}

/** Live drag state, shared across boards for overlay + placeholders. */
export interface BoardDragState {
  sourceBoardId: string;
  /** Board currently owning the dragged item (changes as it crosses boards). */
  currentBoardId: string;
  itemId: string;
  /** Snapshot of the dragged item (grid units; w/h preserved across boards). */
  item: LayoutItem;
  /**
   * Every widget moving in this gesture, the grabbed one first. Length 1 for an
   * ordinary drag, so `itemIds[0] === itemId` always holds and any check against
   * this set is a strict superset of the equivalent check against `itemId`.
   */
  itemIds: string[];
  /** Drag-start snapshots of `itemIds`, in the same order. */
  items: LayoutItem[];
  /** Dragged widget rect in viewport coordinates (follows the pointer). */
  rect: ViewportRect;
  /** `rect` as measured at drag start — lets any host derive the gesture delta. */
  startRect: ViewportRect;
  /**
   * Viewport rect of every group member's host, measured once at drag start.
   * Drag start is the only safe window to measure (see `frozenRectsRef` in the
   * registry); measuring later would feed the preview back into itself.
   */
  memberRects: Map<string, ViewportRect>;
  pointerType: string;
  /**
   * Ids of boards nested inside the dragged widget, captured at drag start.
   * Such a board is never a drop target, and it suppresses its own grid-line
   * overlay while its host widget is being dragged (the whole widget floats, so
   * the inner grid lines would only add clutter).
   */
  nestedBoardIds: Set<string>;
}

export interface BoardRegistryContextValue {
  store: BoardWidgetStore;
  overlayRef: MutableRefObject<HTMLDivElement | null>;
  registerBoard: (entry: BoardEntry) => () => void;
  onDragStart: (
    boardId: string,
    itemId: string,
    rect: ViewportRect,
    pointerType: string,
    /** The dragged widget's host node, used to exclude boards nested inside it. */
    widgetNode: HTMLElement | null,
  ) => void;
  onDragMove: (deltaX: number, deltaY: number, pointerType: string) => void;
  onDragEnd: () => void;
  dragState: BoardDragState | null;
  /**
   * Synchronously-updated mirror of `dragState`. `dragState` is React state, so
   * a handler running in the same tick as `onDragStart` — such as the drag
   * lifecycle `WidgetHost` fires immediately afterwards — still sees the
   * previous value and must read this instead.
   */
  getDragState: () => BoardDragState | null;
}

export const BoardRegistryContext =
  createContext<BoardRegistryContextValue | null>(null);

export function useBoardRegistry(): BoardRegistryContextValue | null {
  return useContext(BoardRegistryContext);
}

/**
 * A stable boolean signalling whether a Board widget is currently being
 * dragged. Provided by `BoardProvider` (and therefore by any standalone
 * `Board`, which self-wraps in one). Unlike the full `dragState`, this only
 * flips on drag start/end, so components that only care about "is a drag in
 * progress" (e.g. `Tabs` spring-loading a tab on hover) can subscribe without
 * re-rendering on every pointer move. Defaults to `false` outside any Board.
 */
export const BoardDragActiveContext = createContext<boolean>(false);

export function useBoardDragActive(): boolean {
  return useContext(BoardDragActiveContext);
}

/**
 * What a nested `Board` inherits as its `showGridLines` default. The drag-scoped
 * subset of `BoardGridLines`: an ancestor's `true` is handed down as `'drag'`
 * (a nested board shows lines while a drag is in flight, not permanently), while
 * `'any-drag'` is handed down verbatim so the whole nested tree keeps advertising
 * every board a widget could land on.
 */
export type BoardInheritedGridLines = false | 'drag' | 'any-drag';

/**
 * Whether an ancestor `Board` has its grid-line overlay enabled, and with which
 * drag scope. A nested board that does not set `showGridLines` explicitly reads
 * this to inherit the behaviour. Defaults to `false` outside any grid-lined
 * board.
 */
export const BoardGridLinesContext =
  createContext<BoardInheritedGridLines>(false);

export function useBoardGridLines(): BoardInheritedGridLines {
  return useContext(BoardGridLinesContext);
}

/**
 * The resolved grid metrics a `Board` exposes to any boards nested inside its
 * widgets. A nested board with `isAligned` reads these to inherit the parent's
 * column pitch (column width + horizontal margin) and target row height, so its
 * cells line up with the surrounding layout instead of stretching.
 */
export interface BoardMetrics {
  /** Resolved pixel width of one parent column. */
  colWidth: number;
  /** Resolved parent row height in pixels (the alignment target). */
  rowHeight: number;
  /** Parent [horizontal, vertical] margin between widgets in pixels. */
  margin: readonly [number, number];
  /** Parent [horizontal, vertical] container padding in pixels. */
  containerPadding: readonly [number, number];
}

export const BoardMetricsContext = createContext<BoardMetrics | null>(null);

export function useBoardMetrics(): BoardMetrics | null {
  return useContext(BoardMetricsContext);
}

/**
 * Information a `WidgetHost` exposes to the content it renders (including a
 * nested `Board`). Lets a nested board know whether its host widget auto-sizes
 * its height and, if so, ask the host to grow to fit the board's natural size.
 */
export interface BoardHost {
  /** Whether the host widget grows its height to fit its content. */
  isAutoHeight: boolean;
  /**
   * Ask the host widget to grow so it provides `px` more content height. Only
   * ever increases the host's height. No-op when the host does not auto-size.
   */
  requestHeightDeficit: (px: number) => void;
}

export const BoardHostContext = createContext<BoardHost | null>(null);

export function useBoardHost(): BoardHost | null {
  return useContext(BoardHostContext);
}
