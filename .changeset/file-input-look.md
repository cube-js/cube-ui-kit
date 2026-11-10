---
'@cube-dev/ui-kit': patch
---

`FileInput` is easier to read and lines up with the inputs around it. The "Choose file" chip's label uses the accent text color instead of the accent fill, so it meets WCAG AA in light, dark and both high-contrast schemes (it was as low as 2.8:1 in dark), and it is medium weight with hover, pressed and drag-over feedback. "No file selected" (or the `placeholder`) is a softer gray than a chosen file name, still AA. The box is drawn like a text input's box: the same height at each `size` (28, 32 and 40px; `size` used to have no effect), the same border, focus and validation colors, and it now fills the width of its field as other inputs do. Pass `controlWidth` (or `width`) to make it narrower; a file name that does not fit ends in an ellipsis. Disabled uses the disabled colors.
