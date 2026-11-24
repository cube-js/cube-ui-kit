---
"@cube-dev/ui-kit": minor
---

**FilterPicker:** in tree mode, a `filter` function now gets the node as its third argument, so a search can match on what the node's text doesn't hold, such as a file's path in its `key`. A filter that returns `false` for a parent keeps it only as the opened ancestor of matching children. Two-argument filters work as before, and list mode is unchanged.
