---
'@cube-dev/ui-kit': patch
---

**Tree**: fix virtualized scroll container growing past its fixed height. The previous structure made the outer `TreeElement` both a `display: flex` layout container and the `overflow: auto` scroll element, so the virtualizer's sizer (a flex child with `height: totalSize`) was squashed by `flex-shrink: 1` and the scroll area visibly grew as `@tanstack/react-virtual` re-measured rows during scroll. Scrolling now happens inside a dedicated block-level inner container, so the sizer's height is honored and the scroll viewport stays stable.

The forwarded `ref` now points at this inner scroll container so consumers can read/write `scrollTop` directly. The `role="treegrid"` element (used internally by `useTree`) is its parent.
