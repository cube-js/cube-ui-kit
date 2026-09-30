---
'@cube-dev/ui-kit': patch
---

Fix auto-hidden item actions becoming unreachable by keyboard when added after an initially empty render. DisplayTransition now uses current children while fully hidden, preserving previous content only through the exit transition.
