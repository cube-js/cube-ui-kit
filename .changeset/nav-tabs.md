---
'@cube-dev/ui-kit': minor
---

Add `NavTabs`: navigation between routes that looks like `Tabs`. It renders a navigation landmark with a list of real links, marks the one `activeKey` names with `aria-current="page"`, and routes each click through `Root`'s `navigation` adapter, while a modified or middle click, "Copy link" and the hover URL keep the browser's link behavior. It takes `Tabs`' `placement`, `tabListPadding`, `barStyles` and `tabListStyles`. Use it instead of panel-less `Tabs` that navigate in `onChange`.
