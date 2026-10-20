---
"@cube-dev/ui-kit": patch
---

A `hideOnClose` dialog now moves focus everywhere a dialog without it does. A `Button`, `ItemButton`, `ItemAction`, `Action`, `Select`, `DateInput`, `TimeInput` or date picker with `autoFocus` takes focus on every open, as autofocused text fields already did: these controls now mark themselves `data-autofocus`, and a dialog's first focus prefers a marked control (a date field's first segment) to a submit or primary button. Closing a dialog opened from a menu item returns focus to the menu's trigger. `Tab` past either end of a retained panel, or of a popover that is not dismissable, moves to the controls beside its opener. A dialog opened from a retained one returns focus to that one's opener when it closes after it. A retained dialog nested in another overlay opens above it, where the browser supports `moveBefore`. And a retained dialog refocuses itself half a second after it opens, as React Aria's `useDialog` does so VoiceOver on iOS announces it.
