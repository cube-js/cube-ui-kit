---
"@cube-dev/ui-kit": patch
---

A disabled `Slider`, `RangeSlider` or `HueSlider` is now disabled as a whole field: its label is muted and its message hidden, as on every other disabled field. Before, `isDisabled` reached only the track and thumbs. In a disabled form, the track now looks disabled too.
