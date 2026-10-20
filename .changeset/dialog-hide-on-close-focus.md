---
"@cube-dev/ui-kit": patch
---

Fix focus dropping to the page when a `hideOnClose` dialog closes: `DialogContainer` and a popover `DialogTrigger` now return focus to the element that opened them, as they do without `hideOnClose`. One opened from a menu item still leaves focus on the page when it closes, where a dialog without `hideOnClose` returns it to the menu's trigger. Every open of a `hideOnClose` dialog now also moves focus in the way a newly mounted dialog does: to an autofocused text field (a `TextArea` included), or to a submit or primary button, otherwise to the dialog itself, so a reopen keeps its scroll position instead of scrolling back to its first control. Other `autoFocus` props, such as a `Button`'s, act only when the dialog mounts.
