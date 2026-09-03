import { useEffect, useRef, useState } from 'react';
import { useMove } from 'react-aria';

import { useEvent } from '../../../_internal/hooks';

import {
  createDashboardDropPreviews,
  findDashboardDropTargets,
  freezeDashboardTargetGeometry,
  getCrossParentPlacement,
  getDashboardGestureItem,
  getDashboardGestureItems,
  getDashboardGesturePlacements,
  getOwnDashboardDropTarget,
  resolveDashboardDrop,
  useDashboardDropPreview,
} from './drag';
import { clamp, DASHBOARD_ROOT_GAP, isSamePlacement } from './placement';
import { getSurfaceMoveProps } from './use-dashboard-node';

import type { RefObject } from 'react';
import type {
  DashboardDropPreview,
  DashboardDropTarget,
  DashboardPlacementGesture,
} from './drag';
import type {
  DashboardContainerKind,
  DashboardEditingContextValue,
  DashboardMetrics,
  DashboardPlacement,
  DashboardPlacementChangeInfo,
  DashboardPlacementChangeInput,
  DashboardPlacementChangeItem,
  DashboardPlacementChangePhase,
  DashboardPlacementChangeReason,
  DashboardTreeContextValue,
} from './types';

export interface DashboardGestureOptions {
  id: string;
  /** Containers and widgets differ in which destinations they may target. */
  isContainer: boolean;
  /** Set for containers; `tabs` may only move back to the root. */
  containerKind?: DashboardContainerKind;
  nodeRef: RefObject<HTMLElement | null>;
  tree: DashboardTreeContextValue;
  editing: DashboardEditingContextValue;
  metrics: DashboardMetrics;
  placement: DashboardPlacement;
  isSelected: boolean;
  selectSelf: (additive?: boolean) => void;
  onPlacementChange?: (
    placement: DashboardPlacement,
    info: DashboardPlacementChangeInfo,
  ) => void;
  canMove: boolean;
  canMoveColumns: boolean;
  canMoveRows: boolean;
  canResize: boolean;
  canResizeColumns: boolean;
  canResizeRows: boolean;
  minColumns: number;
  maxColumns: number;
  minRows: number;
  maxRows: number;
  /**
   * A top-level container orders itself vertically among its siblings instead of
   * occupying a row track, so its row axis is unbounded and one row step is the
   * height of the node rather than the shared row height.
   */
  isRootChild: boolean;
  /** How deep a destination may be before it would exceed three nesting levels. */
  maximumContainerParentDepth?: number;
}

/** One destination's answer: where the group lands and what that looks like. */
interface DashboardProposal {
  placement: DashboardPlacement;
  items: DashboardPlacementChangeItem[];
  destinationParentId: string | null;
  preview: DashboardDropPreview[];
  isBlocked: boolean;
  displaced: DashboardPlacementChangeItem[];
}

export interface DashboardGestures {
  isMoving: boolean;
  isResizing: boolean;
  dropPreview: DashboardDropPreview[];
  surfaceMoveProps: Record<string, unknown>;
  resizeProps: ReturnType<typeof useMove>['moveProps'];
  reportPlacement: (
    placement: DashboardPlacement,
    reason: DashboardPlacementChangeReason,
    phase: DashboardPlacementChangePhase,
    input: DashboardPlacementChangeInput,
    sourceParentId?: string | null,
    destinationParentId?: string | null,
    items?: DashboardPlacementChangeItem[],
    isBlocked?: boolean,
    displaced?: DashboardPlacementChangeItem[],
  ) => void;
}

/**
 * One pointer/keyboard gesture pipeline for both node types.
 *
 * Widgets and containers used to carry near-identical copies of this — the same
 * quantization, the same hit testing, the same preview bookkeeping — differing
 * only in the handful of `isRootChild` / `isContainer` branches below. Every fix
 * to the drag engine had to be made twice, and the two copies had already
 * drifted (one inlined the delta math the other called).
 */
export function useDashboardGestures(
  options: DashboardGestureOptions,
): DashboardGestures {
  const {
    id,
    isContainer,
    containerKind,
    nodeRef,
    tree,
    editing,
    metrics,
    placement,
    isSelected,
    selectSelf,
    onPlacementChange,
    canMove,
    canMoveColumns,
    canMoveRows,
    canResize,
    canResizeColumns,
    canResizeRows,
    minColumns,
    maxColumns,
    minRows,
    maxRows,
    isRootChild,
    maximumContainerParentDepth,
  } = options;

  const moveSessionRef = useRef<DashboardPlacementGesture | null>(null);
  const stopTrackingRef = useRef<(() => void) | null>(null);
  const stopEscapeRef = useRef<(() => void) | null>(null);
  const pointerRef = useRef({ clientX: 0, clientY: 0 });
  const resizeSessionRef = useRef<DashboardPlacementGesture | null>(null);
  const pointerStartRef = useRef({ clientX: 0, clientY: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dropPreview, updateDropPreview] = useDashboardDropPreview();

  const reportPlacement = useEvent(
    (
      nextPlacement: DashboardPlacement,
      reason: DashboardPlacementChangeReason,
      phase: DashboardPlacementChangePhase,
      input: DashboardPlacementChangeInput,
      sourceParentId = tree.layoutParentId,
      destinationParentId = sourceParentId,
      items?: DashboardPlacementChangeItem[],
      isBlocked?: boolean,
      displaced?: DashboardPlacementChangeItem[],
    ) => {
      onPlacementChange?.(nextPlacement, {
        reason,
        phase,
        input,
        ...(isBlocked && { isBlocked }),
        ...(displaced?.length && { displaced }),
        ...(destinationParentId !== sourceParentId && {
          sourceParentId,
          destinationParentId,
        }),
        ...(items && items.length > 1 && { items }),
      });
    },
  );

  const createGesture = useEvent(
    (
      input: DashboardPlacementChangeInput,
      reason: DashboardPlacementChangeReason,
    ): DashboardPlacementGesture => {
      const element = nodeRef.current;
      const parentWidth =
        element?.parentElement?.getBoundingClientRect().width ?? 0;
      const columnWidth =
        (parentWidth - metrics.columnGap * (tree.parentColumns - 1)) /
          tree.parentColumns +
        metrics.columnGap;
      const ownRect = element?.getBoundingClientRect();
      const pointerX = pointerStartRef.current.clientX;
      const pointerY = pointerStartRef.current.clientY;
      const gestureItems = !element
        ? []
        : reason === 'move' && input === 'pointer'
          ? getDashboardGestureItems(element, id, placement, isSelected)
          : [getDashboardGestureItem(id, placement, element)];

      return {
        origin: placement,
        current: placement,
        currentItems: gestureItems.map((item) => ({
          id: item.id,
          placement: item.origin,
        })),
        sourceParentId: tree.layoutParentId,
        destinationParentId: tree.layoutParentId,
        deltaX: 0,
        deltaY: 0,
        clientX: pointerX,
        clientY: pointerY,
        grabOffsetX: ownRect ? pointerX - ownRect.left : 0,
        grabOffsetY: ownRect ? pointerY - ownRect.top : 0,
        frozen:
          reason === 'move' && input === 'pointer' && element
            ? freezeDashboardTargetGeometry(element)
            : undefined,
        keyboardColumns: 0,
        keyboardRows: 0,
        columnStep: Math.max(1, columnWidth),
        rowStep: Math.max(
          1,
          reason === 'move' && isRootChild
            ? (ownRect?.height ?? 0) + DASHBOARD_ROOT_GAP
            : metrics.rowHeight + metrics.rowGap,
        ),
        input,
        canCommit: true,
        items: gestureItems,
      };
    },
  );

  const updateGestureDeltas = useEvent(
    (
      gesture: DashboardPlacementGesture,
      deltaX: number,
      deltaY: number,
      input: DashboardPlacementChangeInput,
    ) => {
      gesture.input = input;

      if (input === 'keyboard') {
        gesture.keyboardColumns += Math.sign(deltaX);
        gesture.keyboardRows += Math.sign(deltaY);
      } else {
        gesture.deltaX += deltaX;
        gesture.deltaY += deltaY;
      }

      return {
        columns:
          input === 'keyboard'
            ? gesture.keyboardColumns
            : Math.round(gesture.deltaX / gesture.columnStep),
        rows:
          input === 'keyboard'
            ? gesture.keyboardRows
            : Math.round(gesture.deltaY / gesture.rowStep),
      };
    },
  );

  /** A `tabs` container is root-only, so it can leave its parent only upward. */
  const canTargetOtherParent = useEvent(
    (target: DashboardDropTarget) =>
      containerKind !== 'tabs' || target.kind === 'root',
  );

  /**
   * What one destination would accept, or `null` if it would accept nothing.
   *
   * Split out of `onMove` so the caller can try destinations in order instead of
   * betting the frame on the deepest one.
   */
  const proposeForTarget = useEvent(
    (
      target: DashboardDropTarget,
      gesture: DashboardPlacementGesture,
      samePlacement: DashboardPlacement,
    ): DashboardProposal | null => {
      const isSameParent = target.parentId === gesture.sourceParentId;
      let landing: DashboardPlacement;

      if (isSameParent) {
        landing = samePlacement;
      } else {
        if (!canTargetOtherParent(target)) return null;
        const crossParentPlacement = getCrossParentPlacement(
          target,
          gesture,
          minColumns,
          minRows,
          isContainer,
          metrics,
        );
        if (!crossParentPlacement) return null;
        landing = crossParentPlacement;
      }

      const group = getDashboardGesturePlacements(target, gesture, landing);
      if (!group?.length) return null;

      const movingIds = new Set(gesture.items.map((item) => item.id));
      const resolution = resolveDashboardDrop(
        target,
        group,
        movingIds,
        gesture.sourceParentId,
        gesture.items.map((item) => item.origin),
      );

      return {
        placement:
          resolution.items.find((item) => item.id === id)?.placement ?? landing,
        items: resolution.items,
        displaced: resolution.displaced,
        destinationParentId: target.parentId,
        isBlocked: resolution.status !== 'valid',
        preview: createDashboardDropPreviews(
          target,
          resolution.items,
          gesture.items,
          metrics,
          resolution.status,
        ),
      };
    },
  );

  /**
   * Put the layout back and stop the gesture from committing.
   *
   * Used by Escape and by `pointercancel`. Both need the origin re-reported,
   * because the consumer has been applying `preview` placements all along and
   * simply not committing would leave it holding the last preview.
   */
  const cancelMove = useEvent(() => {
    const gesture = moveSessionRef.current;
    if (!gesture || gesture.cancelled) return;
    gesture.cancelled = true;
    gesture.canCommit = false;
    updateDropPreview(null);

    if (
      isSamePlacement(gesture.current, gesture.origin) &&
      gesture.destinationParentId === gesture.sourceParentId
    ) {
      return;
    }
    reportPlacement(
      gesture.origin,
      'move',
      'commit',
      gesture.input,
      gesture.sourceParentId,
      gesture.sourceParentId,
      gesture.items.map((item) => ({ id: item.id, placement: item.origin })),
    );
  });

  /**
   * Follow the pointer from press to release.
   *
   * Installed on pointer-down rather than at `onMoveStart`, which `useMove`
   * only raises on the *first* move — by then one position has already been
   * missed, and a gesture short enough to fit in a couple of events would hit-
   * test against the press point. Capture phase so the position is current
   * before `useMove`'s own window listener turns the event into `onMove`.
   */
  const beginPointerTracking = useEvent((clientX: number, clientY: number) => {
    pointerRef.current = { clientX, clientY };
    stopTrackingRef.current?.();

    const onPointerMove = (event: PointerEvent) => {
      pointerRef.current = { clientX: event.clientX, clientY: event.clientY };
    };
    const teardown = () => {
      window.removeEventListener('pointermove', onPointerMove, {
        capture: true,
      });
      window.removeEventListener('pointerup', teardown, { capture: true });
      window.removeEventListener('pointercancel', onPointerCancel, {
        capture: true,
      });
      stopTrackingRef.current = null;
    };
    const onPointerCancel = () => {
      cancelMove();
      teardown();
    };

    window.addEventListener('pointermove', onPointerMove, { capture: true });
    window.addEventListener('pointerup', teardown, { capture: true });
    window.addEventListener('pointercancel', onPointerCancel, {
      capture: true,
    });
    stopTrackingRef.current = teardown;
  });

  // A node removed mid-gesture — a deletion, a re-key, a StrictMode remount —
  // would otherwise leave its capture-phase window listeners running on every
  // pointer move for the rest of the session.
  useEffect(
    () => () => {
      stopTrackingRef.current?.();
      stopEscapeRef.current?.();
    },
    [],
  );

  /** Escape has to come from the window: `useMove` reports no cancellation. */
  const listenForEscape = useEvent(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      cancelMove();
    };

    window.addEventListener('keydown', onKeyDown, { capture: true });

    return () =>
      window.removeEventListener('keydown', onKeyDown, { capture: true });
  });

  const { moveProps } = useMove({
    onMoveStart(event) {
      if (!canMove) return;
      if (!isSelected) selectSelf(false);
      editing.startMoving(id);
      setIsMoving(true);
      updateDropPreview(null);
      moveSessionRef.current = createGesture(
        event.pointerType === 'keyboard' ? 'keyboard' : 'pointer',
        'move',
      );
      stopEscapeRef.current?.();
      stopEscapeRef.current = listenForEscape();
    },
    onMove(event) {
      const gesture = moveSessionRef.current;
      if (!canMove || !gesture || gesture.cancelled) return;
      const input = event.pointerType === 'keyboard' ? 'keyboard' : 'pointer';
      gesture.clientX = pointerRef.current.clientX;
      gesture.clientY = pointerRef.current.clientY;
      const delta = updateGestureDeltas(
        gesture,
        input === 'pointer' || canMoveColumns ? event.deltaX : 0,
        input === 'pointer' || canMoveRows ? event.deltaY : 0,
        input,
      );
      const samePlacement: DashboardPlacement = {
        ...gesture.origin,
        column: canMoveColumns
          ? clamp(
              gesture.origin.column + delta.columns,
              0,
              tree.parentColumns - gesture.origin.columns,
            )
          : gesture.origin.column,
        row: canMoveRows
          ? isRootChild
            ? Math.max(0, gesture.origin.row + delta.rows)
            : clamp(
                gesture.origin.row + delta.rows,
                0,
                tree.parentRows - gesture.origin.rows,
              )
          : gesture.origin.row,
      };
      let nextPlacement = samePlacement;
      let destinationParentId = gesture.sourceParentId;
      let isBlocked = false;
      let displaced: DashboardPlacementChangeItem[] = [];
      let currentItems: DashboardPlacementChangeItem[] = [
        { id, placement: samePlacement },
      ];

      if (input === 'pointer' && nodeRef.current) {
        const targets = findDashboardDropTargets(
          nodeRef.current,
          gesture.clientX,
          gesture.clientY,
          id,
          isContainer,
          maximumContainerParentDepth,
          gesture.frozen,
        );
        let proposal: DashboardProposal | null = null;

        for (const target of targets) {
          proposal = proposeForTarget(target, gesture, samePlacement);
          if (proposal) break;
        }

        updateDropPreview(proposal?.preview ?? null);
        gesture.canCommit =
          !!proposal?.preview.length &&
          proposal.preview.every((item) => item.status === 'valid');
        if (!proposal) return;

        nextPlacement = proposal.placement;
        destinationParentId = proposal.destinationParentId;
        currentItems = proposal.items;
        displaced = proposal.displaced;
        isBlocked = proposal.isBlocked;
      } else {
        updateDropPreview(null);
        const own = nodeRef.current
          ? getOwnDashboardDropTarget(nodeRef.current)
          : null;
        const resolution = own
          ? resolveDashboardDrop(
              own,
              currentItems,
              new Set(gesture.items.map((item) => item.id)),
              gesture.sourceParentId,
              gesture.items.map((item) => item.origin),
            )
          : null;

        if (resolution) {
          currentItems = resolution.items;
          displaced = resolution.displaced;
          nextPlacement =
            resolution.items.find((item) => item.id === id)?.placement ??
            nextPlacement;
          isBlocked = resolution.status !== 'valid';
        }
        gesture.canCommit = !isBlocked;
      }

      if (
        isSamePlacement(nextPlacement, gesture.current) &&
        destinationParentId === gesture.destinationParentId
      ) {
        return;
      }
      gesture.current = nextPlacement;
      gesture.currentItems = currentItems;
      gesture.currentDisplaced = displaced;
      gesture.destinationParentId = destinationParentId;
      reportPlacement(
        nextPlacement,
        'move',
        'preview',
        gesture.input,
        gesture.sourceParentId,
        destinationParentId,
        currentItems,
        isBlocked,
        displaced,
      );
    },
    onMoveEnd() {
      const gesture = moveSessionRef.current;
      moveSessionRef.current = null;
      stopEscapeRef.current?.();
      stopEscapeRef.current = null;
      editing.stopMoving(id);
      setIsMoving(false);
      updateDropPreview(null);
      if (
        !canMove ||
        !gesture ||
        gesture.cancelled ||
        !gesture.canCommit ||
        (isSamePlacement(gesture.current, gesture.origin) &&
          gesture.destinationParentId === gesture.sourceParentId)
      ) {
        return;
      }
      reportPlacement(
        gesture.current,
        'move',
        'commit',
        gesture.input,
        gesture.sourceParentId,
        gesture.destinationParentId,
        gesture.currentItems,
        false,
        gesture.currentDisplaced,
      );
    },
  });

  const surfaceMoveProps = getSurfaceMoveProps(
    moveProps,
    canMove,
    nodeRef,
    (clientX, clientY) => {
      pointerStartRef.current = { clientX, clientY };
      beginPointerTracking(clientX, clientY);
    },
  );

  const { moveProps: resizeProps } = useMove({
    onMoveStart(event) {
      if (!canResize) return;
      selectSelf(false);
      setIsResizing(true);
      resizeSessionRef.current = createGesture(
        event.pointerType === 'keyboard' ? 'keyboard' : 'pointer',
        'resize',
      );
    },
    onMove(event) {
      const gesture = resizeSessionRef.current;
      if (!canResize || !gesture) return;
      const delta = updateGestureDeltas(
        gesture,
        canResizeColumns ? event.deltaX : 0,
        canResizeRows ? event.deltaY : 0,
        event.pointerType === 'keyboard' ? 'keyboard' : 'pointer',
      );
      const maxColumnsAtOrigin = Math.min(
        maxColumns,
        tree.parentColumns - gesture.origin.column,
      );
      const maxRowsAtOrigin = isRootChild
        ? maxRows
        : Math.min(maxRows, tree.parentRows - gesture.origin.row);
      const nextPlacement: DashboardPlacement = {
        ...gesture.origin,
        columns: canResizeColumns
          ? clamp(
              gesture.origin.columns + delta.columns,
              minColumns,
              maxColumnsAtOrigin,
            )
          : gesture.origin.columns,
        rows: canResizeRows
          ? clamp(gesture.origin.rows + delta.rows, minRows, maxRowsAtOrigin)
          : gesture.origin.rows,
      };

      if (isSamePlacement(nextPlacement, gesture.current)) return;
      gesture.current = nextPlacement;
      reportPlacement(nextPlacement, 'resize', 'preview', gesture.input);
    },
    onMoveEnd() {
      const gesture = resizeSessionRef.current;
      resizeSessionRef.current = null;
      setIsResizing(false);
      if (
        !canResize ||
        !gesture ||
        isSamePlacement(gesture.current, gesture.origin)
      ) {
        return;
      }
      reportPlacement(gesture.current, 'resize', 'commit', gesture.input);
    },
  });

  return {
    isMoving,
    isResizing,
    dropPreview,
    surfaceMoveProps,
    resizeProps,
    reportPlacement,
  };
}
