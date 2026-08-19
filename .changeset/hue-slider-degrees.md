---
'@cube-dev/ui-kit': patch
---

`HueSlider` prints its value in degrees.

A hue is an angle, and the slider already renders its value beside the label — so a caller who wanted the unit had to put it in the label instead, which then repeated the number the slider was showing anyway. It now defaults `formatOptions` to `{ style: 'unit', unit: 'degree', unitDisplay: 'narrow' }`, giving `280°`. Pass your own `formatOptions` to override it.
