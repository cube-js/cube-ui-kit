---
"@cube-dev/ui-kit": patch
---

Fix Dialog focus management to ensure Escape key works reliably when dialog opens and focus properly returns to the trigger when dialog closes. Focus now properly falls back to the first tabbable element or the dialog element itself if no priority focusable element is found. Replaced react-focus-lock with React Aria's FocusScope for better focus restoration behavior.
