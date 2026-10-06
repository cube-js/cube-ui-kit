---
'@cube-dev/ui-kit': patch
---

`Escape` pressed on a `Tree` row's checkbox now reaches the surrounding popover or dialog, after clearing any row selection as `Escape` on a row already does, so a checkable `Tree` inside an overlay can be dismissed from the keyboard. Every other key stays held at the checkbox, as before.
