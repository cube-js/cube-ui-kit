import { tasty } from '@tenphi/tasty';
import {
  FocusEvent,
  Key,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useEvent } from '../../../_internal';
import { useLayoutEffect } from '../../../utils/react/useLayoutEffect';
import { DisplayTransition } from '../../helpers/DisplayTransition/DisplayTransition';
import { Portal } from '../../portal';
import { ToastItem } from '../Toast/ToastItem';

import { NotificationItem } from './NotificationItem';

import type { InternalToast } from '../Toast/types';
import type { DismissReason, InternalNotification } from './types';

// ─── Constants ───────────────────────────────────────────────────────

const COLLAPSE_VISIBLE_HEIGHT = 10;
const CONTAINER_OFFSET = 16;
const ITEM_GAP = 8;
const DEFAULT_ITEM_HEIGHT = 56;

// ─── Styled Elements ─────────────────────────────────────────────────

const OverlayContainerElement = tasty({
  styles: {
    position: 'fixed',
    top: '2x',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 100,
    padding: '1x',
    height: '0',
    pointerEvents: 'none',
  },
});

const OverlayItemWrapper = tasty({
  styles: {
    position: 'absolute',
    top: '0',
    left: '50%',
    transform: {
      '': 'translateX(-50%) translateY(-50%)',
      'isMeasured & isShown': 'translateX(-50%) translateY(0)',
    },
    width: 'max-content 50x',
    pointerEvents: 'auto',
    transition: {
      '': 'opacity $transition ease-in, transform $transition ease-in',
      isMeasured:
        'top $transition ease-in, opacity $transition ease-in, transform $transition ease-in',
    },
    opacity: {
      '': 0,
      isShown: 1,
    },
  },
});

// ─── Unified Item Type ───────────────────────────────────────────────

type OverlayItem =
  | { kind: 'toast'; data: InternalToast }
  | { kind: 'notification'; data: InternalNotification };

function getItemId(item: OverlayItem): string {
  return item.data.internalId;
}

function isItemExiting(item: OverlayItem): boolean {
  return item.data.isExiting === true;
}

function getItemCreatedAt(item: OverlayItem): number {
  return item.data.createdAt;
}

// ─── useItemPositions Hook ───────────────────────────────────────────

interface ItemPositionsResult {
  heights: Record<string, number>;
  /** Set of item IDs that have been measured AND painted at their correct position. */
  settledIds: Set<string>;
  positions: Map<string, number>;
  lastPositionsRef: ReturnType<typeof useRef<Map<string, number>>>;
  itemRefs: ReturnType<typeof useRef<Map<string, HTMLDivElement>>>;
  createRefCallback: (
    itemId: string,
    displayRef: (el: HTMLElement | null) => void,
  ) => (el: HTMLDivElement | null) => void;
}

/**
 * Manages height measurement, position calculation, and ref tracking
 * for overlay items. Extracted from OverlayContainer for readability.
 */
function useItemPositions(visibleItems: OverlayItem[]): ItemPositionsResult {
  const [heights, setHeights] = useState<Record<string, number>>({});
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastPositionsRef = useRef<Map<string, number>>(new Map());

  // Items that have been measured AND painted at their correct position.
  // Lags one frame behind `heights` so the browser paints the item at
  // its final `top` before the CSS `top` transition is enabled.
  const [settledIds, setSettledIds] = useState<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);

  // Measure heights using layout effect to avoid visible layout shifts.
  // Runs every render but bails early if nothing changed.
  useLayoutEffect(() => {
    const newHeights: Record<string, number> = {};
    let hasChanges = false;

    itemRefs.current.forEach((el, id) => {
      const height = el.offsetHeight || DEFAULT_ITEM_HEIGHT;
      newHeights[id] = height;

      if (heights[id] !== height) {
        hasChanges = true;
      }
    });

    for (const id of Object.keys(heights)) {
      if (!itemRefs.current.has(id)) {
        hasChanges = true;
      }
    }

    if (hasChanges) {
      setHeights(newHeights);
    }
  });

  // After heights change, schedule settledIds update for the next frame.
  // This ensures the item is painted at its correct position (with no top
  // transition) before we enable the transition.
  useEffect(() => {
    const heightKeys = Object.keys(heights);
    const newIds = heightKeys.filter((id) => !settledIds.has(id));
    const hasStaleIds =
      settledIds.size > 0 && [...settledIds].some((id) => !(id in heights));

    if (newIds.length === 0 && !hasStaleIds) return;

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
    }

    // For pruning-only updates (no new items), apply synchronously since
    // there's no need to wait for a paint frame.
    if (newIds.length === 0 && hasStaleIds) {
      setSettledIds((prev) => new Set(heightKeys.filter((id) => prev.has(id))));
      return;
    }

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setSettledIds((prev) => {
        const next = new Set<string>();

        // Only keep IDs that still exist in heights (prune removed items)
        for (const id of heightKeys) {
          if (prev.has(id)) {
            next.add(id);
          }
        }

        for (const id of newIds) {
          next.add(id);
        }

        return next;
      });
    });

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [heights]);

  const createRefCallback = useCallback(
    (itemId: string, displayRef: (el: HTMLElement | null) => void) =>
      (el: HTMLDivElement | null) => {
        displayRef(el);

        if (el) {
          itemRefs.current.set(itemId, el);
        } else {
          itemRefs.current.delete(itemId);
        }
      },
    [],
  );

  const positions = useMemo(() => {
    const posMap = new Map<string, number>();
    let currentTop = 0;

    for (const item of visibleItems) {
      const id = getItemId(item);
      posMap.set(id, currentTop);
      const height = heights[id] ?? DEFAULT_ITEM_HEIGHT;
      currentTop += height + ITEM_GAP;
    }

    return posMap;
  }, [visibleItems, heights]);

  useEffect(() => {
    positions.forEach((pos, id) => {
      lastPositionsRef.current.set(id, pos);
    });
  }, [positions]);

  return {
    heights,
    settledIds,
    positions,
    lastPositionsRef,
    itemRefs,
    createRefCallback,
  };
}

// ─── useCollapseState Hook ───────────────────────────────────────────

interface CollapseStateResult {
  isCollapsed: boolean;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleFocus: () => void;
  handleBlur: (e: FocusEvent) => void;
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * Manages collapse/expand behavior and pause state for the overlay container.
 * Extracted from OverlayContainer for readability.
 */
function useCollapseState(
  canCollapse: boolean,
  allItems: OverlayItem[],
  itemRefs: ReturnType<typeof useRef<Map<string, HTMLDivElement>>>,
  onPauseChange: (paused: boolean) => void,
): CollapseStateResult {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<DOMRect | null>(null);

  const updateBounds = useCallback(() => {
    const refs = itemRefs.current;

    if (!refs || refs.size === 0) {
      boundsRef.current = null;
      return;
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    refs.forEach((el) => {
      const rect = el.getBoundingClientRect();
      minX = Math.min(minX, rect.left);
      minY = Math.min(minY, rect.top);
      maxX = Math.max(maxX, rect.right);
      maxY = Math.max(maxY, rect.bottom);
    });

    if (typeof DOMRect !== 'undefined') {
      boundsRef.current = new DOMRect(minX, minY, maxX - minX, maxY - minY);
    } else {
      boundsRef.current = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        top: minY,
        right: maxX,
        bottom: maxY,
        left: minX,
        toJSON: () => ({}),
      } as DOMRect;
    }
  }, [itemRefs]);

  // Track mouse for collapse — expand when mouse leaves bounds
  useEffect(() => {
    if (!isCollapsed) return;

    const handleMouseMove = (e: MouseEvent) => {
      const bounds = boundsRef.current;

      if (!bounds) {
        setIsCollapsed(false);
        onPauseChange(false);
        return;
      }

      const padding = 20;
      const isInBounds =
        e.clientX >= bounds.left - padding &&
        e.clientX <= bounds.right + padding &&
        e.clientY >= bounds.top - padding &&
        e.clientY <= bounds.bottom + padding;

      if (!isInBounds) {
        setIsCollapsed(false);
        onPauseChange(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isCollapsed, onPauseChange]);

  // Update bounds when items change
  useEffect(() => {
    updateBounds();
  }, [allItems, updateBounds]);

  const handleMouseEnter = useCallback(() => {
    updateBounds();
    onPauseChange(true);

    if (canCollapse) {
      setIsCollapsed(true);
    }
  }, [updateBounds, canCollapse, onPauseChange]);

  const handleMouseLeave = useCallback(() => {
    if (!isCollapsed) {
      onPauseChange(false);
    }
  }, [isCollapsed, onPauseChange]);

  const handleFocus = useCallback(() => {
    onPauseChange(true);
  }, [onPauseChange]);

  const handleBlur = useCallback(
    (e: FocusEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.relatedTarget as Node)
      ) {
        onPauseChange(false);
      }
    },
    [onPauseChange],
  );

  return {
    isCollapsed,
    handleMouseEnter,
    handleMouseLeave,
    handleFocus,
    handleBlur,
    containerRef,
  };
}

// ─── Overlay Container ───────────────────────────────────────────────
//
// INTENTIONAL: Position calculations are done manually (absolute positioning + JS
// height tracking) rather than relying on CSS flexbox/grid layout. This is
// deliberate — the container mixes enter/exit animations, collapse behavior, and
// heterogeneous item sizes (toasts vs notifications) which require per-item
// position control. CSS-only solutions (e.g., flex column with gap) break when
// items exit asynchronously or when collapse transforms need to be computed per-item.

export interface OverlayContainerProps {
  toasts: InternalToast[];
  notifications: InternalNotification[];
  onToastExitComplete: (internalId: string) => void;
  onNotificationExitComplete: (internalId: string) => void;
  onNotificationDismiss: (id: Key, reason: DismissReason) => void;
  onNotificationRestore: (id: Key) => void;
  onPauseChange: (paused: boolean) => void;
}

export function OverlayContainer({
  toasts,
  notifications,
  onToastExitComplete,
  onNotificationExitComplete,
  onNotificationDismiss,
  onNotificationRestore,
  onPauseChange,
}: OverlayContainerProps) {
  // Merge toasts and notifications into a single ordered list
  const allItems: OverlayItem[] = useMemo(() => {
    const items: OverlayItem[] = [
      ...toasts.map((t): OverlayItem => ({ kind: 'toast', data: t })),
      ...notifications.map(
        (n): OverlayItem => ({ kind: 'notification', data: n }),
      ),
    ];

    // Sort by createdAt ascending (oldest first = bottom of stack, newest last = top)
    items.sort((a, b) => getItemCreatedAt(a) - getItemCreatedAt(b));

    return items;
  }, [toasts, notifications]);

  const visibleItems = useMemo(
    () => allItems.filter((item) => !isItemExiting(item)),
    [allItems],
  );
  const hasNotifications = notifications.some((n) => !n.isExiting);
  const hasActionableToasts = toasts.some((t) => !t.isExiting && t.actions);
  const canCollapse = !hasNotifications && !hasActionableToasts;

  const {
    heights,
    settledIds,
    positions,
    lastPositionsRef,
    itemRefs,
    createRefCallback,
  } = useItemPositions(visibleItems);

  const {
    isCollapsed,
    handleMouseEnter,
    handleMouseLeave,
    handleFocus,
    handleBlur,
    containerRef,
  } = useCollapseState(canCollapse, allItems, itemRefs, onPauseChange);

  // ─── Callbacks ─────────────────────────────────────────────────────

  // When the user dismisses a notification they were hovering, the element
  // is removed from the DOM so mouseLeave never fires. Explicitly unpause
  // so remaining notifications' timers resume.
  const handleNotificationDismiss = useEvent(
    (id: Key, reason: DismissReason) => {
      onNotificationDismiss(id, reason);
      onPauseChange(false);
    },
  );

  const handleExitComplete = useEvent((item: OverlayItem) => {
    const id = getItemId(item);
    lastPositionsRef.current?.delete(id);

    if (item.kind === 'toast') {
      onToastExitComplete(item.data.internalId);
    } else {
      onNotificationExitComplete(item.data.internalId);
    }
  });

  // useCallback (not useEvent) because this is called during render.
  // useEvent defers the ref update to useLayoutEffect, so during render
  // it would still read the previous closure's positions/heights.
  const getItemStyle = useCallback(
    (item: OverlayItem, index: number, total: number) => {
      const id = getItemId(item);
      const baseTop =
        positions.get(id) ?? lastPositionsRef.current?.get(id) ?? 0;
      const height = heights[id] ?? DEFAULT_ITEM_HEIGHT;

      if (!isCollapsed || !canCollapse) {
        return { top: `${baseTop}px` };
      }

      const isNewest = index === total - 1;
      const collapsedTop = COLLAPSE_VISIBLE_HEIGHT - CONTAINER_OFFSET - height;

      return {
        top: `${collapsedTop}px`,
        zIndex: index,
        opacity: isNewest ? 1 : 0,
        pointerEvents: 'none' as const,
      };
    },
    [isCollapsed, canCollapse, positions, heights, lastPositionsRef],
  );

  // Build a visibleIndex lookup map to avoid O(n²) findIndex inside render loop
  const visibleIndexMap = useMemo(() => {
    const map = new Map<string, number>();

    visibleItems.forEach((item, index) => {
      map.set(getItemId(item), index);
    });

    return map;
  }, [visibleItems]);

  if (allItems.length === 0) return null;

  return (
    <Portal>
      <OverlayContainerElement
        ref={containerRef}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {allItems.map((item) => {
          const itemId = getItemId(item);
          const visibleIndex = visibleIndexMap.get(itemId) ?? 0;
          const isExiting = isItemExiting(item);

          return (
            <DisplayTransition
              key={itemId}
              animateOnMount
              isShown={!isExiting}
              onRest={(transition) => {
                if (transition === 'exit') {
                  handleExitComplete(item);
                }
              }}
            >
              {({ isShown, ref }) => (
                <OverlayItemWrapper
                  ref={createRefCallback(itemId, ref)}
                  mods={{ isShown, isMeasured: settledIds.has(itemId) }}
                  style={getItemStyle(item, visibleIndex, visibleItems.length)}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {item.kind === 'toast' ? (
                    <ToastItem
                      {...item.data.itemProps}
                      title={item.data.title}
                      description={item.data.description}
                      theme={item.data.theme}
                      icon={item.data.icon}
                      isLoading={item.data.isLoading}
                      actions={item.data.actions}
                    />
                  ) : (
                    <NotificationItem
                      notification={item.data}
                      onDismiss={handleNotificationDismiss}
                      onRestore={onNotificationRestore}
                    />
                  )}
                </OverlayItemWrapper>
              )}
            </DisplayTransition>
          );
        })}
      </OverlayContainerElement>
    </Portal>
  );
}
