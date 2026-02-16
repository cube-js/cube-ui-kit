import { Key, useRef, useState } from 'react';

import { useEvent } from '../../../_internal';

import type { InternalToast, ToastData } from '../Toast/types';
import type { OverlayTimers } from './use-overlay-timers';

// ─── Constants ───────────────────────────────────────────────────────

const DEFAULT_TOAST_DURATION = 5000;
const MAX_TOASTS = 3;

// ─── Dedupe Key ──────────────────────────────────────────────────────

/**
 * Generate a deduplication key for a toast.
 * Uses JSON.stringify with alphabetically ordered keys to prevent false
 * collisions when title/description contains separator characters.
 */
function generateToastDedupeKey(data: ToastData): string {
  if (data.id != null) return String(data.id);

  return JSON.stringify({
    description: typeof data.description === 'string' ? data.description : '',
    theme: data.theme ?? 'default',
    title: typeof data.title === 'string' ? data.title : '',
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────

function matchesToastId(item: InternalToast, id: Key): boolean {
  return item.id === id || item.internalId === String(id);
}

function findToast(list: InternalToast[], id: Key): InternalToast | undefined {
  return list.find((t) => matchesToastId(t, id));
}

// ─── Types ───────────────────────────────────────────────────────────

export interface ToastState {
  toasts: InternalToast[];
  toastsRef: ReturnType<typeof useRef<InternalToast[]>>;
  addToast: (data: ToastData, isProgress?: boolean) => Key;
  removeToast: (id: Key) => void;
  updateToast: (id: Key, data: Partial<ToastData>) => void;
  finalizeToastRemoval: (internalId: string) => void;
}

// ─── Hook ────────────────────────────────────────────────────────────

/**
 * @param timersRef - Ref to the shared OverlayTimers instance. Accessed only
 *   inside callbacks (never during render), so it is guaranteed to be populated.
 */
export function useToastState(
  timersRef: ReturnType<typeof useRef<OverlayTimers>>,
): ToastState {
  const [toasts, setToasts] = useState<InternalToast[]>([]);
  const toastsRef = useRef(toasts);
  toastsRef.current = toasts;

  const idCounter = useRef(0);

  const removeToast = useEvent((id: Key) => {
    // Perform side effects outside the updater (StrictMode-safe).
    const toast = findToast(toastsRef.current, id);

    if (toast) {
      timersRef.current?.clearToastTimer(toast.internalId);
    }

    setToasts((prev) =>
      prev.map((t) => (matchesToastId(t, id) ? { ...t, isExiting: true } : t)),
    );
  });

  const finalizeToastRemoval = useEvent((internalId: string) => {
    setToasts((prev) => prev.filter((t) => t.internalId !== internalId));
  });

  const addToast = useEvent((data: ToastData, isProgress = false): Key => {
    idCounter.current += 1;
    const internalId = `toast-${idCounter.current}-${Date.now()}`;
    const dedupeKey = generateToastDedupeKey(data);
    const duration = isProgress
      ? null
      : data.duration ?? DEFAULT_TOAST_DURATION;

    const newToast: InternalToast = {
      ...data,
      internalId,
      isProgress,
      dedupeKey,
      createdAt: Date.now(),
    };

    // Perform dedupe side effects outside the updater (StrictMode-safe).
    const existingToast = toastsRef.current.find(
      (t) => t.dedupeKey === dedupeKey && !t.isExiting,
    );

    if (existingToast) {
      timersRef.current?.clearToastTimer(existingToast.internalId);
    }

    // Single setState call: mark duplicate as exiting, append new toast,
    // and evict oldest temporal toasts if we exceed MAX_TOASTS.
    // Track evicted IDs so we can clear timers outside the updater (StrictMode-safe).
    let wasEvicted = false;
    const evictedIds: string[] = [];

    setToasts((prev) => {
      let newToasts = prev;

      // Mark existing toast with same dedupe key as exiting
      if (existingToast) {
        newToasts = newToasts.map((t) =>
          t.internalId === existingToast.internalId
            ? { ...t, isExiting: true }
            : t,
        );
      }

      // Append the new toast
      newToasts = [...newToasts, newToast];

      // Evict oldest temporal toasts if over the cap
      const activeToasts = newToasts.filter((t) => !t.isExiting);
      const progressToasts = activeToasts.filter((t) => t.isProgress);
      const temporalToasts = activeToasts.filter((t) => !t.isProgress);

      while (activeToasts.length > MAX_TOASTS) {
        if (temporalToasts.length > 1 || progressToasts.length < MAX_TOASTS) {
          const oldestTemporal = temporalToasts.shift();

          if (oldestTemporal) {
            evictedIds.push(oldestTemporal.internalId);
            newToasts = newToasts.map((t) =>
              t.internalId === oldestTemporal.internalId
                ? { ...t, isExiting: true }
                : t,
            );
            const idx = activeToasts.findIndex(
              (t) => t.internalId === oldestTemporal.internalId,
            );

            if (idx !== -1) activeToasts.splice(idx, 1);

            // Check if the newly added toast was evicted
            if (oldestTemporal.internalId === internalId) {
              wasEvicted = true;
            }
          } else {
            break;
          }
        } else {
          break;
        }
      }

      return newToasts;
    });

    // Clear timers for evicted toasts outside the updater (StrictMode-safe)
    for (const evictedId of evictedIds) {
      timersRef.current?.clearToastTimer(evictedId);
    }

    // Start timer only if the toast wasn't immediately evicted
    if (!wasEvicted && duration != null && duration > 0) {
      timersRef.current?.startToastTimer(
        internalId,
        data.id ?? internalId,
        duration,
      );
    }

    return data.id ?? internalId;
  });

  const updateToast = useEvent((id: Key, data: Partial<ToastData>) => {
    setToasts((prev) =>
      prev.map((t) => (matchesToastId(t, id) ? { ...t, ...data } : t)),
    );
  });

  return {
    toasts,
    toastsRef,
    addToast,
    removeToast,
    updateToast,
    finalizeToastRemoval,
  };
}
