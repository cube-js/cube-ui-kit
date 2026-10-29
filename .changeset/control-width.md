---
"@cube-dev/ui-kit": minor
---

Inputs take a `controlWidth` prop: the control's own width. It sizes the element `width` sizes when the input has no label, in every label position, so beside a side label it sizes the control alone, fixed (`'100px'`) or capped (`'max 30x'`), however long the label is. `width` stays the space the whole field takes, label included. `controlWidth` wins over `width` on an input without a label and over `styles.width`, and a state map on it resolves against the control. Replace a `styles={{ width }}` that sizes a control beside its label with `controlWidth`. `Slider`'s `inputWidth` prop, which nothing read, is removed.
