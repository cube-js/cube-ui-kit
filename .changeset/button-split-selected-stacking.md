---
"@cube-dev/ui-kit": patch
---

`Button.Split` can join independent toggle buttons: a selected button now draws above its neighbours, so the next button no longer paints over its border, and a focused button draws above it. The split is now a stacking context of its own (`isolation: isolate`), so a raised button never paints over the page around it, such as a sticky header; a positioned element right against the split can now cover a focused button's ring, as it already does a standalone button's.
