import { Key, useEffect, useRef } from 'react';

import { useEvent } from '../../../_internal';

import type { InternalToast } from '../Toast/types';
import type { DismissReason, InternalNotification } from './types';

// ─── Types ───────────────────────────────────────────────────────────

export interface OverlayTimers {
  /** Start a toast auto-dismiss timer */
  startToastTimer: (internalId: string, id: Key, duration: number) => void;
  /** Clear a toast timer */
  clearToastTimer: (internalId: string) => void;
  /** Start a notification auto-dismiss timer */
  startNotificationTimer: (
    internalId: string,
    id: Key,
    duration: number,
  ) => void;
  /** Clear a notification timer */
  clearNotificationTimer: (internalId: string) => void;
  /** Handle pause/resume of all timers (e.g. on hover/focus) */
  handlePauseChange: (paused: boolean) => void;
}

export interface OverlayTimersDeps {
  /** Ref to current toasts (for resume lookup) */
  toastsRef: ReturnType<typeof useRef<InternalToast[]>>;
  /** Ref to current notifications (for resume lookup) */
  notificationsRef: ReturnType<typeof useRef<InternalNotification[]>>;
  /** Remove a toast by id */
  removeToast: (id: Key) => void;
  /** Remove a notification by id with reason (also invokes onDismiss callback) */
  removeNotification: (id: Key, reason: DismissReason) => void;
}

// ─── Timer Manager Factory ───────────────────────────────────────────

interface TimerManager {
  start: (internalId: string, id: Key, duration: number) => void;
  clear: (internalId: string) => void;
  pauseAll: () => void;
  resumeAll: () => void;
  clearAll: () => void;
}

/**
 * Creates a start/clear/pause/resume pair for a single timer category.
 * Eliminates duplication between toast and notification timer logic.
 */
function createTimerManager(
  timersMap: Map<string, ReturnType<typeof setTimeout>>,
  pausedMap: Map<string, { remaining: number; startedAt: number }>,
  isPausedRef: ReturnType<typeof useRef<boolean>>,
  onTimeout: (id: Key) => void,
  findItem: (
    internalId: string,
  ) => { id?: Key; internalId: string; isExiting?: boolean } | undefined,
): TimerManager {
  const clear = (internalId: string) => {
    const timer = timersMap.get(internalId);

    if (timer) {
      clearTimeout(timer);
      timersMap.delete(internalId);
    }

    pausedMap.delete(internalId);
  };

  const start = (internalId: string, id: Key, duration: number) => {
    clear(internalId);

    pausedMap.set(internalId, {
      remaining: duration,
      startedAt: Date.now(),
    });

    if (isPausedRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      onTimeout(id);
    }, duration);

    timersMap.set(internalId, timer);
  };

  const pauseAll = () => {
    timersMap.forEach((timer, internalId) => {
      clearTimeout(timer);
      timersMap.delete(internalId);

      const info = pausedMap.get(internalId);

      if (info) {
        const elapsed = Date.now() - info.startedAt;
        pausedMap.set(internalId, {
          remaining: Math.max(0, info.remaining - elapsed),
          startedAt: Date.now(),
        });
      }
    });
  };

  const resumeAll = () => {
    pausedMap.forEach((info, internalId) => {
      if (info.remaining <= 0) {
        pausedMap.delete(internalId);
        return;
      }

      const item = findItem(internalId);

      if (item && !item.isExiting) {
        const timer = setTimeout(() => {
          onTimeout(item.id ?? item.internalId);
        }, info.remaining);

        timersMap.set(internalId, timer);
        pausedMap.set(internalId, {
          remaining: info.remaining,
          startedAt: Date.now(),
        });
      }
    });
  };

  const clearAll = () => {
    timersMap.forEach((timer) => clearTimeout(timer));
    timersMap.clear();
  };

  return { start, clear, pauseAll, resumeAll, clearAll };
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useOverlayTimers(deps: OverlayTimersDeps): OverlayTimers {
  const { toastsRef, notificationsRef, removeToast, removeNotification } = deps;

  const toastTimersMap = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  ).current;
  const notificationTimersMap = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  ).current;
  const isPausedRef = useRef(false);

  // Shared paused-timers map. Toast and notification internalIds use distinct prefixes
  // ('toast-' and 'notif-') so they coexist safely in a single map.
  const pausedMap = useRef(
    new Map<string, { remaining: number; startedAt: number }>(),
  ).current;

  const toastManager = useRef<TimerManager | null>(null);
  const notifManager = useRef<TimerManager | null>(null);

  // Lazily create managers — deps are stable (useEvent / refs), so this runs once.
  if (!toastManager.current) {
    toastManager.current = createTimerManager(
      toastTimersMap,
      pausedMap,
      isPausedRef,
      (id) => removeToast(id),
      (internalId) =>
        toastsRef.current.find((t) => t.internalId === internalId),
    );
  }

  if (!notifManager.current) {
    notifManager.current = createTimerManager(
      notificationTimersMap,
      pausedMap,
      isPausedRef,
      (id) => removeNotification(id, 'timeout'),
      (internalId) =>
        notificationsRef.current.find((n) => n.internalId === internalId),
    );
  }

  // ─── Stable callbacks ──────────────────────────────────────────────

  const startToastTimer = useEvent(
    (internalId: string, id: Key, duration: number) => {
      toastManager.current!.start(internalId, id, duration);
    },
  );

  const clearToastTimer = useEvent((internalId: string) => {
    toastManager.current!.clear(internalId);
  });

  const startNotificationTimer = useEvent(
    (internalId: string, id: Key, duration: number) => {
      notifManager.current!.start(internalId, id, duration);
    },
  );

  const clearNotificationTimer = useEvent((internalId: string) => {
    notifManager.current!.clear(internalId);
  });

  // ─── Pause / Resume ─────────────────────────────────────────────

  const handlePauseChange = useEvent((paused: boolean) => {
    if (paused === isPausedRef.current) return;

    isPausedRef.current = paused;

    if (paused) {
      toastManager.current!.pauseAll();
      notifManager.current!.pauseAll();
    } else {
      toastManager.current!.resumeAll();
      notifManager.current!.resumeAll();
    }
  });

  // ─── Cleanup on unmount ─────────────────────────────────────────

  useEffect(() => {
    return () => {
      toastManager.current!.clearAll();
      notifManager.current!.clearAll();
      pausedMap.clear();
    };
  }, []);

  return {
    startToastTimer,
    clearToastTimer,
    startNotificationTimer,
    clearNotificationTimer,
    handlePauseChange,
  };
}
