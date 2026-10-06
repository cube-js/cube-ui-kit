---
"@cube-dev/ui-kit": patch
---

React Compiler now optimizes `ItemTable`, which used to skip compilation because it wrote a ref during render. With client pagination (the default), changing `data` in place no longer updates the table, which it already did not while rows were sorted, searched or shown as a tree: pass a new array instead.
