---
'@cube-dev/ui-kit': minor
---

Added slash separator support in style parser. Style values can now use `/` surrounded by whitespace to define parts (e.g., `'ellipsis / 3'`, `'2px solid #red / 4px'`). Each part is available via `groups[n].parts` array for style handlers.
