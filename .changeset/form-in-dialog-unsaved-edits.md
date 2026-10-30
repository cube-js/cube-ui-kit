---
"@cube-dev/ui-kit": minor
---

A modern `Form` inside a `Dialog` you lay out yourself now asks "Discard changes?" before Escape, a click outside or the close button discards what the user typed, as `DialogForm` does: the form reports its edits to the dialog's `DialogTrigger` or `DialogContainer` with no wiring. A successful submit saves the edits it carried, so a dialog that stays open after saving closes at once until the user types again. The dialog asks while any of its forms has unsaved edits. Set `confirmDismiss={false}` on the trigger or container where backing out loses nothing.
