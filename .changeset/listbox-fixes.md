---
"@cube-dev/ui-kit": patch
---

`ListBox` scrolls a long (virtualized) list to the option that receives focus when that option isn't rendered yet: `End`, `Home`, `Page Down`, typeahead, and the selected option when the list takes focus on open or on `Tab`. The option is then focused, and an input pointing `aria-activedescendant` at it (ComboBox) names an element that exists.

`ListBox` keeps its `role="listbox"` element when it has no items, described by the empty label, so a label's `aria-labelledby` or a search input's `aria-controls` no longer points at nothing.

`ListBox` renders "Select All" as a tri-state `checkbox` (`aria-checked` true, false or mixed) above the list instead of an `option` outside it. It is its own Tab stop, reached with `Tab` or `Shift+Tab` and toggled with `Space`, and no list item is left outside a list. Queries for it by role change from `option` to `checkbox`; its name is unchanged.

`ListBox` shows "Select All" as checked once every selectable item is selected, including when the items were selected one by one; disabled items don't count. The next press then clears the selection.

`ListBox` reports one `onSelectionChange` call per "Select All" press instead of two, and none when `disallowEmptySelection` keeps the selection.

`ListBox` section dividers are presentational, so a listbox holds only options and groups. `Menu`, `CommandMenu`, `ListBox` and `FilterListBox` headers no longer carry `role="heading"`, which read any controls inside as part of a title, and their footers drop the invalid `role="footer"`.
