---
'@cube-dev/ui-kit': patch
---

`SearchComboBox` no longer hides its list when a new load empties it: a list already on screen stays and shows `Loading…` (or your `emptyLabel`) until the results land, so a server search doesn't make it blink out between keystrokes. A list that opens with no results while loading still waits `loadingDelay` before it shows.
