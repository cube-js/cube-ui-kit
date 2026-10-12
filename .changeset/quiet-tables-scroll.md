---
"@cube-dev/ui-kit": patch
---

Reduce ItemTable and DataTable scrolling work by retaining virtual row keys and unchanged default cell text, and skip row-position reads while movement animation is disabled. Keep virtual height estimates and tooltip overflow detection current when row sizes, text or inherited table styling change.
