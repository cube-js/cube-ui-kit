---
"@cube-dev/ui-kit": patch
---

fix(tasty): preserve sub-element components when wrapping with `tasty(Component, { ... })`

Previously, wrapping a component that had `elements` defined (compound sub-components like `Component.Icon`, `Component.Label`) with `tasty()` would lose those sub-element references. Now static properties are copied from the source component to the wrapper, so `StyledComponent.Icon` works correctly after `const StyledComponent = tasty(Component, { ... })`.
