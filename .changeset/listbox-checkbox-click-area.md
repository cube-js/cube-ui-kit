---
"@cube-dev/ui-kit": patch
---

Fix checkbox click area regressions in checkable ListBox and Tree.

- **ListBox:** The `IconSwitch` slot now stretches to fill its parent grid cell, restoring the full-cell click target for checkable multiple-selection options.
- **Tree:** The checkbox wrapper now stretches to the full row height and toggles on click across the entire wrapper area (not just the inner checkbox box).
