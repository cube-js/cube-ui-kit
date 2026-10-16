---
"@cube-dev/ui-kit": patch
---

A `Layout.Panel` in `overlay` mode no longer closes when you focus a control inside it or a popover, menu or dialog opened from it, so its inputs and buttons can be used. Focus moving into the main content, a backdrop click and Escape still close it; focus moving into another `Layout.Panel` of the same Layout keeps it open.
