---
"@cube-dev/ui-kit": patch
---

Keep a disabled `Radio` or `Radio.Button` focusable while its tooltip can open, so the keyboard can open the tooltip as the mouse does: it is usually the reason the option is disabled. Such a radio is marked `aria-disabled` and stays inert: a disabled group whose options all have tooltips keeps one tab stop, the arrow keys stop on a disabled option without selecting it, `Tab` leaves the group from it, and `Space` and clicks change nothing. Not being natively disabled, a selected one is part of a plain `<form>`'s submitted data. A disabled radio without a tooltip is natively disabled, as before. The color-space tabs of a read-only or loading `ColorPicker` panel, and of a read-only `ColorInput` panel, are such radios: the keyboard now reaches them and their hints.
