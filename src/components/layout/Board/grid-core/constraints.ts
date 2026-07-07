/**
 * Pluggable layout constraints.
 *
 * Vendored from react-grid-layout v2 (`src/core/constraints.ts`).
 * See ./NOTICE.md for attribution and license.
 *
 * Constraints control position and size limits during drag/resize operations.
 */

import type {
  ConstraintContext,
  LayoutConstraint,
  LayoutItem,
  ResizeHandleAxis,
} from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// Built-in Constraints
// ============================================================================

/**
 * Grid boundary constraint. Ensures items stay within the grid bounds. This is
 * the default position constraint.
 */
export const gridBounds: LayoutConstraint = {
  name: 'gridBounds',

  constrainPosition(
    item: LayoutItem,
    x: number,
    y: number,
    { cols, maxRows }: ConstraintContext,
  ): { x: number; y: number } {
    return {
      x: clamp(x, 0, Math.max(0, cols - item.w)),
      y: clamp(y, 0, Math.max(0, maxRows - item.h)),
    };
  },

  constrainSize(
    item: LayoutItem,
    w: number,
    h: number,
    handle: ResizeHandleAxis,
    { cols, maxRows }: ConstraintContext,
  ): { w: number; h: number } {
    const maxW =
      handle === 'w' || handle === 'nw' || handle === 'sw'
        ? item.x + item.w
        : cols - item.x;

    const maxH =
      handle === 'n' || handle === 'nw' || handle === 'ne'
        ? item.y + item.h
        : maxRows - item.y;

    return {
      w: clamp(w, 1, Math.max(1, maxW)),
      h: clamp(h, 1, Math.max(1, maxH)),
    };
  },
};

/**
 * Min/max size constraint. Enforces per-item minW/maxW/minH/maxH.
 */
export const minMaxSize: LayoutConstraint = {
  name: 'minMaxSize',

  constrainSize(
    item: LayoutItem,
    w: number,
    h: number,
  ): { w: number; h: number } {
    return {
      w: clamp(w, item.minW ?? 1, item.maxW ?? Infinity),
      h: clamp(h, item.minH ?? 1, item.maxH ?? Infinity),
    };
  },
};

/**
 * Container bounds constraint. Constrains items to stay within the visible
 * container (a replacement for the legacy `isBounded` prop).
 */
export const containerBounds: LayoutConstraint = {
  name: 'containerBounds',

  constrainPosition(
    item: LayoutItem,
    x: number,
    y: number,
    { cols, maxRows, containerHeight, rowHeight, margin }: ConstraintContext,
  ): { x: number; y: number } {
    const visibleRows =
      containerHeight > 0
        ? Math.floor((containerHeight + margin[1]) / (rowHeight + margin[1]))
        : maxRows;

    return {
      x: clamp(x, 0, Math.max(0, cols - item.w)),
      y: clamp(y, 0, Math.max(0, visibleRows - item.h)),
    };
  },
};

/** Bounded X constraint. Only constrains horizontal position. */
export const boundedX: LayoutConstraint = {
  name: 'boundedX',

  constrainPosition(
    item: LayoutItem,
    x: number,
    y: number,
    { cols }: ConstraintContext,
  ): { x: number; y: number } {
    return {
      x: clamp(x, 0, Math.max(0, cols - item.w)),
      y,
    };
  },
};

/** Bounded Y constraint. Only constrains vertical position. */
export const boundedY: LayoutConstraint = {
  name: 'boundedY',

  constrainPosition(
    item: LayoutItem,
    x: number,
    y: number,
    { maxRows }: ConstraintContext,
  ): { x: number; y: number } {
    return {
      x,
      y: clamp(y, 0, Math.max(0, maxRows - item.h)),
    };
  },
};

// ============================================================================
// Constraint Factories
// ============================================================================

/**
 * Create an aspect ratio constraint (maintains width-to-height ratio in pixels).
 */
export function aspectRatio(ratio: number): LayoutConstraint {
  return {
    name: `aspectRatio(${ratio})`,

    constrainSize(
      _item: LayoutItem,
      w: number,
      _h: number,
      _handle: ResizeHandleAxis,
      context: ConstraintContext,
    ): { w: number; h: number } {
      const { cols, containerWidth, rowHeight, margin } = context;
      const colWidth = (containerWidth - margin[0] * (cols - 1)) / cols;
      const pixelWidth = colWidth * w + margin[0] * Math.max(0, w - 1);
      const pixelHeight = pixelWidth / ratio;
      const h = Math.max(
        1,
        Math.round((pixelHeight + margin[1]) / (rowHeight + margin[1])),
      );

      return { w, h };
    },
  };
}

/** Create a snap-to-grid constraint. */
export function snapToGrid(
  stepX: number,
  stepY: number = stepX,
): LayoutConstraint {
  if (stepX <= 0 || stepY <= 0) {
    throw new Error(
      `snapToGrid: step values must be positive (got stepX=${stepX}, stepY=${stepY})`,
    );
  }

  return {
    name: `snapToGrid(${stepX}, ${stepY})`,

    constrainPosition(
      _item: LayoutItem,
      x: number,
      y: number,
    ): { x: number; y: number } {
      return {
        x: Math.round(x / stepX) * stepX,
        y: Math.round(y / stepY) * stepY,
      };
    },
  };
}

/** Create a minimum size constraint (grid-wide). */
export function minSize(minW: number, minH: number): LayoutConstraint {
  return {
    name: `minSize(${minW}, ${minH})`,

    constrainSize(
      _item: LayoutItem,
      w: number,
      h: number,
    ): { w: number; h: number } {
      return {
        w: Math.max(minW, w),
        h: Math.max(minH, h),
      };
    },
  };
}

/** Create a maximum size constraint (grid-wide). */
export function maxSize(maxW: number, maxH: number): LayoutConstraint {
  return {
    name: `maxSize(${maxW}, ${maxH})`,

    constrainSize(
      _item: LayoutItem,
      w: number,
      h: number,
    ): { w: number; h: number } {
      return {
        w: Math.min(maxW, w),
        h: Math.min(maxH, h),
      };
    },
  };
}

// ============================================================================
// Default Constraints
// ============================================================================

/** Default constraints applied when none are specified. */
export const defaultConstraints: LayoutConstraint[] = [gridBounds, minMaxSize];

// ============================================================================
// Constraint Application Functions
// ============================================================================

/** Apply position constraints to a proposed position. */
export function applyPositionConstraints(
  constraints: LayoutConstraint[],
  item: LayoutItem,
  x: number,
  y: number,
  context: ConstraintContext,
): { x: number; y: number } {
  let result = { x, y };

  for (const constraint of constraints) {
    if (constraint.constrainPosition) {
      result = constraint.constrainPosition(item, result.x, result.y, context);
    }
  }

  if (item.constraints) {
    for (const constraint of item.constraints) {
      if (constraint.constrainPosition) {
        result = constraint.constrainPosition(
          item,
          result.x,
          result.y,
          context,
        );
      }
    }
  }

  return result;
}

/** Apply size constraints to a proposed size. */
export function applySizeConstraints(
  constraints: LayoutConstraint[],
  item: LayoutItem,
  w: number,
  h: number,
  handle: ResizeHandleAxis,
  context: ConstraintContext,
): { w: number; h: number } {
  let result = { w, h };

  for (const constraint of constraints) {
    if (constraint.constrainSize) {
      result = constraint.constrainSize(
        item,
        result.w,
        result.h,
        handle,
        context,
      );
    }
  }

  if (item.constraints) {
    for (const constraint of item.constraints) {
      if (constraint.constrainSize) {
        result = constraint.constrainSize(
          item,
          result.w,
          result.h,
          handle,
          context,
        );
      }
    }
  }

  return result;
}
