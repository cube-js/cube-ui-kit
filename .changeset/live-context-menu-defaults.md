---
'@cube-dev/ui-kit': patch
---

`useContextMenu` and `useAnchoredMenu` now re-read `defaultMenuProps` on every render instead of snapshotting them when the menu opens. A menu whose content lives in those defaults — the row context menu in `Tree` and the tab context menu in `Tabs` both do — stayed frozen while open, so items appearing, disappearing or flipping `isDisabled` were invisible until it was closed and reopened. Runtime props passed to `open()`/`update()` still take precedence and are unaffected.
