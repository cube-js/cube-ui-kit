---
'@cube-dev/ui-kit': patch
---

`Slider` and `RangeSlider` pass their `ref` on under React 18 too; it was dropped there. `forwardRefWithGenerics`, which caused it and is no longer used, is deprecated: use `forwardRef` with a cast that restores the generic, as `Select` does.
