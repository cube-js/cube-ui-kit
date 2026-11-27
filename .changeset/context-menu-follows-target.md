---
'@cube-dev/ui-kit': patch
---

`useContextMenu` now follows the element its `targetRef` is attached to when that element changes after the first render: a target attached later opens the menu on a right-click or long press, and one detached no longer does. It used to bind only to the element present on the first render.
