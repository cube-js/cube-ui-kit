import { Board as BoardBase } from './Board';
import { BoardProvider } from './BoardProvider';
import { Widget } from './Widget';

const Board = Object.assign(BoardBase, {
  Widget,
  Provider: BoardProvider,
});

export { Board };
export { BoardProvider };
export { Widget as BoardWidget };

export type { CubeBoardProps, BoardCompactType } from './Board';
export type { CubeBoardWidgetProps } from './Widget';
export type { CubeBoardProviderProps } from './BoardProvider';

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
