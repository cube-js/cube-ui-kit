---
'@cube-dev/ui-kit': patch
---

Keep Layout.Panel slide animations and resize handles inside their Layout bounds, and move the main content in sync with panel toggling. Temporarily clip the Layout during panel motion and restore its configured overflow once all panels settle, without changing inherited pointer interaction.
