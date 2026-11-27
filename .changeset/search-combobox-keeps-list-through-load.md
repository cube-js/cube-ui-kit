---
'@cube-dev/ui-kit': patch
---

`SearchComboBox` no longer hides its list when a new load empties it: a list already on screen stays and shows `Loading…` (or your `emptyLabel`) until the results land, so a server search doesn't make it blink out between keystrokes. A list that opens with no results while loading still waits `loadingDelay` before it shows. Screen readers now hear the empty state ("No results found" or your `emptyLabel`) through a polite status once the list settles on it, not while loading. Its text is therefore on the page twice: a test that finds it with `getByText` should check the listbox's description instead.
