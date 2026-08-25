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
  createCollisionResolver,
  getLayoutItem,
  LayoutItem,
  moveElement,
  moveElements,
  placeInFreeSlot,
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

/**
 * Canonical key for the unordered pair `{id1, id2}`. Widget ids are unrestricted
 * strings, so a naive `` `${id1}|${id2}` `` join is ambiguous - an id containing
 * the delimiter lets two different pairs collide (e.g. `{"a|b","c"}` and
 * `{"a","b|c"}` both yield `"a|b|c"`). `JSON.stringify` of the sorted tuple
 * quotes and escapes each id, so distinct pairs always produce distinct keys.
 */
function pairKey(id1: string, id2: string): string {
  return id1 < id2 ? JSON.stringify([id1, id2]) : JSON.stringify([id2, id1]);
}

/**
 * Keys of every overlapping pair in the layout (see `pairKey`), so two layouts'
 * overlap sets can be compared to tell which overlaps a move *introduced* versus
 * which already existed.
 */
function overlappingPairs(layout: LayoutItem[]): Set<string> {
  const pairs = new Set<string>();
  for (let i = 0; i < layout.length; i++) {
    for (let j = i + 1; j < layout.length; j++) {
      const a = layout[i];
      const b = layout[j];
      if (collides(a, b)) {
        pairs.add(pairKey(a.i, b.i));
      }
    }
  }
  return pairs;
}

/**
 * Whether `after` contains an overlapping pair that `before` did not. Used to
 * reject only moves that *create* a new stack. A board may already hold
 * overlapping widgets - a `compact={null}` layout is never gap-compacted, and an
 * app can supply overlapping items directly (or toggle `allowOverlap` off after
 * stacking) - and those pre-existing overlaps must not freeze every subsequent
 * move by making a whole-layout collision check always true.
 */
function hasNewOverlap(before: Set<string>, after: LayoutItem[]): boolean {
  const afterPairs = overlappingPairs(after);
  for (const key of afterPairs) {
    if (!before.has(key)) return true;
  }
  return false;
}

/**
 * Whether any item in `after` has a different size than it had in `before`.
 */
function resizesAnything(before: LayoutItem[], after: LayoutItem[]): boolean {
  return after.some((a) => {
    const b = before.find((it) => it.i === a.i);
    return !!b && (b.w !== a.w || b.h !== a.h);
  });
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
  // Whether the latest cross-board preview actually landed at the requested
  // cell. A collision resolver may decline a placement, in which case
  // `moveElement` restores its synthetic origin; that must not be mistaken for a
  // valid target preview and committed somewhere the pointer never selected.
  const targetLandingRef = useRef<{ boardId: string; valid: boolean } | null>(
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

  const getDragState = useCallback(() => dragStateRef.current, []);

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
      const layoutAtStart = entry?.getLayout() ?? [];
      const item = entry ? getLayoutItem(layoutAtStart, itemId) : undefined;
      if (!entry || !item) return;

      // ---- Resolve the gesture's membership --------------------------------
      //
      // This is the ONE place a group drag is decided. Everything downstream
      // branches on `itemIds.length`, never on the selection itself, which is
      // what keeps the single-widget path provably untouched.
      //
      // Three rules, all enforced here:
      //  1. The grabbed widget must already be in the selection. Grabbing an
      //     unselected widget is an ordinary drag and never moves the selection
      //     — whether the grab should *replace* the selection is app policy.
      //  2. Members are resolved against this board's own layout, so a nested
      //     board's ids can never leak into another board's group.
      //  3. A static widget is never a member, matching `moveElement`'s guard.
      const selected = entry.getSelectedKeys();
      const memberIds =
        selected && selected.has(itemId)
          ? layoutAtStart
              .filter(
                (l) =>
                  l.i !== itemId &&
                  selected.has(l.i) &&
                  (!l.static || l.isDraggable === true),
              )
              .map((l) => l.i)
          : [];
      const itemIds = [itemId, ...memberIds];

      // Host nodes of every member, needed both to exclude nested boards and to
      // measure the float rects below. Ids are unique per provider and `itemIds`
      // only holds ids from this board, so the query cannot pick up a nested
      // board's widgets.
      const memberNodes: HTMLElement[] = widgetNode ? [widgetNode] : [];
      const memberRects = new Map<string, ViewportRect>();

      if (memberIds.length > 0) {
        const contentNode = entry.getContentNode();
        const idSet = new Set(itemIds);

        contentNode
          ?.querySelectorAll<HTMLElement>('[data-board-widget-id]')
          .forEach((el) => {
            const id = el.dataset.boardWidgetId;
            if (!id || !idSet.has(id)) return;
            if (id !== itemId) memberNodes.push(el);
            const r = el.getBoundingClientRect();
            memberRects.set(id, {
              left: r.left,
              top: r.top,
              width: r.width,
              height: r.height,
            });
          });
      }

      // Record boards nested inside the dragged widget(s) so they are never
      // picked as a drop target (dropping a widget into a board nested within
      // itself would unmount it). Computed here, before the widget floats into
      // the overlay, while its nested boards are still in-grid descendants.
      const nested = new Set<string>();
      if (memberNodes.length > 0) {
        boardsRef.current.forEach((e) => {
          const node = e.getContentNode();
          if (node && memberNodes.some((host) => host.contains(node))) {
            nested.add(e.id);
          }
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
      targetLandingRef.current = null;
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
      const items = itemIds
        .map((id) =>
          id === itemId ? draggedItem : getLayoutItem(layoutAtStart, id),
        )
        .filter((it): it is LayoutItem => it !== undefined);
      const next: BoardDragState = {
        sourceBoardId: boardId,
        currentBoardId: boardId,
        itemId,
        item: draggedItem,
        itemIds,
        items,
        rect,
        startRect: rect,
        memberRects,
        pointerType,
        nestedBoardIds: nested,
      };
      setDragState(next);
      entry.setPlaceholders(items.map((it) => ({ ...it })));
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
      // A resolution only replaces the engine's revert, so a mode is only live
      // where a collision would actually block the move.
      const collisionMode = compactor.preventCollision
        ? entry.getCollisionMode()
        : 'revert';

      // Which arrangement this frame resolves against.
      //
      // Normally it is the live layout: frame-to-frame continuity is what stops
      // `moveElement` sinking a no-op placement to the bottom of an occupied
      // column. But a *resolution* edits other widgets - a swap moves its partner,
      // and sizes it down to fit - and those edits are committed to the preview.
      // Chaining frames off each other then accumulates them: sweeping across two
      // neighbours exchanges with both, so widgets shuffle continuously under the
      // pointer, and each displaced widget shrinks a little more every time it is
      // displaced again. Resolving from the arrangement the gesture started with
      // makes a frame a pure function of the landing cell instead: one exchange,
      // the partner goes to where the drag began, dragging back retraces exactly,
      // and nothing accumulates. `moveGroupWithinBoard` recomputes from the
      // snapshot for the same reason.
      const startLayout = sourceSnapshotRef.current;
      const base =
        collisionMode !== 'revert' && getLayoutItem(startLayout, item.i)
          ? startLayout
          : layout;
      const live = getLayoutItem(base, item.i);
      // Deep-clone so `moveElement` (which mutates item objects in place) never
      // touches the live layout's items. A shallow copy shares those objects, so
      // rejecting a frame below would still leave the live layout mutated into
      // the overlapping arrangement (committed on drop). `moveWithKeyboard`
      // clones for the same reason.
      const working = live
        ? cloneLayout(base)
        : [...cloneLayout(base), { ...item, x, y }];
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
        {
          resolveCollision: createCollisionResolver(collisionMode, {
            cols: pp.cols,
            maxRows: entry.getMaxRows(),
            // The size it has in `base` - the gesture's start size when a
            // resolution is live, so a frame that shrank the widget can never
            // become the next frame's starting point.
            desired: { w: target.w, h: target.h },
          }),
        },
      );
      const compacted = [...compactor.compact(moved, pp.cols)];
      // Never commit a frame that *creates* a stack. In the legacy
      // (`compact={null}`) mode `moveElement` pushes colliding neighbours but the
      // no-op compactor leaves any residual overlap in place, so a push can drop
      // a neighbour on top of another widget. Skipping such frames keeps the
      // dragged widget at its last valid arrangement until the pointer reaches a
      // slot where the move (and any push) resolves cleanly - matching the
      // keyboard path. Only *newly introduced* overlaps block: pre-existing ones
      // (an app-supplied stacked layout) must not freeze the drag. `allowOverlap`
      // opts out entirely.
      if (
        !compactor.allowOverlap &&
        hasNewOverlap(overlappingPairs(base), compacted)
      ) {
        return;
      }
      entry.applyLayout(compacted, false);
      entry.setPlaceholders(
        [getLayoutItem(compacted, item.i)].filter(
          (it): it is LayoutItem => it !== undefined,
        ),
      );
    },
    [],
  );

  /**
   * Move the whole selection rigidly to an absolute delta.
   *
   * Unlike the single-widget path, each frame is recomputed from the drag-start
   * snapshot rather than from the previous frame. A rigid group at an absolute
   * delta is a pure function of that delta, so dragging back retraces the
   * arrangement exactly, pushed neighbours never accumulate, and there is no
   * hysteresis. The single path's frame-to-frame continuity exists to stop
   * `moveElement` sinking a no-op placement to the bottom of a column;
   * `moveElements` places the group explicitly, so that does not apply here.
   */
  const moveGroupWithinBoard = useCallback(
    (entry: BoardEntry, ds: BoardDragState, dx: number, dy: number) => {
      const pp = entry.getPositionParams();
      const result = moveElements(
        sourceSnapshotRef.current,
        new Set(ds.itemIds),
        dx,
        dy,
        {
          compactor: entry.getCompactor(),
          cols: pp.cols,
          maxRows: entry.getMaxRows(),
        },
      );

      if (!result.moved) return;

      entry.applyLayout(result.layout, false);
      entry.setPlaceholders(
        ds.itemIds
          .map((id) => getLayoutItem(result.layout, id))
          .filter((it): it is LayoutItem => it !== undefined),
      );
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
      // The same resolution policy as the pointer path, so an arrow key can reach
      // the arrangements a drop can (the invariant the overlap checks below are
      // written around) - with one limit enforced after the fact: see
      // `resizesAnything`.
      const resolveCollision = compactor.preventCollision
        ? createCollisionResolver(entry.getCollisionMode(), {
            cols: pp.cols,
            maxRows,
            desired: { w: live.w, h: live.h },
          })
        : undefined;
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
      // Overlaps already present before the move: a candidate is only rejected
      // for a *new* pair, never for one the board already had (see
      // `hasNewOverlap`). Computed once - the baseline is constant across the
      // directional scan.
      const beforePairs = overlappingPairs(layout);

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
          { resolveCollision },
        );
        const compacted = [...compactor.compact(moved, pp.cols)];
        const landed = getLayoutItem(compacted, item.i);
        if (!landed) continue;

        const advanced =
          directionX !== 0
            ? Math.sign(landed.x - live.x) === directionX && landed.y === live.y
            : Math.sign(landed.y - live.y) === directionY &&
              landed.x === live.x;
        // Reject a candidate that *introduces* an overlapping pair. Checking
        // only the moved widget is not enough: in the legacy (`compact={null}`)
        // and `preventCollision` modes the compactor does not resolve overlaps,
        // so a *pushed neighbour* can land on top of another widget even when the
        // moved widget itself is clear. Comparing the whole layout's overlap set
        // against the pre-move baseline keeps arrow moves from creating a stack
        // while still allowing movement around overlaps the board already had.
        // The pointer path enforces the same invariant (see `moveWithinBoard`),
        // so both inputs push/swap when clean and block otherwise. `allowOverlap`
        // opts out entirely.
        const overlaps =
          !compactor.allowOverlap && hasNewOverlap(beforePairs, compacted);
        // An arrow key moves widgets; it never resizes them. Unlike a pointer
        // drag - one gesture, which can always re-measure from the size it began
        // with - each press is a gesture of its own, so a resolution that shrank
        // something would become the next press's starting size and ratchet it
        // smaller with nothing left to restore from. So `swap` can exchange two
        // widgets that fit each other's slots outright, and anything needing a
        // resize is refused here and blocks as usual.
        if (!advanced || overlaps || resizesAnything(layout, compacted)) {
          continue;
        }

        entry.applyLayout(compacted, false);
        entry.setPlaceholders([landed]);
        lastLandingRef.current = { x: landed.x, y: landed.y };
        return;
      }
    },
    [],
  );

  /**
   * Keyboard equivalent of `moveGroupWithinBoard`: scan outward for the nearest
   * whole-group delta that resolves cleanly.
   *
   * Constraints are resolved through the **grabbed** widget only, and the delta
   * it yields is applied to the rest. `applyPositionConstraints` returns an
   * absolute position, so running it per member would shear the group apart
   * under `snapToGrid` or any app constraint — and the grabbed widget is the one
   * the user is aiming with.
   *
   * Unlike the pointer path this steps from the live layout, not the drag-start
   * snapshot, because keyboard moves accumulate one cell at a time.
   */
  const moveGroupWithKeyboard = useCallback(
    (entry: BoardEntry, ds: BoardDragState, deltaX: number, deltaY: number) => {
      const pp = entry.getPositionParams();
      const compactor = entry.getCompactor();
      const layout = entry.getLayout();
      const live = getLayoutItem(layout, ds.itemId);
      if (!live) return;

      const directionX = Math.sign(deltaX);
      const directionY = Math.sign(deltaY);
      if (directionX === 0 && directionY === 0) return;

      const maxRows = entry.getMaxRows();
      const ids = new Set(ds.itemIds);
      const members = layout.filter((l) => ids.has(l.i));
      if (members.length === 0) return;

      // Headroom of the whole block, so the scan never proposes a delta that is
      // clamped back to a no-op.
      const attempts =
        directionX < 0
          ? Math.min(...members.map((l) => l.x))
          : directionX > 0
            ? Math.min(...members.map((l) => pp.cols - l.w - l.x))
            : directionY < 0
              ? Math.min(...members.map((l) => l.y))
              : Number.isFinite(maxRows)
                ? Math.min(...members.map((l) => maxRows - l.h - l.y))
                : Math.max(1, bottom(layout) - live.y);
      const seen = new Set<string>();
      const beforePairs = overlappingPairs(layout);

      for (let distance = 1; distance <= Math.max(0, attempts); distance++) {
        const candidate = applyPositionConstraints(
          entry.getConstraints(),
          ds.item,
          live.x + directionX * distance,
          live.y + directionY * distance,
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

        const result = moveElements(
          layout,
          ids,
          candidate.x - live.x,
          candidate.y - live.y,
          { compactor, cols: pp.cols, maxRows },
        );
        if (!result.moved) continue;

        const landed = getLayoutItem(result.layout, ds.itemId);
        if (!landed) continue;

        const advanced =
          directionX !== 0
            ? Math.sign(landed.x - live.x) === directionX && landed.y === live.y
            : Math.sign(landed.y - live.y) === directionY &&
              landed.x === live.x;
        if (
          !advanced ||
          (!compactor.allowOverlap && hasNewOverlap(beforePairs, result.layout))
        ) {
          continue;
        }

        entry.applyLayout(result.layout, false);
        entry.setPlaceholders(
          ds.itemIds
            .map((id) => getLayoutItem(result.layout, id))
            .filter((it): it is LayoutItem => it !== undefined),
        );
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
      // `swap` is deliberately source-aware. Inside one board it exchanges two
      // widgets; across boards there is no slot on the destination to give back,
      // so it becomes strict empty-anchor insertion with downscaling. The strict
      // path also skips target compaction: inserting one widget must not reflow or
      // push any widget already owned by the destination.
      const strictIncomingSwap =
        compactor.preventCollision === true &&
        !compactor.allowOverlap &&
        target.getCollisionMode() === 'swap';

      const carried =
        previewRef.current?.boardId === target.id
          ? previewRef.current.working
          : null;
      // Deep-clone the base: `moveElement` mutates item objects in place, and a
      // rejected frame (see the overlap guard below) must not leave the carried
      // preview or the target's live layout mutated into an overlapping state.
      const base = cloneLayout(
        carried ??
          targetSnapshotsRef.current.get(target.id) ??
          target.getLayout(),
      ).filter((l) => l.i !== item.i);

      // Reuse the item's carried position as the move origin (continuity). On
      // first entry there is none, so seed it just above (or left of) its target
      // cell: that makes the first `moveElement` an *active* placement (never a
      // no-op) that pushes colliding widgets aside instead of the item sinking.
      const prevItem = carried ? getLayoutItem(carried, item.i) : undefined;
      const dragged: LayoutItem = prevItem
        ? // The carried frame supplies continuity of *position*; size comes from
          // the gesture's start whenever the cell changes, so a resolution that
          // shrank the widget on an earlier frame cannot ratchet it down (see
          // `moveWithinBoard` for both halves of this).
          prevItem.x === x && prevItem.y === y
          ? { ...prevItem }
          : { ...prevItem, w: item.w, h: item.h }
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
        {
          // No exchange across boards: the displaced widget would have to be
          // pushed back the other way, and a transfer moves one widget only. A
          // widget arriving from elsewhere has no slot here to trade, so `'swap'`
          // resolves as `'downscale'`.
          resolveCollision: compactor.preventCollision
            ? createCollisionResolver(target.getCollisionMode(), {
                cols: pp.cols,
                maxRows: target.getMaxRows(),
                desired: { w: item.w, h: item.h },
                allowExchange: false,
              })
            : undefined,
        },
      );
      const compacted = strictIncomingSwap
        ? cloneLayout(moved)
        : [...compactor.compact(moved, pp.cols)];
      const landed = getLayoutItem(compacted, item.i);
      // Skip a frame that would *newly* stack widgets on the target (see the same
      // guard in `moveWithinBoard`): keep the last valid preview instead of
      // committing an overlap the no-op compactor cannot resolve. The baseline is
      // the target's own widgets (`base`), so overlaps the target already had do
      // not block the incoming widget. `allowOverlap` opts out.
      if (
        !compactor.allowOverlap &&
        hasNewOverlap(overlappingPairs(base), compacted)
      ) {
        if (strictIncomingSwap) {
          const snapshot = targetSnapshotsRef.current.get(target.id);
          if (snapshot) target.applyLayout(cloneLayout(snapshot), false);
          target.setPlaceholders([]);
          previewRef.current = null;
          targetLandingRef.current = { boardId: target.id, valid: false };
        }
        return;
      }

      // A prevented collision restores the incoming item to the synthetic origin
      // used to make `moveElement` active. For a strict cross-board swap, only the
      // exact requested anchor is a valid insertion; an occupied anchor or a fit
      // below minW/minH therefore clears the preview and restores the untouched
      // target snapshot.
      if (strictIncomingSwap && (!landed || landed.x !== x || landed.y !== y)) {
        const snapshot = targetSnapshotsRef.current.get(target.id);
        if (snapshot) target.applyLayout(cloneLayout(snapshot), false);
        target.setPlaceholders([]);
        previewRef.current = null;
        targetLandingRef.current = { boardId: target.id, valid: false };
        return;
      }

      previewRef.current = { boardId: target.id, working: compacted };
      targetLandingRef.current = { boardId: target.id, valid: true };

      const previewItem = landed ?? { ...item, x, y };
      // Apply only the other widgets so the dragged item is never rendered as a
      // host on the target board.
      target.applyLayout(
        compacted.filter((l) => l.i !== item.i),
        false,
      );
      target.setPlaceholders([{ ...previewItem }]);
    },
    [],
  );

  const onDragMove = useEvent(
    (deltaX: number, deltaY: number, pointerType: string) => {
      const ds = dragStateRef.current;
      if (!ds) return;

      const isGroup = ds.itemIds.length > 1;

      if (pointerType === 'keyboard') {
        const source = boardsRef.current.get(ds.sourceBoardId);
        if (!source) return;
        if (isGroup) {
          moveGroupWithKeyboard(source, ds, deltaX, deltaY);
        } else {
          moveWithKeyboard(source, ds.item, deltaX, deltaY);
        }
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
      // A group drag never leaves its source board. Cross-board transfer is
      // single-item throughout (`WidgetTransferInfo`, the carried preview, the
      // free-slot fallback), and degrading a group to a single-widget transfer
      // would silently split a selection the user deliberately made. Pinning the
      // target keeps the whole gesture in-board and makes the limit testable.
      let target = isGroup ? source : hitTest(anchor) ?? source ?? null;

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
          prev?.setPlaceholders([]);
          previewRef.current = null;
          targetLandingRef.current = null;
        }
        if (isGroup) {
          // The group moves by the delta the grabbed widget travelled from its
          // drag-start position — an absolute delta, recomputed from the
          // snapshot each frame.
          moveGroupWithinBoard(target, ds, x - ds.item.x, y - ds.item.y);
        } else {
          moveWithinBoard(target, ds.item, x, y);
        }
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
        prev?.setPlaceholders([]);
        // Drop the carried working layout so the newly entered target seeds a
        // fresh preview from its own clean snapshot.
        previewRef.current = null;
        targetLandingRef.current = null;

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
        source.applyLayout(
          [...sc.compact(source.getLayout(), sp.cols)],
          true,
          'drag',
        );
      }
    } else {
      const landing = lastLandingRef.current ?? { x: ds.item.x, y: ds.item.y };
      const tp = target!.getPositionParams();
      const tc = target!.getCompactor();
      const strictIncomingSwap =
        tc.preventCollision === true &&
        !tc.allowOverlap &&
        target!.getCollisionMode() === 'swap';

      // Prefer committing the exact arrangement the user was previewing (item
      // already placed with the neighbours reflowed around it via continuity).
      const carried =
        previewRef.current?.boardId === target!.id &&
        getLayoutItem(previewRef.current.working, ds.itemId)
          ? previewRef.current.working
          : null;

      const hasValidStrictLanding =
        targetLandingRef.current?.boardId === target!.id &&
        targetLandingRef.current.valid &&
        carried != null;

      // A strict incoming swap is allowed to commit only the exact valid preview
      // shown under the pointer. An occupied anchor, a min-size failure, or moving
      // from a valid cell onto an invalid one cancels the transfer completely:
      // both boards return to their gesture-start snapshots and no controlled
      // layout or transfer callback fires.
      if (strictIncomingSwap && !hasValidStrictLanding) {
        if (source) {
          source.applyLayout(cloneLayout(sourceSnapshotRef.current), false);
        }
        const targetSnapshot = targetSnapshotsRef.current.get(target!.id);
        if (targetSnapshot) {
          target!.applyLayout(cloneLayout(targetSnapshot), false);
        }
      } else {
        // Remove the item from the source board and compact only after the target
        // landing is known to be committable.
        if (source) {
          const sp = source.getPositionParams();
          const sc = source.getCompactor();
          const remaining = source.getLayout().filter((l) => l.i !== ds.itemId);
          source.applyLayout(
            [...sc.compact(remaining, sp.cols)],
            true,
            'transfer',
          );
        }

        let finalLayout: LayoutItem[];
        if (carried) {
          // The strict path already produced an overlap-free exact placement and
          // must not compact the destination widgets around it.
          finalLayout = strictIncomingSwap
            ? cloneLayout(carried)
            : [...tc.compact(cloneLayout(carried), tp.cols)];
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
                targetSnapshotsRef.current.get(target!.id) ??
                target!.getLayout()
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
            {
              // Cross-board, so no exchange (see `previewOnTarget`). `newItem` is
              // built from the drag-start item, so its size is already the one to
              // measure against.
              resolveCollision: createCollisionResolver(
                target!.getCollisionMode(),
                {
                  cols: tp.cols,
                  maxRows: tp.maxRows,
                  desired: { w: ds.item.w, h: ds.item.h },
                  allowExchange: false,
                },
              ),
            },
          );
          finalLayout = [...tc.compact(moved, tp.cols)];
        }
        // Never commit a drop that *creates* a stack. When the compactor cannot
        // resolve overlaps (`compact={null}` / `preventCollision`) a teleport drop
        // into an occupied region would otherwise land the item on top of another
        // widget; place it in the first free slot instead so the pointer path
        // matches the keyboard path. Overlaps the target already had do not trigger
        // the reshuffle (they are preserved as-is). `allowOverlap` opts out.
        const targetOthers = cloneLayout(
          (
            targetSnapshotsRef.current.get(target!.id) ?? target!.getLayout()
          ).filter((l) => l.i !== ds.itemId),
        );
        if (
          !tc.allowOverlap &&
          hasNewOverlap(overlappingPairs(targetOthers), finalLayout)
        ) {
          finalLayout = [
            ...targetOthers,
            placeInFreeSlot(
              targetOthers,
              { ...ds.item, x: landing.x, y: landing.y },
              tp.cols,
              tp.maxRows,
            ),
          ];
        }
        target!.applyLayout(finalLayout, true, 'transfer');

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
    }

    const ids = new Set(affectedRef.current);
    ids.add(ds.sourceBoardId);
    ids.add(ds.currentBoardId);
    ids.forEach((id) => boardsRef.current.get(id)?.setPlaceholders([]));

    affectedRef.current.clear();
    sourceSnapshotRef.current = [];
    targetSnapshotsRef.current.clear();
    frozenRectsRef.current.clear();
    nestedInDraggedRef.current = new Set();
    previewRef.current = null;
    targetLandingRef.current = null;
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
      getDragState,
    }),
    [
      store,
      registerBoard,
      onDragStart,
      onDragMove,
      onDragEnd,
      dragState,
      getDragState,
    ],
  );
}
