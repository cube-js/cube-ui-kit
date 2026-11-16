---
"@cube-dev/ui-kit": patch
---

`InfoBadge`: a tap on a touch screen now opens the tooltip of a non-interactive badge, including every field's `labelTooltip`. A second tap, a tap on the tooltip or anywhere else, or `Escape` closes it, and the tap that closes it never reaches what the tooltip covers. Mouse hover works as before.

`Tooltip`: a material tooltip (`isMaterial`) is now a top layer. A press on it no longer closes a Dialog, Popover or Tray, and an open modal leaves it reachable by focus and by screen readers.
