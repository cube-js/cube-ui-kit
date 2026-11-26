---
'@cube-dev/ui-kit': patch
---

`Item`: while `autoHideActions` hides the actions, their column now collapses to zero width, as documented, instead of keeping 8px, and the hidden actions can no longer be tapped through the end of the label on a touch screen. Hover, focus and keyboard still reveal them; `preserveActionsSpace` and `ItemButton` are unchanged.
