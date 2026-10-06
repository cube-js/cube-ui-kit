---
'@cube-dev/ui-kit': patch
---

`Tree` rows with a single child, and lazy rows (`isLeaf: false`) whose children are not loaded yet, report `aria-expanded` and expand and collapse with `ArrowRight` / `ArrowLeft`, like rows with more children. In `selectionMode="none"`, pressing such a row now toggles it too, as it already did for other parent rows.
