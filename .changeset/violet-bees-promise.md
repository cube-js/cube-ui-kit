---
"@cube-dev/ui-kit": minor
---

Add dynamic icon support to Button and Item components. The `icon` and `rightIcon` props now support:
- `true` - renders an empty slot (reserves space but shows nothing)
- Function `({ loading, selected, ...mods }) => ReactNode | true` - dynamically renders icon based on component modifiers

Also made `Mods` type generic for better type definitions: `Mods<{ loading?: boolean }>` instead of extending interface.
