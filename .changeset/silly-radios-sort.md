---
"@cube-dev/ui-kit": patch
---

Fix Dialog focus management to ensure Escape key works reliably when dialog opens. Focus now properly falls back to the first tabbable element or the dialog element itself if no priority focusable element is found.
