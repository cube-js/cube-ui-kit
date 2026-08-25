import { useResizeObserver } from '@react-aria/utils';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';

import { useEvent } from '../../../_internal/hooks';
import { useCombinedRefs } from '../../../utils/react';

import { Board } from './Board';
import { Compactor, CompactType, getCompactor, LayoutItem } from './grid-core';
import {
  BreakpointCols,
  Breakpoints,
  findOrGenerateResponsiveLayout,
  getBreakpointFromWidth,
  getColsFromBreakpoint,
  ResponsiveLayouts,
} from './responsive-utils';

import type { BoardCompactType, CubeBoardProps } from './Board';
import type { BoardLayoutChangeInfo } from './use-board-layout';

export interface CubeBoardResponsiveProps
  extends Omit<
    CubeBoardProps,
    | 'layout'
    | 'defaultLayout'
    | 'cols'
    | 'onLayoutChange'
    | 'width'
    | 'breakpoints'
  > {
  /** Map of breakpoint name -> minimum container width in pixels. */
  breakpoints: Breakpoints;
  /** Map of breakpoint name -> column count. */
  cols: BreakpointCols;
  /** Controlled per-breakpoint layouts. */
  layouts?: ResponsiveLayouts;
  /** Initial per-breakpoint layouts for uncontrolled usage. */
  defaultLayouts?: ResponsiveLayouts;
  /**
   * Called when the layout is committed. Receives the active breakpoint's
   * layout, the full map of all breakpoint layouts, and why it changed — see
   * {@link BoardLayoutChangeInfo}, which is what separates a user's gesture
   * from the board reflowing itself.
   */
  onLayoutChange?: (
    currentLayout: LayoutItem[],
    allLayouts: ResponsiveLayouts,
    info: BoardLayoutChangeInfo,
  ) => void;
  /** Called when the active breakpoint changes. */
  onBreakpointChange?: (breakpoint: string, cols: number) => void;
  /**
   * Called when the measured container width changes, with the current column
   * count for the active breakpoint. Mirrors react-grid-layout's
   * `WidthProvider` `onWidthChange`. Not fired while width is unmeasured (0) or
   * when an explicit `width` is provided.
   */
  onWidthChange?: (width: number, cols: number) => void;
  /**
   * Force a specific breakpoint regardless of the measured width (e.g. for a
   * fixed-size screenshot or PDF export).
   */
  breakpoint?: string;
  /**
   * Explicit container width in pixels. When provided, disables automatic width
   * measurement (useful for SSR, tests, and forced-size exports).
   */
  width?: number;
}

function compactTypeToCore(compact: BoardCompactType): CompactType {
  if (compact === 'free') return null;
  return compact;
}

function BoardResponsiveInner(
  props: CubeBoardResponsiveProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    breakpoints,
    cols,
    layouts: controlledLayouts,
    defaultLayouts,
    onLayoutChange,
    onBreakpointChange,
    onWidthChange,
    breakpoint: forcedBreakpoint,
    width: providedWidth,
    compact = 'vertical',
    allowOverlap = false,
    preventCollision = false,
    ...boardProps
  } = props;

  const boardRef = useRef<HTMLDivElement | null>(null);
  const combinedRef = useCombinedRefs(ref, boardRef);
  const [measuredWidth, setMeasuredWidth] = useState(0);

  const onResizeElement = useEvent(() => {
    const next = boardRef.current?.offsetWidth ?? 0;
    if (next > 0) setMeasuredWidth((prev) => (prev === next ? prev : next));
  });
  useResizeObserver({ ref: boardRef, onResize: onResizeElement });

  const isControlled = controlledLayouts !== undefined;
  const [internalLayouts, setInternalLayouts] = useState<ResponsiveLayouts>(
    () => controlledLayouts ?? defaultLayouts ?? {},
  );
  const currentLayouts = isControlled ? controlledLayouts! : internalLayouts;
  const layoutsRef = useRef(currentLayouts);
  layoutsRef.current = currentLayouts;

  const widthForBreakpoint = providedWidth ?? measuredWidth;
  const activeBreakpoint =
    forcedBreakpoint ?? getBreakpointFromWidth(breakpoints, widthForBreakpoint);
  const activeCols = getColsFromBreakpoint(activeBreakpoint, cols);

  // Previous breakpoint, used as the preferred source when synthesizing a layout
  // for a breakpoint that has none yet.
  const lastBreakpointRef = useRef(activeBreakpoint);

  // This compactor is only used to synthesize a layout for a breakpoint that has
  // none yet (compaction/bounds correction), so `preventCollision` has no effect
  // here - the drag-time behavior comes from the child `Board`'s own compactor
  // (see the free-mode note in `Board.tsx`).
  const compactor = useMemo<Compactor>(
    () =>
      getCompactor(compactTypeToCore(compact), allowOverlap, preventCollision),
    [compact, allowOverlap, preventCollision],
  );

  // Keep a stable reference for an existing breakpoint's layout so the child
  // `Board` (which syncs controlled layout by reference) is not reset every
  // render or mid-drag. Only a genuinely missing breakpoint is synthesized.
  const currentLayout = useMemo(() => {
    const existing = currentLayouts[activeBreakpoint];
    if (existing) return existing;
    return findOrGenerateResponsiveLayout(
      currentLayouts,
      breakpoints,
      activeBreakpoint,
      lastBreakpointRef.current,
      activeCols,
      compactor,
    );
  }, [currentLayouts, breakpoints, activeBreakpoint, activeCols, compactor]);

  // Remember the last breakpoint (for synthesizing a missing one) and emit
  // breakpoint changes after commit, skipping the initial mount.
  const onBreakpointChangeEvent = useEvent(() =>
    onBreakpointChange?.(activeBreakpoint, activeCols),
  );
  const bpInitializedRef = useRef(false);
  useEffect(() => {
    if (!bpInitializedRef.current) {
      bpInitializedRef.current = true;
      lastBreakpointRef.current = activeBreakpoint;
      return;
    }
    onBreakpointChangeEvent();
    lastBreakpointRef.current = activeBreakpoint;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBreakpoint]);

  // Report width changes (measured widths only; an explicit `width` disables
  // measurement, and an unmeasured board reports 0 which we skip).
  const onWidthChangeEvent = useEvent(() =>
    onWidthChange?.(widthForBreakpoint, activeCols),
  );
  useEffect(() => {
    if (providedWidth != null) return;
    if (measuredWidth <= 0) return;
    onWidthChangeEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measuredWidth, activeCols]);

  const handleLayoutChange = useEvent(
    (next: LayoutItem[], info: BoardLayoutChangeInfo) => {
      const merged = { ...layoutsRef.current, [activeBreakpoint]: next };
      layoutsRef.current = merged;
      if (!isControlled) setInternalLayouts(merged);
      onLayoutChange?.(next, merged, info);
    },
  );

  return (
    <Board
      ref={combinedRef}
      layout={currentLayout}
      cols={activeCols}
      width={providedWidth}
      compact={compact}
      allowOverlap={allowOverlap}
      preventCollision={preventCollision}
      onLayoutChange={handleLayoutChange}
      {...boardProps}
    />
  );
}

/**
 * A responsive wrapper around `Board` that selects a layout and column count
 * based on the container's width (or a forced breakpoint). Mirrors the model of
 * react-grid-layout's `Responsive` + `WidthProvider`: per-breakpoint `layouts`
 * and `cols`, with `onLayoutChange` reporting both the active layout and the
 * full map.
 */
export const BoardResponsive = forwardRef(BoardResponsiveInner);
