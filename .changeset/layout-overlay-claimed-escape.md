---
'@cube-dev/ui-kit': patch
---

`Layout.Panel` in `overlay` mode stays open when a control inside it handles Escape itself and prevents the default, such as a code editor closing its autocomplete; an unhandled Escape still closes it.
