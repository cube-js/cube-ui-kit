---
'@cube-dev/ui-kit': patch
---

`SearchComboBox`: `Escape` on a list that a load still holds back (open, but waiting for `loadingDelay` before it shows) now cancels it and acts as on a closed list: it clears the text when clearable, or goes on to a surrounding dialog when the input is empty. Before, it only cancelled the hidden list and kept the key, so the first `Escape` in a dialog did nothing visible.
