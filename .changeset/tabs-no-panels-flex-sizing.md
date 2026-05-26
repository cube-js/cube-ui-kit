---
'@cube-dev/ui-kit': patch
---

`Tabs`: when there are no panels (no `Tab` content, no `Tabs.Panel` children, no `renderPanel`), the outer wrapper no longer grows or shrinks within its parent flex container — it now locks to the tab bar's intrinsic size, matching the pre-wrapper behavior of a panel-less `<Tabs>`. With panels, the wrapper still participates in parent flex layouts as before.
