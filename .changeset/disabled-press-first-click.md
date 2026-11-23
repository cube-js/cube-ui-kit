---
'@cube-dev/ui-kit': patch
---

**Button, ItemButton, ItemAction, Action, Item, Select, ToggleGroup, Disclosure:** a control clicked while disabled now acts on the first click after it is enabled. Before, that click did nothing and only a second click worked: Chrome still sends pointer events to a disabled `<button>`, and React Aria kept the press that started there. A disabled control now gets no press handlers, so a click on it still does nothing; `useAction` returns none for a disabled action. A caller's `onPointerDown`, `onPointerUp`, `onTouchStart` or `onTouchEnd` on a disabled `ItemButton`, or an `Item` rendered as a button, no longer runs, as it already did not when the control showed a tooltip.
