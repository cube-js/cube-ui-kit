---
'@cube-dev/ui-kit': minor
---

**DataTable**: `rowSize` sets the row height to a named step — `small` 28px,
`medium` 32px, `large` 40px. It moves the rows only: the header keeps answering
to `size`, so a denser body no longer means reaching for `size` and dragging the
header down with it.

Unset, the height comes from `size` exactly as before, so nothing changes for
existing tables. `rowHeight` still wins when an exact pixel value is needed.
