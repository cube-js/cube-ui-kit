---
"@cube-dev/ui-kit": patch
---

Replace `noCard` prop with `type` prop in ListBox component. The new `type` prop accepts three values:
- `card` (default): Standard card styling with border and margin
- `plain`: No border, no margin, no radius - suitable for embedded use
- `popover`: No border, but keeps margin and radius - suitable for overlay use
