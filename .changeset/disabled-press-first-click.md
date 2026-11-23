---
'@cube-dev/ui-kit': patch
---

**Button, ItemButton, ItemAction, Action, Select, ToggleGroup:** a control clicked while disabled now acts on the first click after it is enabled. Before, that click did nothing and only a second click worked: browsers still send pointer events to a disabled `<button>`, and React Aria kept the press that started there. A disabled control now gets no press handlers, so a click on it still does nothing. A caller's `onPointerDown`, `onPointerUp`, `onTouchStart` or `onTouchEnd` on a disabled `ItemButton` no longer runs, as it already did not when the row showed a tooltip.
