import { useCallback, useMemo, useRef, useState } from 'react';

import { useEvent } from '../../../_internal/hooks';

import {
  BoardDragState,
  BoardEntry,
  BoardRegistryContextValue,
  ViewportRect,
} from './board-context';
import { BoardWidgetStore } from './board-store';
import {
  applyPositionConstraints,
  calcXYRaw,
  cloneLayout,
  getLayoutItem,
  LayoutItem,
  moveElement,
} from './grid-core';

function rectCenter(rect: ViewportRect): { x: number; y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/**
 * Cross-board drag orchestration.
 *
 * Owns the shared widget-content store, the drag overlay ref, and the registry
 * of boards. Handles moving an item inside a board and transferring it between
 * boards (including nested ones) by hit-testing the pointer against each board's
 * content rectangle.
 */
export function useBoardRegistry(): BoardRegistryContextValue {
  const store = useMemo(() => new BoardWidgetStore(), []);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const boardsRef = useRef<Map<string, BoardEntry>>(new Map());
  const dragStateRef = useRef<BoardDragState | null>(null);
  const affectedRef = useRef<Set<string>>(new Set());
  // Snapshot of the source board's layout at drag start, used to restore the
  // source when the pointer leaves it (the dragged item is never removed from
  // the source mid-drag, so its gesture host stays mounted).
  const sourceSnapshotRef = useRef<LayoutItem[]>([]);
  // Last landing position computed for the current target board (grid units).
  const lastLandingRef = useRef<{ x: number; y: number } | null>(null);
  const [dragState, setDragStateInternal] = useState<BoardDragState | null>(
    null,
  );

  const setDragState = useCallback((next: BoardDragState | null) => {
    dragStateRef.current = next;
    setDragStateInternal(next);
  }, []);

  const registerBoard = useCallback((entry: BoardEntry) => {
    boardsRef.current.set(entry.id, entry);
    return () => {
      // Only remove if a newer board instance hasn't already taken over this id
      // (boards can remount when their host widget is relocated, e.g. dragged).
      if (boardsRef.current.get(entry.id) === entry) {
        boardsRef.current.delete(entry.id);
      }
    };
  }, []);

  /** Find the most-nested droppable board whose content rect contains a point. */
  const hitTest = useCallback(
    (point: { x: number; y: number }): BoardEntry | null => {
      let best: BoardEntry | null = null;
      let bestArea = Infinity;

      // During a pointer drag the dragged widget (and any board nested inside it)
      // lives in the overlay portal. Such boards must never be drop targets -
      // dropping a widget into a board nested within itself would remove it from
      // the tree that renders that board.
      const overlay = overlayRef.current;

      boardsRef.current.forEach((entry) => {
        if (!entry.isDroppable()) return;
        if (overlay && overlay.contains(entry.getContentNode())) return;
        const rect = entry.getContentRect();
        if (!rect) return;
        if (
          point.x >= rect.left &&
          point.x <= rect.right &&
          point.y >= rect.top &&
          point.y <= rect.bottom
        ) {
          const area = rect.width * rect.height;
          if (area < bestArea) {
            bestArea = area;
            best = entry;
          }
        }
      });

      return best;
    },
    [],
  );

  const onDragStart = useEvent(
    (
      boardId: string,
      itemId: string,
      rect: ViewportRect,
      pointerType: string,
    ) => {
      const entry = boardsRef.current.get(boardId);
      const item = entry ? getLayoutItem(entry.getLayout(), itemId) : undefined;
      if (!entry || !item) return;

      affectedRef.current = new Set([boardId]);
      sourceSnapshotRef.current = cloneLayout(entry.getLayout());
      lastLandingRef.current = { x: item.x, y: item.y };
      const next: BoardDragState = {
        sourceBoardId: boardId,
        currentBoardId: boardId,
        itemId,
        item: { ...item },
        rect,
        pointerType,
      };
      setDragState(next);
      entry.setPlaceholder({ ...item });
    },
  );

  /** Compute the constrained landing position of an item on a target board. */
  const computeLanding = useCallback(
    (
      target: BoardEntry,
      item: LayoutItem,
      rect: ViewportRect,
    ): { x: number; y: number } => {
      const pp = target.getPositionParams();
      const contentRect = target.getContentRect();
      const localLeft = rect.left - (contentRect?.left ?? 0);
      const localTop = rect.top - (contentRect?.top ?? 0);
      const raw = calcXYRaw(pp, localTop, localLeft);

      return applyPositionConstraints(
        target.getConstraints(),
        item,
        raw.x,
        raw.y,
        {
          cols: pp.cols,
          maxRows: target.getMaxRows(),
          containerWidth: pp.containerWidth,
          containerHeight: target.getContainerHeight(),
          rowHeight: pp.rowHeight,
          margin: pp.margin,
          layout: target.getLayout(),
        },
      );
    },
    [],
  );

  const moveWithinBoard = useCallback(
    (entry: BoardEntry, item: LayoutItem, x: number, y: number) => {
      const pp = entry.getPositionParams();
      const compactor = entry.getCompactor();
      const layout = entry.getLayout();
      const live = getLayoutItem(layout, item.i);
      const working = live ? [...layout] : [...layout, { ...item, x, y }];
      const target = getLayoutItem(working, item.i);
      if (!target) return;

      const moved = moveElement(
        working,
        target,
        x,
        y,
        true,
        compactor.preventCollision,
        compactor.type,
        pp.cols,
        compactor.allowOverlap,
      );
      const compacted = [...compactor.compact(moved, pp.cols)];
      entry.applyLayout(compacted, false);
      entry.setPlaceholder(getLayoutItem(compacted, item.i) ?? null);
    },
    [],
  );

  const onDragMove = useEvent(
    (deltaX: number, deltaY: number, _pointerType: string) => {
      const ds = dragStateRef.current;
      if (!ds) return;

      const newRect: ViewportRect = {
        ...ds.rect,
        left: ds.rect.left + deltaX,
        top: ds.rect.top + deltaY,
      };

      const source = boardsRef.current.get(ds.sourceBoardId);
      // Fall back to the source board so a pointer outside every board keeps the
      // widget anchored to where it came from.
      const target = hitTest(rectCenter(newRect)) ?? source ?? null;

      if (!target) {
        setDragState({ ...ds, rect: newRect });
        return;
      }

      const { x, y } = computeLanding(target, ds.item, newRect);
      lastLandingRef.current = { x, y };

      // Same board: run the live in-board preview (item stays owned by the
      // source, so its gesture host is never unmounted).
      if (target.id === ds.sourceBoardId) {
        if (ds.currentBoardId !== ds.sourceBoardId) {
          // Returning from another board: clear that board's placeholder.
          boardsRef.current.get(ds.currentBoardId)?.setPlaceholder(null);
        }
        moveWithinBoard(target, ds.item, x, y);
        setDragState({
          ...ds,
          currentBoardId: ds.sourceBoardId,
          rect: newRect,
        });
        return;
      }

      // Cross-board: never mutate layouts during the drag. Only preview the
      // landing slot on the target via a placeholder. The actual transfer is
      // committed on drop. This keeps the dragged widget's gesture host mounted
      // in the source board for the entire drag.
      if (ds.currentBoardId !== target.id) {
        const prev = boardsRef.current.get(ds.currentBoardId);
        if (ds.currentBoardId === ds.sourceBoardId) {
          // Leaving the source: restore it to its pre-drag arrangement.
          prev?.applyLayout(cloneLayout(sourceSnapshotRef.current), false);
        }
        prev?.setPlaceholder(null);
      }

      target.setPlaceholder({ ...ds.item, x, y });
      affectedRef.current.add(target.id);
      setDragState({ ...ds, currentBoardId: target.id, rect: newRect });
    },
  );

  const onDragEnd = useEvent(() => {
    const ds = dragStateRef.current;
    if (!ds) return;

    const source = boardsRef.current.get(ds.sourceBoardId);
    const target = boardsRef.current.get(ds.currentBoardId);
    const droppedInSource = !target || target.id === ds.sourceBoardId;

    if (droppedInSource) {
      // Commit the current source arrangement (already previewed in-board).
      source?.applyLayout([...(source.getLayout() ?? [])], true);
    } else {
      const landing = lastLandingRef.current ?? { x: ds.item.x, y: ds.item.y };

      // Remove the item from the source board and compact.
      if (source) {
        const sp = source.getPositionParams();
        const sc = source.getCompactor();
        const remaining = source.getLayout().filter((l) => l.i !== ds.itemId);
        source.applyLayout([...sc.compact(remaining, sp.cols)], true);
      }

      // Insert the item into the target board at the previewed landing slot.
      const tp = target!.getPositionParams();
      const tc = target!.getCompactor();
      const newItem: LayoutItem = {
        ...ds.item,
        x: landing.x,
        y: landing.y,
        moved: true,
      };
      const base = [
        ...target!.getLayout().filter((l) => l.i !== ds.itemId),
        newItem,
      ];
      const moved = moveElement(
        base,
        newItem,
        landing.x,
        landing.y,
        true,
        tc.preventCollision,
        tc.type,
        tp.cols,
        tc.allowOverlap,
      );
      target!.applyLayout([...tc.compact(moved, tp.cols)], true);
    }

    const ids = new Set(affectedRef.current);
    ids.add(ds.sourceBoardId);
    ids.add(ds.currentBoardId);
    ids.forEach((id) => boardsRef.current.get(id)?.setPlaceholder(null));

    affectedRef.current.clear();
    sourceSnapshotRef.current = [];
    lastLandingRef.current = null;
    setDragState(null);
  });

  return useMemo(
    () => ({
      store,
      overlayRef,
      registerBoard,
      onDragStart,
      onDragMove,
      onDragEnd,
      dragState,
    }),
    [store, registerBoard, onDragStart, onDragMove, onDragEnd, dragState],
  );
}
