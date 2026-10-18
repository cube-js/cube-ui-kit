---
"@cube-dev/ui-kit": patch
---

`Button`: an open tooltip now joins the button's own `aria-describedby` instead of replacing it, so a screen reader reads both the button's hint or error and the tooltip. `ItemBadge` does the same.

`TooltipTrigger`: `shouldCloseOnPress={false}` now keeps the tooltip open when the trigger is pressed, and `Tooltip`'s `shouldFlip={false}` now keeps the requested placement. The `delay` default is documented as 250ms, which is what it always was. `Tooltip`'s `showIcon` never did anything and is now marked deprecated.

`Tooltip`: an open tooltip now closes when an ancestor of its trigger scrolls, as a popover does, instead of floating where it was drawn while the trigger scrolls away.

`Tooltip`: empty content (`title={null}`, `undefined` or `''`) no longer opens an empty bubble or adds `aria-describedby` to the trigger.

`ItemBadge` and `InfoBadge`: a non-interactive icon badge with a name is now exposed as `role="img"`, so screen readers announce its name. When `aria-label` differs from a plain-text tooltip, the tooltip text becomes the badge's description, so keyboard and screen reader users get it without hovering.

`Button`: a disabled button stays natively disabled unless it has a tooltip you passed. The automatic tooltip for a truncated label used to keep it focusable, so whether a disabled button was a Tab stop changed with the window width.

`Button`: a button that is only loading (`isLoading` without `isDisabled`) keeps keyboard focus, so pressing Enter on it no longer drops focus to the page. It is marked `aria-disabled` and `aria-busy`, stays inert, and Tab skips it until loading ends. A button that is both loading and disabled, as `SubmitButton` is during a submission, is still natively disabled.
