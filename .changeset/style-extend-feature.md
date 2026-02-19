---
"@cube-dev/ui-kit": minor
---

Add style extend functionality to `tasty` style system, enabling state map merging, `@inherit` keyword, and property reset semantics.

**New features:**
- **State map extension mode**: When extending a component with a state map that doesn't include a `''` key, parent states are preserved and new states are appended
- **State map replace mode**: When a state map includes a `''` key, it replaces all parent states (existing behavior)
- **`@inherit` keyword**: Pull parent state values into child state maps, supporting both repositioning (extend mode) and cherry-picking (replace mode)
- **`null` reset**: Use `null` as a property value to discard parent values and let recipe values fill in
- **`false` tombstone**: Use `false` to block a property entirely, preventing both parent and recipe values

**Behavior changes:**
- Sub-element handling now uses strict equality (`=== null`) instead of loose equality (`== null`) for better semantic clarity
