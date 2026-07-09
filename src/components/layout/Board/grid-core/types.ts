/**
 * Core types for the grid layout engine.
 *
 * Vendored and trimmed from react-grid-layout v2 (`src/core/types.ts`).
 * See ./NOTICE.md for attribution and license.
 *
 * These types are framework-agnostic and describe the data structures used by
 * the layout algorithms.
 */

// ============================================================================
// Resize Handle Types
// ============================================================================

/**
 * Axis identifiers for resize handles.
 * - Cardinal: 'n', 's', 'e', 'w' (north, south, east, west)
 * - Diagonal: 'ne', 'nw', 'se', 'sw'
 */
export type ResizeHandleAxis =
  | 's'
  | 'w'
  | 'e'
  | 'n'
  | 'sw'
  | 'nw'
  | 'se'
  | 'ne';

// ============================================================================
// Layout Item Types
// ============================================================================

/**
 * A single item in the grid layout.
 *
 * Position (x, y) is in grid units, not pixels. Size (w, h) is in grid units.
 */
export interface LayoutItem {
  /** Unique identifier for this item */
  i: string;
  /** X position in grid units (0-indexed from left) */
  x: number;
  /** Y position in grid units (0-indexed from top) */
  y: number;
  /** Width in grid units */
  w: number;
  /** Height in grid units */
  h: number;
  /** Minimum width in grid units */
  minW?: number;
  /** Minimum height in grid units */
  minH?: number;
  /** Maximum width in grid units */
  maxW?: number;
  /** Maximum height in grid units */
  maxH?: number;
  /**
   * If true, item cannot be dragged or resized, and other items will move
   * around it during compaction.
   */
  static?: boolean;
  /**
   * If false, item cannot be dragged (but may still be resizable).
   * Overrides grid-level isDraggable for this item.
   */
  isDraggable?: boolean;
  /**
   * If false, item cannot be resized (but may still be draggable).
   * Overrides grid-level isResizable for this item.
   */
  isResizable?: boolean;
  /**
   * Which resize handles to show for this item.
   * Overrides grid-level resizeHandles for this item.
   */
  resizeHandles?: ResizeHandleAxis[];
  /**
   * If true, item is constrained to the grid container bounds.
   * Overrides grid-level isBounded for this item.
   */
  isBounded?: boolean;
  /**
   * Internal flag set during drag/resize operations to indicate the item has
   * moved from its original position.
   * @internal
   */
  moved?: boolean;
  /**
   * Per-item layout constraints. Applied in addition to grid-level constraints.
   */
  constraints?: LayoutConstraint[];
}

/**
 * A layout is a readonly array of layout items. Treat layouts as immutable.
 */
export type Layout = readonly LayoutItem[];

// ============================================================================
// Position & Size Types
// ============================================================================

/** Pixel position and size of an element. */
export interface Position {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Partial position (just coordinates, no size). */
export interface PartialPosition {
  left: number;
  top: number;
}

/** Size in pixels. */
export interface Size {
  width: number;
  height: number;
}

// ============================================================================
// Compaction Types
// ============================================================================

/**
 * Type of compaction to apply to the layout.
 * - 'vertical': Items compact upward (default)
 * - 'horizontal': Items compact leftward
 * - 'wrap': Items arranged in wrapped-paragraph style (like words in text)
 * - null: No compaction (free-form positioning)
 */
export type CompactType = 'horizontal' | 'vertical' | 'wrap' | null;

/**
 * Interface for layout compaction strategies.
 *
 * Implement this interface to create custom compaction algorithms.
 */
export interface Compactor {
  /** Compaction type identifier */
  readonly type: CompactType;
  /**
   * Whether items can overlap (stack on top of each other).
   *
   * When true items can be placed on top of other items, dragging into another
   * item does NOT push it away, and compaction is skipped after drag/resize.
   */
  readonly allowOverlap: boolean;
  /**
   * Whether to block movement that would cause collision.
   *
   * When true (and allowOverlap is false) dragging into another item is blocked
   * (item snaps back) and other items are NOT pushed away. Only affects
   * drag/resize, not compaction. Has no effect when allowOverlap is true.
   */
  readonly preventCollision?: boolean;
  /**
   * Compact the layout.
   *
   * @param layout - The layout to compact
   * @param cols - Number of columns in the grid
   * @returns The compacted layout
   */
  compact(layout: Layout, cols: number): Layout;
}

// ============================================================================
// Layout Constraint Types
// ============================================================================

/** Context provided to constraint functions during drag/resize operations. */
export interface ConstraintContext {
  /** Number of columns in the grid */
  cols: number;
  /** Maximum number of rows (Infinity if unbounded) */
  maxRows: number;
  /** Container width in pixels */
  containerWidth: number;
  /** Container height in pixels (may be 0 if auto-height) */
  containerHeight: number;
  /** Row height in pixels */
  rowHeight: number;
  /** Margin between items [x, y] in pixels */
  margin: readonly [number, number];
  /** Current layout state */
  layout: Layout;
}

/**
 * Interface for layout constraints.
 *
 * Implement this interface to create custom position/size constraints.
 * Built-in constraints: gridBounds, minMaxSize, containerBounds, boundedX,
 * boundedY.
 */
export interface LayoutConstraint {
  /** Constraint identifier for debugging */
  readonly name: string;
  /**
   * Constrain position during drag operations. Called after grid unit
   * conversion, before layout update.
   */
  constrainPosition?(
    item: LayoutItem,
    x: number,
    y: number,
    context: ConstraintContext,
  ): { x: number; y: number };
  /**
   * Constrain size during resize operations. Called after grid unit conversion,
   * before layout update.
   */
  constrainSize?(
    item: LayoutItem,
    w: number,
    h: number,
    handle: ResizeHandleAxis,
    context: ConstraintContext,
  ): { w: number; h: number };
}

// ============================================================================
// Grid Configuration Types
// ============================================================================

/**
 * Grid measurement configuration.
 * Groups all grid metrics (columns, row height, margins).
 */
export interface GridConfig {
  /** Number of columns in the grid (default: 12) */
  cols: number;
  /** Height of a single row in pixels (default: 150) */
  rowHeight: number;
  /** [horizontal, vertical] margin between items in pixels (default: [10, 10]) */
  margin: readonly [number, number];
  /** [horizontal, vertical] padding inside the container (default: null, uses margin) */
  containerPadding: readonly [number, number] | null;
  /** Maximum number of rows (default: Infinity) */
  maxRows: number;
}

/** Default grid configuration */
export const defaultGridConfig: GridConfig = {
  cols: 12,
  rowHeight: 150,
  margin: [10, 10],
  containerPadding: null,
  maxRows: Infinity,
};

// ============================================================================
// Utility Types
// ============================================================================

/** Makes all properties in T mutable (removes readonly). */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};
