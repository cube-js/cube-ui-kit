---
"@cube-dev/ui-kit": patch
---

Keep a disabled `Checkbox` focusable while it has a `tooltip`, as a disabled `Radio` and `Button` already are, so the keyboard can open the tooltip as the mouse does: it is usually the reason the checkbox is disabled. This covers a checkbox disabled on its own and one in a disabled `Checkbox.Group`. Such a checkbox is marked `aria-disabled` and stays inert: `Space` and clicks on the box or its label change nothing. Not being natively disabled, a checked one is part of a plain `<form>`'s submitted data. A disabled checkbox without a tooltip is natively disabled, as before.
