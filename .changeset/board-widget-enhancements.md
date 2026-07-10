---
"@cube-dev/ui-kit": minor
---

Enhance `Board` with widget defaults, card styling, and aligned nested-board improvements:

- Add `widgetProps` on `Board` to set default props for every hosted widget (e.g. `widgetProps={{ isCard: true }}`).
- Add `isCard` on `Board.Widget` for optional card borders; widgets are filled (`#surface-2`) and rounded by default.
- Add per-widget `minW`/`maxW`/`minH`/`maxH` bounds on `Board.Widget` (used when layout items omit them).
- Accept container style props directly on `Board.Widget` (merged into `styles`).
- Aligned nested boards (`isAligned`) now use the parent's row height verbatim (no shrinking to fit) and default `containerPadding` to `[0, 0]` so columns line up with the ancestor grid.
- Nested boards inherit an ancestor's `showGridLines` while dragging when they do not set their own.
