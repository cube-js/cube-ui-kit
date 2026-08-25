/**
 * Framework-agnostic grid layout engine.
 *
 * Vendored and trimmed from react-grid-layout v2. See ./NOTICE.md for
 * attribution and license.
 */

export type {
  ResizeHandleAxis,
  CollisionMode,
  CollisionResolutionContext,
  CollisionResolver,
  CollisionResolverOptions,
  MoveElementOptions,
  LayoutItem,
  Layout,
  Position,
  PartialPosition,
  Size,
  CompactType,
  Compactor,
  ConstraintContext,
  LayoutConstraint,
  GridConfig,
  Mutable,
} from './types';
export { defaultGridConfig } from './types';

export { collides, getFirstCollision, getAllCollisions } from './collision';

export {
  maxFreeRectAt,
  createCollisionResolver,
  isOverlapFree,
} from './collision-modes';

export { placeInFreeSlot, distributeEvenly } from './placement';

export {
  sortLayoutItems,
  sortLayoutItemsByRowCol,
  sortLayoutItemsByColRow,
} from './sort';

export {
  bottom,
  getLayoutItem,
  getStatics,
  cloneLayoutItem,
  cloneLayout,
  modifyLayout,
  withLayoutItem,
  correctBounds,
  moveElement,
  moveElementAwayFromCollision,
  validateLayout,
} from './layout';

export type { MoveElementsOptions, MoveElementsResult } from './group-move';
export { moveElements } from './group-move';

export {
  resolveCompactionCollision,
  compactItemVertical,
  compactItemHorizontal,
  verticalCompactor,
  horizontalCompactor,
  noCompactor,
  verticalOverlapCompactor,
  horizontalOverlapCompactor,
  noOverlapCompactor,
  getCompactor,
} from './compactors';

export type { PositionParams } from './calculate';
export {
  calcGridColWidth,
  calcGridItemWHPx,
  calcGridItemPosition,
  calcXY,
  calcXYRaw,
  calcWH,
  calcWHRaw,
  clamp,
} from './calculate';

export {
  gridBounds,
  minMaxSize,
  containerBounds,
  boundedX,
  boundedY,
  aspectRatio,
  snapToGrid,
  minSize,
  maxSize,
  defaultConstraints,
  applyPositionConstraints,
  applySizeConstraints,
} from './constraints';

export { resizeItemInDirection } from './position';
