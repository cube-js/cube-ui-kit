---
'@cube-dev/ui-kit': minor
---

**Tree**: revert `expandOnFolderClick`. Its row-level `stopPropagation()` on pointer/mouse events prevented document-level listeners from receiving them — most visibly, `Layout.Panel`'s resize (via React Aria's `useMove`) latched when the cursor released over a folder row in a `Tree` rendered inside a resizable panel. The default `treegrid` behavior (chevron expands, row activates selection) is unchanged.
