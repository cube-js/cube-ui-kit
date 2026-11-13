---
"@cube-dev/ui-kit": patch
---

Fields, layout components, overlays, tabs, trees and tables now forward caller base props such as `qaVal`, `className`, `style`, `tokens`, `mods`, `theme`, `title` and `element` to their control or root. Caller tokens and modifiers merge with component defaults. `Slider`, `RangeSlider`, `HueSlider` and `Label` also honor a caller-provided `qa`.
