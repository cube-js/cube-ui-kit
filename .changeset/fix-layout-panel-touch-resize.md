---
'@cube-dev/ui-kit': patch
---

Fix Layout.Panel resize handler not working properly on touch devices by adding `touch-action: none` to prevent browser scroll interference during drag
