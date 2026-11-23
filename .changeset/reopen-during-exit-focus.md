---
'@cube-dev/ui-kit': patch
---

**Menu, Select, CommandMenu:** a menu or a `Select` list reopened while it still plays its close animation (for example `Escape`, then `Enter` on its button within about a third of a second) now puts focus inside it, on the item a normal opening focuses, and `Escape` closes it. Before, focus stayed on the button and `Escape` did nothing until the user clicked elsewhere.

**DialogTrigger:** a popover dialog, such as the list of a `Picker` or `FilterPicker` or the calendar of a `DatePicker`, now returns focus to its trigger as soon as it closes rather than once its close animation ends. A key pressed right after `Escape` reaches the trigger: before, it landed in the closing popover, so `Enter` could clear or change a picker's selection instead of reopening it. A dialog reopened during its close animation now takes focus as on any opening, so a `DatePicker` focuses the selected date again.

Reopened during its close animation, a menu, list or dialog now shows its contents afresh, as an opening after the animation always did, so state kept inside it, such as text typed in it or an uncontrolled `Menu` selection, starts over then too. A dialog with `hideOnClose` keeps its contents, as before.
