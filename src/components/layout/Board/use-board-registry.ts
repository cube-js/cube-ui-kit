import { useCallback, useMemo, useRef, useState } from 'react';

import { useEvent } from '../../../_internal/hooks';

import {
  BoardDragState,
  BoardEntry,
  BoardRegistryContextValue,
  ViewportRect,
  WidgetTransferInfo,
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

/**
 * The dragged widget's top-left corner in viewport coordinates.
 *
 * This is the anchor `computeLanding` maps into a target board's grid, and the
 * same point the floating overlay clone is positioned at (see `WidgetHost`), so
 * the drop-target hit-test must use it too. Picking the target by the widget's
 * center instead lets a wide/tall widget select a board its top-left has not yet
 * entered: `computeLanding` then clamps the landing to that board's edge and the
 * placeholder/drop slot drift away from where the overlay is actually drawn.
 */
function rectOrigin(rect: ViewportRect): { x: number; y: number } {
  return { x: rect.left, y: rect.top };
}

/**
 * Cross-board drag orchestration.
 *
 * Owns the shared widget-content store, the drag overlay ref, and the registry
 * of boards. Handles moving an item inside a board and transferring it between
 * boards (including nested ones) by hit-testing the pointer against each board's
 * content rectangle.
 */
export interface UseBoardRegistryOptions {
  /** Fired when a widget is dropped from one board into another. */
  onWidgetTransfer?: (info: WidgetTransferInfo) => void;
}

export function useBoardRegistry(
  options?: UseBoardRegistryOptions,
): BoardRegistryContextValue {
  const store = useMemo(() => new BoardWidgetStore(), []);
  // Latest transfer callback, read from a ref so the stable `onDragEnd` handler
  // always calls the current one without re-creating the registry.
  const onTransferRef = useRef(options?.onWidgetTransfer);
  onTransferRef.current = options?.onWidgetTransfer;
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const boardsRef = useRef<Map<string, BoardEntry>>(new Map());
  const dragStateRef = useRef<BoardDragState | null>(null);
  const affectedRef = useRef<Set<string>>(new Set());
  // Snapshot of the source board's layout at drag start, used to restore the
  // source when the pointer leaves it (the dragged item is never removed from
  // the source mid-drag, so its gesture host stays mounted).
  const sourceSnapshotRef = useRef<LayoutItem[]>([]);
  // Snapshot of each visited target board's layout at the moment the pointer
  // first entered it. Used to restore a board when the pointer leaves it, and as
  // the clean seed for the reflow preview on (re-)entry. Never mutated.
  const targetSnapshotsRef = useRef<Map<string, LayoutItem[]>>(new Map());
  // The current target board's live working layout (including the incoming
  // item). Carried across frames so small pointer movements reflow the board
  // incrementally - exactly like an in-board drag - instead of recomputing from
  // scratch each frame (which lets collision resolution sink the item to the
  // bottom of an occupied column).
  const previewRef = useRef<{ boardId: string; working: LayoutItem[] } | null>(
    null,
  );
  // Board content rects captured at drag start. Reading geometry from here (not
  // live getBoundingClientRect) means the live-reflow preview can't move the
  // rects that selection/landing depend on -> no feedback loop.
  const frozenRectsRef = useRef<Map<string, DOMRect>>(new Map());
  // Ids of boards nested inside the dragged widget, captured at drag start.
  // Such a board must never be a drop target: dropping a widget into a board
  // nested within itself removes it from the tree that renders that board.
  // The overlay-containment check in `hitTest` only catches these once the
  // dragged widget has floated into the overlay, but `useMove` fires the first
  // `onMove` synchronously with `onMoveStart` (before React relocates the
  // widget into the overlay), so on a tiny one-move drag the nested board is
  // still in-grid and would be selected. Excluding these ids for the whole
  // gesture closes that window.
  const nestedInDraggedRef = useRef<Set<string>>(new Set());
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

  // Geometry frozen at drag start; falls back to the live rect for boards that
  // mount mid-drag (they weren't captured at start).
  const getBoardRect = useCallback(
    (entry: BoardEntry): DOMRect | null =>
      frozenRectsRef.current.get(entry.id) ?? entry.getContentRect(),
    [],
  );

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
        if (nestedInDraggedRef.current.has(entry.id)) return;
        if (overlay && overlay.contains(entry.getContentNode())) return;
        const rect = getBoardRect(entry);
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
    [getBoardRect],
  );

  const onDragStart = useEvent(
    (
      boardId: string,
      itemId: string,
      rect: ViewportRect,
      pointerType: string,
      widgetNode: HTMLElement | null,
    ) => {
      const entry = boardsRef.current.get(boardId);
      const item = entry ? getLayoutItem(entry.getLayout(), itemId) : undefined;
      if (!entry || !item) return;

      // Record boards nested inside the dragged widget so they are never picked
      // as a drop target (dropping a widget into a board nested within itself
      // would unmount it). Computed here, before the widget floats into the
      // overlay, while its nested boards are still in-grid descendants.
      const nested = new Set<string>();
      if (widgetNode) {
        boardsRef.current.forEach((e) => {
          const node = e.getContentNode();
          if (node && widgetNode.contains(node)) nested.add(e.id);
        });
      }
      nestedInDraggedRef.current = nested;

      // Freeze every board's geometry for the whole gesture so live-reflow
      // preview writes can't move the rects selection/landing read.
      const frozen = new Map<string, DOMRect>();
      boardsRef.current.forEach((e) => {
        const r = e.getContentRect();
        if (r) frozen.set(e.id, r);
      });
      frozenRectsRef.current = frozen;

      affectedRef.current = new Set([boardId]);
      sourceSnapshotRef.current = cloneLayout(entry.getLayout());
      previewRef.current = null;
      lastLandingRef.current = { x: item.x, y: item.y };
      // Layout-item constraints win; otherwise fall back to the ones declared on
      // the owning `Board.Widget` so position constraints apply during drag.
      const draggedItem: LayoutItem = {
        ...item,
        constraints: item.constraints ?? store.get(itemId)?.constraints,
      };
      const next: BoardDragState = {
        sourceBoardId: boardId,
        currentBoardId: boardId,
        itemId,
        item: draggedItem,
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
      const contentRect = getBoardRect(target);
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
    [getBoardRect],
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

  /**
   * Live cross-board reflow preview. Pushes the target board's *other* widgets
   * aside to make room for the incoming item, without ever adding the dragged
   * item's host to the target (it stays visualized as a placeholder + overlay
   * clone, and its gesture host remains mounted in the source board).
   *
   * Continuity: the working layout (including the incoming item) is carried
   * across frames via `previewRef`, so a small pointer movement moves the item
   * one step and reflows the neighbours incrementally - identical to an in-board
   * drag. Recomputing from the clean snapshot every frame instead lets
   * `moveElement`/compaction sink the item to the bottom of an occupied column
   * (the "pushed too far below" bug). On (re-)entry the working layout is seeded
   * from a *clone* of the snapshot so the stored snapshot is never mutated.
   */
  const previewOnTarget = useCallback(
    (target: BoardEntry, item: LayoutItem, x: number, y: number) => {
      const pp = target.getPositionParams();
      const compactor = target.getCompactor();

      const carried =
        previewRef.current?.boardId === target.id
          ? previewRef.current.working
          : null;
      const base = (
        carried ??
        cloneLayout(
          targetSnapshotsRef.current.get(target.id) ?? target.getLayout(),
        )
      ).filter((l) => l.i !== item.i);

      // Reuse the item's carried position as the move origin (continuity). On
      // first entry there is none, so seed it just above (or left of) its target
      // cell: that makes the first `moveElement` an *active* placement (never a
      // no-op) that pushes colliding widgets aside instead of the item sinking.
      const prevItem = carried ? getLayoutItem(carried, item.i) : undefined;
      const dragged: LayoutItem = prevItem
        ? { ...prevItem }
        : compactor.type === 'horizontal'
          ? { ...item, x: Math.max(0, x) - 1, y }
          : { ...item, x, y: Math.max(0, y) - 1 };
      const working = [...base, dragged];

      const moved = moveElement(
        working,
        dragged,
        x,
        y,
        true,
        compactor.preventCollision,
        compactor.type,
        pp.cols,
        compactor.allowOverlap,
      );
      const compacted = [...compactor.compact(moved, pp.cols)];
      previewRef.current = { boardId: target.id, working: compacted };

      const landed = getLayoutItem(compacted, item.i) ?? { ...item, x, y };
      // Apply only the other widgets so the dragged item is never rendered as a
      // host on the target board.
      target.applyLayout(
        compacted.filter((l) => l.i !== item.i),
        false,
      );
      target.setPlaceholder({ ...landed });
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
      // Hit-test with the widget's top-left corner - the same anchor
      // `computeLanding` and the overlay clone use - so the chosen board always
      // contains the landing anchor and the placeholder can't diverge from the
      // floating overlay (see `rectOrigin`). Fall back to the source board so a
      // pointer outside every board keeps the widget anchored to where it came
      // from. Frozen rects make this deterministic (no preview-induced flip-flop).
      const target = hitTest(rectOrigin(newRect)) ?? source ?? null;

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
          // Returning from another board: restore that board's pushed widgets
          // to their pre-hover arrangement and clear its placeholder.
          const prev = boardsRef.current.get(ds.currentBoardId);
          const snap = targetSnapshotsRef.current.get(ds.currentBoardId);
          if (snap) prev?.applyLayout(cloneLayout(snap), false);
          prev?.setPlaceholder(null);
          previewRef.current = null;
        }
        moveWithinBoard(target, ds.item, x, y);
        setDragState({
          ...ds,
          currentBoardId: ds.sourceBoardId,
          rect: newRect,
        });
        return;
      }

      // Cross-board: preview the transfer live by pushing the target board's
      // other widgets aside (see `previewOnTarget`). The dragged item's host
      // stays mounted in the source board for the entire drag; the actual
      // transfer is committed on drop.
      if (ds.currentBoardId !== target.id) {
        const prev = boardsRef.current.get(ds.currentBoardId);
        if (ds.currentBoardId === ds.sourceBoardId) {
          // Leaving the source: restore it to its pre-drag arrangement.
          prev?.applyLayout(cloneLayout(sourceSnapshotRef.current), false);
        } else {
          // Leaving another target board: restore its pushed widgets.
          const snap = targetSnapshotsRef.current.get(ds.currentBoardId);
          if (snap) prev?.applyLayout(cloneLayout(snap), false);
        }
        prev?.setPlaceholder(null);
        // Drop the carried working layout so the newly entered target seeds a
        // fresh preview from its own clean snapshot.
        previewRef.current = null;

        // Snapshot the newly entered target once, as the stable base for its
        // reflow preview.
        if (!targetSnapshotsRef.current.has(target.id)) {
          targetSnapshotsRef.current.set(
            target.id,
            cloneLayout(target.getLayout()),
          );
        }
      }

      previewOnTarget(target, ds.item, x, y);
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
      // Commit a freshly compacted source so the result never depends on the
      // last preview frame (which may have been mid-reflow).
      if (source) {
        const sp = source.getPositionParams();
        const sc = source.getCompactor();
        source.applyLayout([...sc.compact(source.getLayout(), sp.cols)], true);
      }
    } else {
      const landing = lastLandingRef.current ?? { x: ds.item.x, y: ds.item.y };

      // Remove the item from the source board and compact.
      if (source) {
        const sp = source.getPositionParams();
        const sc = source.getCompactor();
        const remaining = source.getLayout().filter((l) => l.i !== ds.itemId);
        source.applyLayout([...sc.compact(remaining, sp.cols)], true);
      }

      const tp = target!.getPositionParams();
      const tc = target!.getCompactor();

      // Prefer committing the exact arrangement the user was previewing (item
      // already placed with the neighbours reflowed around it via continuity).
      const carried =
        previewRef.current?.boardId === target!.id &&
        getLayoutItem(previewRef.current.working, ds.itemId)
          ? previewRef.current.working
          : null;

      let finalLayout: LayoutItem[];
      if (carried) {
        finalLayout = [...tc.compact(cloneLayout(carried), tp.cols)];
      } else {
        // No preview frame ran (e.g. a teleport drop). Seed the item just above
        // (or left of) its landing cell so `moveElement` actively places it
        // rather than no-opping and letting compaction sink it to the bottom.
        const newItem: LayoutItem =
          tc.type === 'horizontal'
            ? { ...ds.item, x: Math.max(0, landing.x) - 1, y: landing.y }
            : { ...ds.item, x: landing.x, y: Math.max(0, landing.y) - 1 };
        const base = [
          ...cloneLayout(
            (
              targetSnapshotsRef.current.get(target!.id) ?? target!.getLayout()
            ).filter((l) => l.i !== ds.itemId),
          ),
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
        finalLayout = [...tc.compact(moved, tp.cols)];
      }
      target!.applyLayout(finalLayout, true);

      // Signal the transfer so a controlled app can move the widget's
      // declaration into the destination container (positions are already
      // reported via each board's onLayoutChange).
      onTransferRef.current?.({
        widgetId: ds.itemId,
        fromBoardId: ds.sourceBoardId,
        toBoardId: target!.id,
        item: getLayoutItem(finalLayout, ds.itemId) ?? {
          ...ds.item,
          x: landing.x,
          y: landing.y,
        },
      });
    }

    const ids = new Set(affectedRef.current);
    ids.add(ds.sourceBoardId);
    ids.add(ds.currentBoardId);
    ids.forEach((id) => boardsRef.current.get(id)?.setPlaceholder(null));

    affectedRef.current.clear();
    sourceSnapshotRef.current = [];
    targetSnapshotsRef.current.clear();
    frozenRectsRef.current.clear();
    nestedInDraggedRef.current = new Set();
    previewRef.current = null;
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
