---
"@cube-dev/ui-kit": patch
---

`ComboBox`: a press in the input opens a closed list, also when the input already has focus, for example after `Tab` or after `Escape` closed the list. The list shows the options the typed text leaves, and text that matches nothing keeps it hidden, so a press that moves the caret does not change what `Enter` commits. A click on the field label only focuses the input. With `popoverTrigger="manual"` the list still opens only from the chevron and the arrow keys.

`ComboBox`: a press in the input while the list is open moves the caret and keeps the list open. It used to close the list. The chevron still toggles it.

`ComboBox` with `isReadOnly` no longer opens its list from the chevron, the arrow keys, a press in the input or `popoverTrigger="focus"`, and `Enter`, `Escape` and blur no longer change its value or text. Read-only used to only hide the clear button.

`ComboBox` with `allowsCustomValue` commits the typed text trimmed, on `Enter` and on blur, and empty or whitespace-only text clears the selection with `null` instead of committing `''`.

`ComboBox`: picking the option that is already selected, with a click or `Enter`, keeps it selected and closes the list. It used to clear the value.

`ComboBox`: the input has `aria-autocomplete="list"`, so screen readers announce that typing filters the options.

`ComboBox` lets `Escape` and `Tab` reach its ancestors unless it acts on them. `Escape` with the list closed and nothing to clear now closes a surrounding dialog, and `Tab` reaches a dialog's focus containment. `Escape` that closes the list or clears the value still stops at the input.

`ComboBox`: leaving the field without editing it no longer calls `onSelectionChange(null)` or `onInputChange`. Blur reports only what it changes.

`ComboBox`: `aria-activedescendant` no longer points at an option the typed text filtered out. It names a shown option or is absent.

`ComboBox` with `allowsCustomValue`: `Enter` with the list closed commits the typed text, even when it is part of an option's label, so "app" can be committed next to an "apple" option. With the list open, `Enter` still picks the highlighted option.

`ComboBox`: `onOpenChange` is no longer called on mount and reports only the list showing or hiding. Typing text that matches nothing no longer reports an open and a close on every keystroke. `aria-expanded` follows whether the list is shown.

`ComboBox` shows the selected option's label once the options load after `selectedKey`, instead of the raw key, and shows the label of `defaultSelectedKey` from the first paint instead of an empty input.

`ComboBox`: `Enter` pressed right after typing picks the first match. It used to find nothing highlighted yet, so it picked nothing and could submit an enclosing form instead.

`ComboBox`: the chevron and clear buttons are no longer `Tab` stops, `Tab` closes the list as focus moves on, and closing the list with the chevron returns focus to the input.

`ComboBox` recognises an exact match with the same locale-aware comparison the filter uses, so text the list shows for an option, such as "ete" for "Été", selects that option on blur.

`ComboBox` with a controlled `selectedKey` keeps showing the controlled option's label when the parent rejects a pick. The input used to show the rejected option.

`ComboBox` leaves keys pressed during IME composition to the input method, so the `Enter` that confirms a candidate no longer selects an option or commits half-composed text.

`ComboBox` with `items` shows items that arrive while its list is open at once. It used to keep showing the previous items until the next keystroke.

`ComboBox`, `SearchComboBox` and `TagInput` with `size="large"` open a list of large options, as `Select` does. A small field keeps medium options.
