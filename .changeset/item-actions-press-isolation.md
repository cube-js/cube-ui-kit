---
'@cube-dev/ui-kit': patch
---

A control in a row's `actions` no longer answers to whatever opened around the row. An `ItemButton` — or a tab, or a `Select` / `Picker` / `FilterPicker` trigger — used as the trigger of a `DialogTrigger` or a `MenuTrigger` handed its own actions the trigger's press behaviour, because React Aria's `PressResponder` reaches every control below it. Pressing an action ran the action _and_ toggled the overlay; with the overlay already open the press was spent dismissing it instead, so the action never ran at all.

Both halves of the guard now live in the actions run itself, so every row that has actions gets them rather than only the three field triggers that had grown their own copy:

- **The run clears the press context it sits in**, so each action answers only to its own handler.
- **The run identifies itself to the overlay** as belonging to its row, so an overlay opened by that row reads a press on its own actions as its own rather than as a press outside. It is scoped to the row: pressing some other row's actions dismisses an open popover exactly as before.
