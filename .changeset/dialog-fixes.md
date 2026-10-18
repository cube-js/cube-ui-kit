---
"@cube-dev/ui-kit": patch
---

`AlertDialog` is now described by its message through `aria-describedby`, so a screen reader reads the message together with the title when it opens. A plain `Dialog` still links no description by default, so a form inside it is not read aloud on open; pass `aria-describedby` to link one.

`AlertDialog` with `danger` now opens with focus on Cancel, or on the dialog itself when there is no Cancel, instead of on the destructive confirm button, so an Enter pressed out of habit no longer runs it. An explicit `autoFocus` on the confirm action still puts focus there. Dialogs without `danger` still focus the confirm button.

`AlertDialog` opened through `useAlertDialogAPI` now stays mounted until its exit animation has finished, instead of being removed 50 ms early.

`Dialog` now contains focus from the moment it opens. A Tab pressed while it was still animating in could move focus to the page behind a modal, where it stayed.

`DialogTrigger` with `offset={0}` now places a popover flush against its trigger instead of 8px away.

`DialogTrigger` popovers with `isDismissable={false}` no longer swallow outside presses: the control pressed receives the press, and a text field outside can take focus and be typed into, because the popover no longer holds focus. They stay open when a `Button` outside them is pressed or another popover opens, and still close when a modal, tray, fullscreen or panel dialog opens from another `DialogTrigger`.

`DialogTrigger` popovers anchored with `targetRef` now close when the anchor scrolls, like popovers anchored to their trigger.

`DialogTrigger`'s `hideArrow` is deprecated. Popovers have never rendered an arrow, so it has no effect.
