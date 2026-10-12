---
"@cube-dev/ui-kit": patch
---

Reduce ItemTable and DataTable scrolling work by retaining virtual row keys and unchanged default cell text, and skip row-position reads while movement animation is disabled. Refresh tooltip overflow detection when label or description text changes without a resize.
