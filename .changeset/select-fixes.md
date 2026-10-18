---
"@cube-dev/ui-kit": patch
---

`Select`: `isReadOnly` now fixes the value. The trigger stays focusable, but the list no longer opens and typeahead and the arrow keys no longer pick another option. Before, only the clear button was hidden.

`Select`: `onOpenChange` fires once per open or close, and no longer fires with `false` on mount.

`Select`: the options in the list follow the field's `size`, so a `large` Select opens `large` options. A `small` Select still opens `medium` options.

`Select`: the divider between sections no longer has `role="separator"`, which a listbox may not contain. It is presentation only and looks the same.

`Select`: `autoFocus` focuses the trigger, `inputProps` reach the trigger button and `loadingIndicator` replaces the default loading icon. All three were accepted and ignored. `popoverRef` is typed as `RefObject<HTMLElement | null>`, the popover element it receives; refs to an input element still type-check. `hideTrigger` never had an effect and is deprecated: pass `rightIcon={null}` to hide the caret.

`Select`: clearing calls `onSelectionChange(null)` once instead of twice.

`Select`: while `isLoading` is set the list no longer opens with nothing in it and typeahead no longer changes the value. Turning on `isDisabled`, `isLoading` or `isReadOnly` while the list is open closes it, so the trigger no longer reports `aria-expanded="true"` with no popup and the list does not reopen when the field is enabled again.

`Select`: opening from the keyboard focuses the right option. `ArrowUp` opens on the last option, `ArrowDown`, `Enter` and `Space` on the selected option or the first one, never on an option focused during an earlier opening or on the bare list. The focused option is scrolled into view as the list opens.

`Select`: the list is now the element that scrolls and that the popup's height limit applies to, so `PageDown` and `PageUp` move about one visible page instead of jumping to the last or first option. The popup also stays within the space left in the viewport.

`Select`: the clear button hands focus back to the trigger without opening the trigger's tooltip, so the next `Escape` closes a surrounding Dialog instead of that tooltip.

`Select`: the popup's minimum width is measured from the trigger when the list opens, not read during render.
