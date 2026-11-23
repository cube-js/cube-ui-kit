---
'@cube-dev/ui-kit': patch
---

**Menu, Select:** a menu or a `Select` list reopened while it still plays its close animation (about a third of a second after closing, for example `Escape` then `Enter` on its button) now puts focus inside it, on the item a normal opening focuses, and `Escape` closes it. Before, focus stayed on the button and `Escape` did nothing until the user clicked elsewhere. Such a reopen now shows the menu or list afresh, as an opening after the animation always did, so state kept inside it, such as an uncontrolled selection or a search field's text, starts over on it too.
