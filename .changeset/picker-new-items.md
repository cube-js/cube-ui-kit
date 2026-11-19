---
"@cube-dev/ui-kit": patch
---

`Picker` shows options that arrive while its popover is open, such as a server search's results. With `sortSelectedToTop`, which is on when `items` is set, it kept showing the options it opened with until the next change. The order still holds while the popover is open: it follows the selection the popover opened with, so selecting an option moves nothing, even when the parent passes new `items` on every render.
