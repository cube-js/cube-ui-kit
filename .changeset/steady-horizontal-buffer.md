---
"@cube-dev/ui-kit": patch
---

Reduce wide ItemTable and DataTable horizontal scrolling work by reusing the mounted column buffer between refills. Keep the existing ahead coverage, tooltips, headers and custom-cell behavior, and release extra buffer cells when scrolling settles.
