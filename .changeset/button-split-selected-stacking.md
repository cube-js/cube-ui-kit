---
"@cube-dev/ui-kit": patch
---

`Button.Split` can join toggle buttons: a selected button now draws above its neighbours, so the next button no longer paints over its border, and a focused button draws above it. The split keeps this stacking to itself, so a raised button never paints over the page around it, such as a sticky header.
