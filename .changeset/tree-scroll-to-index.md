---
'@cube-dev/ui-kit': minor
---

`Tree` now drives all "scroll into view" through the internal virtualizer instead of `querySelector` + `scrollIntoView`. Two changes:

- **Fix:** keyboard navigation now keeps the focused row visible even when the target lies outside the virtualizer's current overscan window. Previously the row's DOM node was queried before it was mounted, so `scrollIntoView` silently no-oped and the focus indicator could leave the viewport.
- **New behavior:** a controlled `selectedKeys` change scrolls the first selected key into view. This lets parent components (e.g. file-tree consumers opening a file from outside the tree) bring the row into view without owning virtualizer math themselves. The effect retries once parents are expanded, so off-screen targets land correctly even when expansion is staged in a separate render.
