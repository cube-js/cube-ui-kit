---
"@cube-dev/ui-kit": patch
---

A `Badge` or `Tag` in a field's `labelSuffix` no longer grows the label row by a pixel. The suffix was wrapped in a block, where an inline-level element sits in a line box whose strut added space under it, so the row measured 21px instead of 20px and the field below stepped out of line with its neighbours. The wrapper is now a flex box that centres the suffix.
