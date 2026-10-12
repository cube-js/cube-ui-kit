---
"@cube-dev/ui-kit": patch
---

Keep a disabled `Radio` or `Radio.Button` focusable while it has a tooltip to show, so the keyboard can open it as well as the mouse. The tooltip is usually the reason the option is disabled, and a natively disabled input left the tab order, so a fully disabled group had no tab stop at all. Such a radio is now marked `aria-disabled` and kept inert: a disabled group whose options have tooltips keeps one tab stop, the arrow keys stop on a disabled option without selecting it, and `Space` and clicks change nothing. A disabled radio without a tooltip is natively disabled, as before.
