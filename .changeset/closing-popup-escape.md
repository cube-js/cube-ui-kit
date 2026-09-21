---
"@cube-dev/ui-kit": patch
---

Stop a closing popup from swallowing the `Escape` meant for the Dialog around it. A `Select`, `Picker` or popover `DialogTrigger` inside a Dialog stays mounted for its exit transition while still holding focus, and React Aria's `useOverlay` claims every `Escape` it sees before checking whether it is the overlay allowed to act on one — so the key was consumed and nothing closed. `ListBox`, `Picker` and `FilterPicker` also stopped `Escape` from propagating out of keyboard handlers that never used it.
