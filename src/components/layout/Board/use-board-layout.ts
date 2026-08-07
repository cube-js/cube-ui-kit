import { useCallback, useEffect, useRef, useState } from 'react';

import { useEvent } from '../../../_internal/hooks';

import { cloneLayout, LayoutItem } from './grid-core';

export interface UseBoardLayoutOptions {
  /** Controlled layout. */
  layout?: LayoutItem[];
  /** Initial layout for uncontrolled usage. */
  defaultLayout?: LayoutItem[];
  onLayoutChange?: (layout: LayoutItem[]) => void;
}

export interface UseBoardLayoutResult {
  layout: LayoutItem[];
  layoutRef: React.MutableRefObject<LayoutItem[]>;
  /**
   * Every drop-slot preview for the gesture in flight. A single-widget drag or
   * resize produces one; a group drag produces one per moving widget.
   */
  placeholders: LayoutItem[];
  /**
   * The grabbed widget's placeholder — `placeholders[0]`, or `null` when there
   * is none. Kept as a derived singular so the public `BoardInteractionInfo`
   * keeps its exact shape.
   */
  placeholder: LayoutItem | null;
  /**
   * Synchronously-updated mirrors of the two above. `setPlaceholders` only
   * schedules a re-render, so consumers that run in the same tick as a
   * `setPlaceholders` call (e.g. drag lifecycle callbacks fired right after the
   * registry updates the placeholders) must read a ref to see the live value.
   */
  placeholdersRef: React.MutableRefObject<LayoutItem[]>;
  placeholderRef: React.MutableRefObject<LayoutItem | null>;
  setPlaceholders: (items: LayoutItem[]) => void;
  /** Update the layout. `commit` fires `onLayoutChange`. */
  applyLayout: (layout: LayoutItem[], commit: boolean) => void;
}

/**
 * Headless layout state for a single board.
 *
 * Supports both controlled (`layout`) and uncontrolled (`defaultLayout`) usage.
 * Intermediate drag/resize previews always update local state; only committed
 * changes call `onLayoutChange`.
 */
export function useBoardLayout(
  options: UseBoardLayoutOptions,
): UseBoardLayoutResult {
  const { layout: controlledLayout, defaultLayout, onLayoutChange } = options;
  const isControlled = controlledLayout !== undefined;

  const [layout, setLayout] = useState<LayoutItem[]>(() =>
    cloneLayout(controlledLayout ?? defaultLayout ?? []),
  );
  const layoutRef = useRef<LayoutItem[]>(layout);
  layoutRef.current = layout;

  const [placeholders, setPlaceholdersState] = useState<LayoutItem[]>([]);
  const placeholdersRef = useRef<LayoutItem[]>([]);
  const placeholderRef = useRef<LayoutItem | null>(null);
  const setPlaceholders = useCallback((items: LayoutItem[]) => {
    placeholdersRef.current = items;
    // Both mirrors move in the same synchronous call, so a same-tick reader can
    // never see the two disagree.
    placeholderRef.current = items[0] ?? null;
    setPlaceholdersState(items);
  }, []);

  const onLayoutChangeEvent = useEvent((next: LayoutItem[]) =>
    onLayoutChange?.(next),
  );

  // Sync controlled prop into local state when it changes by reference.
  const prevControlledRef = useRef(controlledLayout);
  useEffect(() => {
    if (isControlled && controlledLayout !== prevControlledRef.current) {
      prevControlledRef.current = controlledLayout;
      const next = cloneLayout(controlledLayout ?? []);
      layoutRef.current = next;
      setLayout(next);
    }
  }, [controlledLayout, isControlled]);

  const applyLayout = useCallback(
    (next: LayoutItem[], commit: boolean) => {
      layoutRef.current = next;
      setLayout(next);
      if (commit) {
        onLayoutChangeEvent(next);
      }
    },
    [onLayoutChangeEvent],
  );

  return {
    layout,
    layoutRef,
    placeholders,
    placeholder: placeholders[0] ?? null,
    placeholdersRef,
    placeholderRef,
    setPlaceholders,
    applyLayout,
  };
}
