---
"@cube-dev/ui-kit": minor
---

Add a `tooltip` prop to `Switch`, as `Checkbox` has: a string or `TooltipProvider` props, shown on hover over the switch and its inline label and on keyboard focus, and describing the input to screen readers. A disabled switch with a tooltip stays focusable, marked `aria-disabled` and inert, so the keyboard reaches the reason it is disabled; without a tooltip it is natively disabled, as before. Wrapping a disabled switch in `TooltipProvider` opens nothing, since it takes no trigger props while disabled; use `tooltip` instead.
