---
'@cube-dev/ui-kit': minor
---

Added `textOverflow` style prop with support for single-line and multi-line text truncation. Use `textOverflow: 'ellipsis'` for single-line or `textOverflow: 'ellipsis / 3'` for multi-line (3 lines) truncation. The `displayStyle` handler now manages `display`, `hide`, `textOverflow`, `overflow`, and `whiteSpace` together to avoid conflicting styles.
