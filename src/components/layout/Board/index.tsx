import { Board as BoardBase } from './Board';
import { BoardProvider } from './BoardProvider';
import { BoardResponsive } from './BoardResponsive';
import { Widget } from './Widget';

const Board = Object.assign(BoardBase, {
  Widget,
  Provider: BoardProvider,
  Responsive: BoardResponsive,
});

export { Board };
export { BoardProvider };
export { BoardResponsive };
export { Widget as BoardWidget };

export type {
  CubeBoardProps,
  BoardCompactType,
  BoardGridLines,
  BoardInteractionInfo,
} from './Board';
export type { CubeBoardResponsiveProps } from './BoardResponsive';
export type { CubeBoardWidgetProps } from './Widget';
export type { CubeBoardProviderProps } from './BoardProvider';
export type { WidgetTransferInfo } from './board-context';
export type {
  Breakpoints as BoardBreakpoints,
  BreakpointCols as BoardBreakpointCols,
  ResponsiveLayouts as BoardResponsiveLayouts,
} from './responsive-utils';

export type {
  Layout,
  LayoutItem,
  ResizeHandleAxis,
  Compactor,
  LayoutConstraint,
  PositionParams,
} from './grid-core';

export {
  verticalCompactor,
  horizontalCompactor,
  noCompactor,
  getCompactor,
  gridBounds,
  minMaxSize,
  containerBounds,
  boundedX,
  boundedY,
  aspectRatio,
  snapToGrid,
  minSize,
  maxSize,
} from './grid-core';
