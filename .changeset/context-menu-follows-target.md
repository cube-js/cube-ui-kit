---
'@cube-dev/ui-kit': patch
---

`useContextMenu` now follows the element its `targetRef` is attached to when a later render of the component that calls the hook changes it: a target attached later opens the menu on a right-click or long press, and one detached no longer does. It used to bind only to the element present on the first render, so a `Tabs` tab whose context menu was turned on after mount never opened it.
