---
"@cube-dev/ui-kit": patch
---

`InfoBadge`: a tap on a touch screen now opens the tooltip of a non-interactive badge, including every field's `labelTooltip`. A second tap, a tap on the tooltip or anywhere else, or `Escape` closes it, and the tap that closes it never reaches what the tooltip covers. Mouse hover works as before.

`Tooltip`: a press on a material tooltip (`isMaterial`) no longer closes the Dialog, Popover or Tray its trigger sits in.
