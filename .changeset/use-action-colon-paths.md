---
'@cube-dev/ui-kit': patch
---

A `to` with a colon in its path or query, such as `/models/cube:orders` or `..?thread=a:b`, now navigates in the router instead of reloading the page. Only a string that starts with a URL scheme (`https:`, `mailto:`, `tel:`) or with `//` counts as external. This covers `Link`, `Button`, `ItemButton`, `ItemAction` and every other action that takes `to`.
