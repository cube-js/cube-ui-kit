---
"@cube-dev/ui-kit": minor
---

Affected fields, layout components, overlays, tabs, trees and tables forward supported QA, class, inline style, token and modifier props to their control or root. Radio, checkbox, color swatch and toggle groups follow the same contract, and `ToggleGroup.Item` accepts integration styles and classes on its button. These component APIs own their slot names and expose `theme` or `title` only where they control appearance or content. `Slider`, `RangeSlider`, `HueSlider` and `Label` honor a caller-provided `qa`.
