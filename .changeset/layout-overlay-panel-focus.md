---
"@cube-dev/ui-kit": patch
---

A `Layout.Panel` in `overlay` mode no longer closes when you focus a control inside it or a popover, menu or dialog opened from it, so its inputs and buttons can be used. Focus moving into the main content, a backdrop click and Escape still close it; focus moving into another `Layout.Panel` of the same Layout keeps it open. Opening an overlay panel now moves focus to its first control, unless focus already moved elsewhere as it opened, such as to a field with `autoFocus`, and closing it returns focus to the element that had it before, unless focus has moved elsewhere; a panel already open when its Layout first renders leaves page focus alone. A panel opened from a menu item now stays open, and a wrapper that focuses the panel's first control and stops its focus events is no longer needed.
