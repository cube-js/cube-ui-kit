---
'@cube-dev/ui-kit': patch
---

`Tag` and `Badge` with an icon no longer paint a sliver of their label over the icon or past their edge when squeezed below their label. A cut label now starts right after the icon, and the element clips what passes its edge unless it has end content (a close button, suffix or right icon). A label that fits is placed as before.
