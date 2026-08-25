import { useCallback, useEffect, useRef, useState } from 'react';

import { useEvent } from '../../../_internal/hooks';

import { cloneLayout, LayoutItem } from './grid-core';

/**
 * Why the layout changed.
 *
 * A board commits for two different kinds of reason, and an app usually cares
 * which: a gesture is the user arranging their board, while a normalization is
 * the board fitting an existing arrangement to a constraint that moved
 * underneath it. Without this, an app that persists `onLayoutChange` has no way
 * to tell "the user dragged a widget" from "the column count changed and the
 * board reflowed", so it writes the reflow back as if it were an edit — marking
 * a document dirty nobody touched.
 *
 * - `drag` / `resize` — a pointer or keyboard gesture on this board.
 * - `transfer` — a widget arrived from, or left for, another board.
 * - `normalize` — no gesture: a reflow for a changed column count, or an
 *   auto-height widget growing to fit its content.
 */
export type BoardLayoutChangeReason =
  | 'drag'
  | 'resize'
  | 'transfer'
  | 'normalize';

/** What `onLayoutChange` reports alongside the new layout. */
export interface BoardLayoutChangeInfo {
  reason: BoardLayoutChangeReason;
}

export interface UseBoardLayoutOptions {
  /** Controlled layout. */
  layout?: LayoutItem[];
  /** Initial layout for uncontrolled usage. */
  defaultLayout?: LayoutItem[];
  onLayoutChange?: (layout: LayoutItem[], info: BoardLayoutChangeInfo) => void;
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
  /**
   * Update the layout. `commit` fires `onLayoutChange` with `reason`, which is
   * required on a commit so a new commit path cannot forget to say why it
   * fired.
   */
  applyLayout: (
    layout: LayoutItem[],
    commit: boolean,
    reason?: BoardLayoutChangeReason,
  ) => void;
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

  const onLayoutChangeEvent = useEvent(
    (next: LayoutItem[], reason: BoardLayoutChangeReason) =>
      onLayoutChange?.(next, { reason }),
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
    (
      next: LayoutItem[],
      commit: boolean,
      reason: BoardLayoutChangeReason = 'normalize',
    ) => {
      layoutRef.current = next;
      setLayout(next);
      if (commit) {
        onLayoutChangeEvent(next, reason);
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
