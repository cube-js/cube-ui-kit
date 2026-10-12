---
"@cube-dev/ui-kit": minor
---

Remove `Board` and its grid engine from UI Kit; Cube Cloud now owns the dashboard board. Removed exports: `Board` (with `Board.Widget`, `Board.Provider` and `Board.Responsive`), `BoardProvider`, `BoardResponsive`, `BoardWidget`, `BOARD_SELECTION_CANCEL`, `placeInFreeSlot`, `distributeEvenly`, the compactors (`verticalCompactor`, `horizontalCompactor`, `noCompactor`, `getCompactor`), the layout constraints (`gridBounds`, `minMaxSize`, `containerBounds`, `boundedX`, `boundedY`, `aspectRatio`, `snapToGrid`, `minSize`, `maxSize`), every `Board*` and `CubeBoard*` type except `CubeBoardDragActiveProviderProps`, and the `board.*` translation strings. `BoardDragActiveProvider` stays: wrap a board's subtree in it to make the `Tabs` inside spring-load and keep their panels mounted during a widget drag.
