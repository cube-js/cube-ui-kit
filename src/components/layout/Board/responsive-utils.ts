/**
 * Responsive helpers for `Board.Responsive`.
 *
 * Framework-agnostic breakpoint math adapted (MIT) from react-grid-layout's
 * `responsiveUtils`, rewritten to use this package's grid-core primitives. See
 * ./grid-core/NOTICE.md for the upstream attribution and license.
 */
import { cloneLayout, Compactor, correctBounds, LayoutItem } from './grid-core';

/** Map of breakpoint name -> minimum container width (px). */
export type Breakpoints = Record<string, number>;
/** Map of breakpoint name -> column count. */
export type BreakpointCols = Record<string, number>;
/** Map of breakpoint name -> layout. */
export type ResponsiveLayouts = Record<string, LayoutItem[]>;

/** Breakpoint names sorted ascending by their minimum width. */
export function sortBreakpoints(breakpoints: Breakpoints): string[] {
  return Object.keys(breakpoints).sort(
    (a, b) => breakpoints[a] - breakpoints[b],
  );
}

/**
 * The largest breakpoint whose minimum width is below `width`. Falls back to the
 * smallest breakpoint when `width` is narrower than all of them.
 */
export function getBreakpointFromWidth(
  breakpoints: Breakpoints,
  width: number,
): string {
  const sorted = sortBreakpoints(breakpoints);
  let matching = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const name = sorted[i];
    if (width > breakpoints[name]) matching = name;
  }
  return matching;
}

/** Column count for a breakpoint. */
export function getColsFromBreakpoint(
  breakpoint: string,
  cols: BreakpointCols,
): number {
  const value = cols[breakpoint];
  if (value == null) {
    throw new Error(
      `Board.Responsive: no columns defined for breakpoint "${breakpoint}".`,
    );
  }
  return value;
}

/**
 * The layout for `breakpoint`, or one synthesized from the nearest available
 * breakpoint (preferring `lastBreakpoint`, then breakpoints at or above the
 * target) corrected into bounds and compacted for the target column count.
 */
export function findOrGenerateResponsiveLayout(
  layouts: ResponsiveLayouts,
  breakpoints: Breakpoints,
  breakpoint: string,
  lastBreakpoint: string,
  cols: number,
  compactor: Compactor,
): LayoutItem[] {
  if (layouts[breakpoint]) return cloneLayout(layouts[breakpoint]);

  let layout = layouts[lastBreakpoint];
  const sorted = sortBreakpoints(breakpoints);
  const above = sorted.slice(sorted.indexOf(breakpoint));
  for (const name of above) {
    if (layouts[name]) {
      layout = layouts[name];
      break;
    }
  }

  layout = cloneLayout(layout || []);
  return [...compactor.compact(correctBounds(layout, { cols }), cols)];
}
