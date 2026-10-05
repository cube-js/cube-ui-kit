---
"@cube-dev/ui-kit": patch
---

A control that keeps keyboard focus while disabled now shows its focus ring: a disabled `Button` or `ItemAction` that has a tooltip or renders as a link, a disabled `ItemButton` of a type with a ring (`outline`, `primary`, `clear`), and a disabled interactive `InfoBadge`. The default `item` type has no ring, since its rows show focus with their fill, so a disabled one shows no focus, as before. A disabled `current` `primary` chip no longer darkens when focused. Before, the ring disappeared while the control was disabled and stayed gone after it was enabled, until focus left and came back. A control also drops a focus ring it lost without a blur, as when its tooltip is added or removed while it is focused and the element is replaced, or a `fieldset` around it is disabled: right away when the control re-renders, otherwise on the next key or pointer press, so a Tab no longer leaves two rings.
