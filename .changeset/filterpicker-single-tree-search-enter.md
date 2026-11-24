---
"@cube-dev/ui-kit": patch
---

**FilterPicker:** in a tree with `selectionMode="single"`, a search now starts on its first matching leaf, or on the picked leaf when it matches, so Enter, such as a phone keyboard's Search key, picks a match. It used to start on the first row, a folder, and Enter closed that folder.
