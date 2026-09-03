---
'@cube-dev/ui-kit': minor
---

Export `BoardDragActiveProvider`, so a `Board` implementation living outside this package can tell `Tabs` that a widget drag is in flight. `Tabs` reads that signal to spring-load a tab when a dragged widget hovers its header, and to keep panels mounted for the drag's duration so the tab a widget is being pulled out of cannot unmount mid-gesture; both came from a context private to this package, so an external board silently lost them. `Board` still provides it automatically — you only need the provider if your board is not this one.
