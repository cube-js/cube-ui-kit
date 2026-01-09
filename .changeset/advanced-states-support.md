---
'@cube-dev/ui-kit': minor
---

Add advanced states support with `@` prefix in tasty styles. State keys starting with `@` compile into CSS at-rules and contextual conditions, enabling media queries (`@media`), container queries (`@(...)`), root states (`@root`), sub-element own states (`@own`), and entry animations (`@starting`). Advanced states can be combined with logical operators (`&`, `|`, `!`, `^`) and used anywhere regular state keys are supported, including sub-elements. Define reusable state aliases globally via `configure({ states })` or locally per component.

