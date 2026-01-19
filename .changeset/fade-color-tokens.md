---
'@cube-dev/ui-kit': minor
---

Add color token support to `fade` style property. You can now specify custom transparent and opaque colors for the gradient mask, and use multiple comma-separated groups to apply different colors per direction.

Add multi-group support to `border` style property. Multiple comma-separated groups allow cascading border definitions where later groups override earlier ones for conflicting directions (e.g., `border="1bw #red, 2bw #blue top"`).
