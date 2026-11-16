---
'@cube-dev/ui-kit': minor
---

`Tab` takes `to`: the tab renders as a real link (`<a href role="tab">`) to a route. Activating it navigates once through `Root`'s `navigation` adapter, while a modified or middle click, "Copy link" and the hover URL keep the browser's link behavior. A link tab never selects itself: pass the current route's tab as `activeKey`. `onChange` is not called for it.
