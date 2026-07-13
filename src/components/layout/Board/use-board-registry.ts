import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  bottom,
  calcXYRaw,
  cloneLayout,
  collides,
  getLayoutItem,
  LayoutItem,
  moveElement,
} from './grid-core';

/**
 * The dragged widget's center in viewport coordinates.
 *
 * This is the anchor the drop-target hit-test uses to pick which board a drag is
 * over, so a board (including an empty one) opens as soon as the widget's center
 * enters it rather than only once its whole top-left corner is inside.
 *
 * The landing itself stays anchored to the grabbed top-left (`rect.left/top` in
 * `computeLanding`): that point is this center offset by the widget's own fixed
 * pixel size, so the resolved landing cell keeps corresponding to where the
 * floating overlay clone is drawn (see `WidgetHost`) and the placeholder keeps
 * tracking the ghost. The only unavoidable divergence is while the widget
 * physically overhangs a board edge - a placeholder cannot render outside row 0
 * / column 0 - which is the accepted tradeoff for opening on the center.
 */
function rectCenter(rect: ViewportRect): { x: number; y: number } {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/** Whether any two items in the layout overlap. */
function hasCollision(layout: LayoutItem[]): boolean {
  for (let i = 0; i < layout.length; i++) {
    for (let j = i + 1; j < layout.length; j++) {
      if (collides(layout[i], layout[j])) return true;
    }
  }
  return false;
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
  // Live pointer position (viewport coords) tracked for the whole drag via a
  // window listener. `useMove` only reports deltas, but the ancestor-handoff gate
  // needs the actual cursor (not the dragged widget's top-left anchor, which sits
  // above the cursor by the grab offset) so a nested board hands off to its
  // ancestor only once the *pointer* truly leaves the container widget. Null for
  // keyboard drags (no pointer) and until the first pointer move.
  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const [dragState, setDragStateInternal] = useState<BoardDragState | null>(
    null,
  );

  const setDragState = useCallback((next: BoardDragState | null) => {
    dragStateRef.current = next;
    setDragStateInternal(next);
  }, []);

  // Record the live cursor for the ancestor-handoff gate (see `pointerPosRef`).
  // Capture phase so it lands before `useMove`'s own window listeners drive the
  // frame's `onDragMove`.
  const trackPointer = useCallback((e: PointerEvent) => {
    pointerPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Safety net: drop the window listener if the hook unmounts mid-drag.
  useEffect(
    () => () => window.removeEventListener('pointermove', trackPointer, true),
    [trackPointer],
  );

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
  // mount (or become visible) mid-drag. A board hidden at drag start - e.g. a
  // board inside an inactive tab - has a degenerate (0x0) frozen rect; ignore
  // it and read the live rect instead, freezing that first real measurement so
  // later frames stay stable (no preview feedback loop). This lets a tab board
  // revealed by a spring-loaded tab switch become a valid drop/landing target.
  const getBoardRect = useCallback((entry: BoardEntry): DOMRect | null => {
    const frozen = frozenRectsRef.current.get(entry.id);
    if (frozen && frozen.width > 0 && frozen.height > 0) return frozen;

    const live = entry.getContentRect();
    if (live && live.width > 0 && live.height > 0) {
      frozenRectsRef.current.set(entry.id, live);
      return live;
    }

    return frozen ?? live;
  }, []);

  /** True when board `outer` DOM-contains board `inner` (outer is an ancestor). */
  const isAncestorBoard = useCallback(
    (outer: BoardEntry, inner: BoardEntry): boolean => {
      const outerNode = outer.getContentNode();
      const innerNode = inner.getContentNode();
      return !!outerNode && !!innerNode && outerNode.contains(innerNode);
    },
    [],
  );

  /**
   * Viewport rect of the widget host a nested board lives in, or null for a
   * top-level board. Lets a drag stay anchored to a nested board while the anchor
   * is still within its container widget (e.g. over a Tabs header sitting above
   * the board), so an ancestor board does not reflow prematurely.
   */
  const getBoardContainerRect = useCallback(
    (entry: BoardEntry): DOMRect | null => {
      const host = entry
        .getContentNode()
        ?.parentElement?.closest<HTMLElement>('[data-board-widget-host]');
      return host?.getBoundingClientRect() ?? null;
    },
    [],
  );

  /** Whether a point falls within a rect (inclusive of edges). */
  const pointInRect = useCallback(
    (point: { x: number; y: number }, rect: DOMRect): boolean =>
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom,
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
        // Skip boards that are currently hidden - e.g. the board inside an
        // inactive tab after a spring-loaded tab switch. Such a board keeps the
        // frozen rect it had while visible, which would otherwise shadow the
        // sibling board now shown in the exact same screen area (tabs share it),
        // trapping the drag in the hidden board. A hidden element reports a
        // zero-sized live rect, so use that as the visibility gate while still
        // reading geometry from the frozen rect (no preview feedback loop).
        const liveRect = entry.getContentRect();
        if (!liveRect || liveRect.width === 0 || liveRect.height === 0) return;
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
      // Start tracking the live cursor for the ancestor-handoff gate. Keyboard
      // drags have no pointer, so the gate falls back to the widget anchor.
      pointerPosRef.current = null;
      if (pointerType !== 'keyboard') {
        window.addEventListener('pointermove', trackPointer, true);
      }
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
        nestedBoardIds: nested,
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
   * Move a widget by one logical keyboard step. Unlike pointer movement, this
   * starts from the live grid coordinates rather than DOM geometry and scans
   * farther in the requested direction when the adjacent slot cannot produce a
   * valid move.
   */
  const moveWithKeyboard = useCallback(
    (entry: BoardEntry, item: LayoutItem, deltaX: number, deltaY: number) => {
      const pp = entry.getPositionParams();
      const compactor = entry.getCompactor();
      const layout = entry.getLayout();
      const live = getLayoutItem(layout, item.i);
      if (!live) return;

      const directionX = Math.sign(deltaX);
      const directionY = Math.sign(deltaY);
      if (directionX === 0 && directionY === 0) return;

      const maxRows = entry.getMaxRows();
      const attempts =
        directionX < 0
          ? live.x
          : directionX > 0
            ? Math.max(0, pp.cols - live.w - live.x)
            : directionY < 0
              ? live.y
              : Number.isFinite(maxRows)
                ? Math.max(0, maxRows - live.h - live.y)
                : Math.max(1, bottom(layout) - live.y);
      const seen = new Set<string>();

      for (let distance = 1; distance <= attempts; distance++) {
        const rawX = live.x + directionX * distance;
        const rawY = live.y + directionY * distance;
        const candidate = applyPositionConstraints(
          entry.getConstraints(),
          item,
          rawX,
          rawY,
          {
            cols: pp.cols,
            maxRows,
            containerWidth: pp.containerWidth,
            containerHeight: entry.getContainerHeight(),
            rowHeight: pp.rowHeight,
            margin: pp.margin,
            layout,
          },
        );
        const candidateKey = `${candidate.x}:${candidate.y}`;
        if (seen.has(candidateKey)) continue;
        seen.add(candidateKey);

        // A custom constraint may jump farther than one cell. It is still a
        // valid candidate only when it advances in the requested direction and
        // does not introduce movement on the orthogonal axis.
        if (
          (directionX !== 0 &&
            (Math.sign(candidate.x - live.x) !== directionX ||
              candidate.y !== live.y)) ||
          (directionY !== 0 &&
            (Math.sign(candidate.y - live.y) !== directionY ||
              candidate.x !== live.x))
        ) {
          continue;
        }

        const working = cloneLayout(layout);
        const target = getLayoutItem(working, item.i);
        if (!target) return;
        const moved = moveElement(
          working,
          target,
          candidate.x,
          candidate.y,
          true,
          compactor.preventCollision,
          compactor.type,
          pp.cols,
          compactor.allowOverlap,
        );
        const compacted = [...compactor.compact(moved, pp.cols)];
        const landed = getLayoutItem(compacted, item.i);
        if (!landed) continue;

        const advanced =
          directionX !== 0
            ? Math.sign(landed.x - live.x) === directionX && landed.y === live.y
            : Math.sign(landed.y - live.y) === directionY &&
              landed.x === live.x;
        // Reject any candidate whose resulting layout contains an overlapping
        // pair. Checking only the moved widget is not enough: in the legacy
        // (`compact={null}`) and `preventCollision` modes the compactor does not
        // resolve overlaps, so a *pushed neighbour* can land on top of another
        // widget even when the moved widget itself is clear. The stricter
        // whole-layout check keeps arrow moves from ever creating a stack (the
        // pointer path is unaffected). `allowOverlap` opts out entirely.
        const overlaps = !compactor.allowOverlap && hasCollision(compacted);
        if (!advanced || overlaps) continue;

        entry.applyLayout(compacted, false);
        entry.setPlaceholder(landed);
        lastLandingRef.current = { x: landed.x, y: landed.y };
        return;
      }
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
    (deltaX: number, deltaY: number, pointerType: string) => {
      const ds = dragStateRef.current;
      if (!ds) return;

      if (pointerType === 'keyboard') {
        const source = boardsRef.current.get(ds.sourceBoardId);
        if (source) moveWithKeyboard(source, ds.item, deltaX, deltaY);
        return;
      }

      const newRect: ViewportRect = {
        ...ds.rect,
        left: ds.rect.left + deltaX,
        top: ds.rect.top + deltaY,
      };

      const source = boardsRef.current.get(ds.sourceBoardId);
      // Hit-test with the widget's center so a board opens as soon as the center
      // enters it (see `rectCenter`). The landing still resolves from the grabbed
      // top-left, which is this center offset by the widget's own size, so the
      // placeholder keeps tracking the floating overlay. Fall back to the source
      // board so a pointer outside every board keeps the widget anchored to where
      // it came from. Frozen rects make this deterministic (no preview-induced
      // flip-flop).
      const anchor = rectCenter(newRect);
      let target = hitTest(anchor) ?? source ?? null;

      // Keep the drag on a nested source board while the cursor is still within
      // the widget that hosts it, instead of handing off to an ancestor board.
      // Hit-testing anchors on the dragged widget's top-left corner, which sits
      // above the cursor by the grab offset, so nudging a widget up inside a
      // nested board (e.g. toward a Tabs header above it) pushes that anchor into
      // the ancestor's area while the pointer is still over the container. Gating
      // on the real cursor (not the anchor) means the ancestor only reflows once
      // the pointer truly leaves the container widget - no transient shift.
      // Cross-tab / sibling boards are unaffected: they are not ancestors of the
      // source, so a real move out still hands off normally.
      if (
        target &&
        source &&
        target.id !== source.id &&
        isAncestorBoard(target, source)
      ) {
        const containerRect = getBoardContainerRect(source);
        const gatePoint = pointerPosRef.current ?? anchor;
        if (containerRect && pointInRect(gatePoint, containerRect)) {
          target = source;
        }
      }

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
    window.removeEventListener('pointermove', trackPointer, true);
    pointerPosRef.current = null;
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
