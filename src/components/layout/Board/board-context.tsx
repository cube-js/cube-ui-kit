import { createContext, MutableRefObject, useContext } from 'react';

import type { BoardWidgetStore } from './board-store';
import type {
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
  getMaxRows: () => number;
  getContainerHeight: () => number;
  getLayout: () => LayoutItem[];
  /** Update the board layout. `commit` fires `onLayoutChange`. */
  applyLayout: (layout: LayoutItem[], commit: boolean) => void;
  setPlaceholder: (item: LayoutItem | null) => void;
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
  /** Dragged widget rect in viewport coordinates (follows the pointer). */
  rect: ViewportRect;
  pointerType: string;
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
  ) => void;
  onDragMove: (deltaX: number, deltaY: number, pointerType: string) => void;
  onDragEnd: () => void;
  dragState: BoardDragState | null;
}

export const BoardRegistryContext =
  createContext<BoardRegistryContextValue | null>(null);

export function useBoardRegistry(): BoardRegistryContextValue | null {
  return useContext(BoardRegistryContext);
}
