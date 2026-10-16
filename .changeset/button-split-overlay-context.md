---
"@cube-dev/ui-kit": patch
---

`Button.Split` no longer styles the Buttons inside a popover, dialog or menu opened from it. Its `type`, `theme`, `size` and `isDisabled` used to reach every `Button` in that overlay, so a confirm popover's Cancel button on a primary, small split turned primary and small, and was disabled whenever the split was. The split's own Buttons still inherit them, and a `Button.Split` inside an overlay still styles its own Buttons. A workaround that wraps the overlay in `<ButtonSplitContext.Provider value={null}>` is no longer needed and can be removed.
