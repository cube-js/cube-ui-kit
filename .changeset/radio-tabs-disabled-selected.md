---
'@cube-dev/ui-kit': patch
---

`RadioGroup` with `type="tabs"`: the selected tab no longer looks active when the group is disabled. The selected-tab override now dims fill (`#surface` → `#surface.6`) and text (`#dark` → `#dark.3`) and drops `$item-shadow` for the `tabs & selected & disabled` state.
