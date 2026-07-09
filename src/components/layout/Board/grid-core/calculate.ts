/**
 * Grid calculation utilities.
 *
 * Vendored from react-grid-layout v2 (`src/core/calculate.ts`).
 * See ./NOTICE.md for attribution and license.
 *
 * These functions convert between grid units and pixel positions.
 */

import type { Position, ResizeHandleAxis } from './types';

/** Parameters needed for position calculations. */
export interface PositionParams {
  readonly margin: readonly [number, number];
  readonly containerPadding: readonly [number, number];
  readonly containerWidth: number;
  readonly cols: number;
  readonly rowHeight: number;
  readonly maxRows: number;
}

// ============================================================================
// Grid Column/Row Calculations
// ============================================================================

/** Calculate the width of a single grid column in pixels. */
export function calcGridColWidth(positionParams: PositionParams): number {
  const { margin, containerPadding, containerWidth, cols } = positionParams;
  return (
    (containerWidth - margin[0] * (cols - 1) - containerPadding[0] * 2) / cols
  );
}

/**
 * Calculate the pixel size for a grid unit dimension (width or height).
 */
export function calcGridItemWHPx(
  gridUnits: number,
  colOrRowSize: number,
  marginPx: number,
): number {
  // 0 * Infinity === NaN, which causes problems with resize constraints
  if (!Number.isFinite(gridUnits)) return gridUnits;
  return Math.round(
    colOrRowSize * gridUnits + Math.max(0, gridUnits - 1) * marginPx,
  );
}

// ============================================================================
// Position Calculations
// ============================================================================

/**
 * Calculate pixel position for a grid item. Returns left, top, width, height.
 */
export function calcGridItemPosition(
  positionParams: PositionParams,
  x: number,
  y: number,
  w: number,
  h: number,
  dragPosition?: { top: number; left: number } | null,
  resizePosition?: {
    top: number;
    left: number;
    height: number;
    width: number;
  } | null,
): Position {
  const { margin, containerPadding, rowHeight } = positionParams;
  const colWidth = calcGridColWidth(positionParams);

  let width: number;
  let height: number;
  let top: number;
  let left: number;

  // If resizing, use the exact width and height from resize callbacks
  if (resizePosition) {
    width = Math.round(resizePosition.width);
    height = Math.round(resizePosition.height);
  } else {
    width = calcGridItemWHPx(w, colWidth, margin[0]);
    height = calcGridItemWHPx(h, rowHeight, margin[1]);
  }

  // If dragging, use the exact left/top from drag callbacks
  if (dragPosition) {
    top = Math.round(dragPosition.top);
    left = Math.round(dragPosition.left);
  } else if (resizePosition) {
    top = Math.round(resizePosition.top);
    left = Math.round(resizePosition.left);
  } else {
    top = Math.round((rowHeight + margin[1]) * y + containerPadding[1]);
    left = Math.round((colWidth + margin[0]) * x + containerPadding[0]);
  }

  // When not dragging or resizing, fix margin inconsistencies caused by
  // rounding by comparing where the next sibling would start.
  if (!dragPosition && !resizePosition) {
    if (Number.isFinite(w)) {
      const siblingLeft = Math.round(
        (colWidth + margin[0]) * (x + w) + containerPadding[0],
      );
      const actualMarginRight = siblingLeft - left - width;
      if (actualMarginRight !== margin[0]) {
        width += actualMarginRight - margin[0];
      }
    }

    if (Number.isFinite(h)) {
      const siblingTop = Math.round(
        (rowHeight + margin[1]) * (y + h) + containerPadding[1],
      );
      const actualMarginBottom = siblingTop - top - height;
      if (actualMarginBottom !== margin[1]) {
        height += actualMarginBottom - margin[1];
      }
    }
  }

  return { top, left, width, height };
}

/** Translate pixel coordinates to grid units (clamped). */
export function calcXY(
  positionParams: PositionParams,
  top: number,
  left: number,
  w: number,
  h: number,
): { x: number; y: number } {
  const { margin, containerPadding, cols, rowHeight, maxRows } = positionParams;
  const colWidth = calcGridColWidth(positionParams);

  let x = Math.round((left - containerPadding[0]) / (colWidth + margin[0]));
  let y = Math.round((top - containerPadding[1]) / (rowHeight + margin[1]));

  x = clamp(x, 0, cols - w);
  y = clamp(y, 0, maxRows - h);

  return { x, y };
}

/** Translate pixel coordinates to grid units without clamping. */
export function calcXYRaw(
  positionParams: PositionParams,
  top: number,
  left: number,
): { x: number; y: number } {
  const { margin, containerPadding, rowHeight } = positionParams;
  const colWidth = calcGridColWidth(positionParams);

  const x = Math.round((left - containerPadding[0]) / (colWidth + margin[0]));
  const y = Math.round((top - containerPadding[1]) / (rowHeight + margin[1]));

  return { x, y };
}

/** Calculate grid units from pixel dimensions (clamped by handle direction). */
export function calcWH(
  positionParams: PositionParams,
  width: number,
  height: number,
  x: number,
  y: number,
  handle: ResizeHandleAxis,
): { w: number; h: number } {
  const { margin, maxRows, cols, rowHeight } = positionParams;
  const colWidth = calcGridColWidth(positionParams);

  const w = Math.round((width + margin[0]) / (colWidth + margin[0]));
  const h = Math.round((height + margin[1]) / (rowHeight + margin[1]));

  let _w = clamp(w, 0, cols - x);
  let _h = clamp(h, 0, maxRows - y);

  // West handles can resize to full width
  if (handle === 'sw' || handle === 'w' || handle === 'nw') {
    _w = clamp(w, 0, cols);
  }

  // North handles can resize to full height
  if (handle === 'nw' || handle === 'n' || handle === 'ne') {
    _h = clamp(h, 0, maxRows);
  }

  return { w: _w, h: _h };
}

/** Calculate grid units from pixel dimensions without clamping (min 1). */
export function calcWHRaw(
  positionParams: PositionParams,
  width: number,
  height: number,
): { w: number; h: number } {
  const { margin, rowHeight } = positionParams;
  const colWidth = calcGridColWidth(positionParams);

  const w = Math.max(
    1,
    Math.round((width + margin[0]) / (colWidth + margin[0])),
  );
  const h = Math.max(
    1,
    Math.round((height + margin[1]) / (rowHeight + margin[1])),
  );

  return { w, h };
}

// ============================================================================
// Utility Functions
// ============================================================================

/** Clamp a number between bounds. */
export function clamp(
  num: number,
  lowerBound: number,
  upperBound: number,
): number {
  return Math.max(Math.min(num, upperBound), lowerBound);
}
