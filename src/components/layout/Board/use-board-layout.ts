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
  placeholder: LayoutItem | null;
  setPlaceholder: (item: LayoutItem | null) => void;
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

  const [placeholder, setPlaceholder] = useState<LayoutItem | null>(null);

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
    placeholder,
    setPlaceholder,
    applyLayout,
  };
}
