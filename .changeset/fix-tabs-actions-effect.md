---
"@cube-dev/ui-kit": patch
---

Fix unnecessary re-renders in Tabs component:
- Fix actions width measurement effect dependency
- Stabilize `getAllowedDropOperations` callback in drag/drop hooks

Fix ItemButton missing hover/press/focus states by not overriding actionProps.mods
