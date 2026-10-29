---
"@cube-dev/ui-kit": minor
---

A dialog with unsaved edits now asks "Discard changes?" before Escape, a click outside or its close button closes it. `DialogForm` asks while a field the user edited differs from its default; a value set from code is not an edit, and `preserve` never asks. Submit, Cancel, a `close` you call and closing from code still close at once, and a popover never asks. Set `confirmDismiss={false}` on a `DialogForm` that has nothing to lose when the user backs out, such as a confirmation that asks to type a name, or on its `DialogTrigger` or `DialogContainer`, whose explicit value wins. Any other dialog can bind `confirmDismiss` on its `DialogTrigger` or `DialogContainer` to its own unsaved state. **Discard** closes the dialog; **Keep editing**, Escape or a click outside the question returns to the dialog with focus where it was.
