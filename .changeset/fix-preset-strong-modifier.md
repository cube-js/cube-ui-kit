---
"@cube-dev/ui-kit": patch
---

**Fix:** `preset="strong"` (and other modifier-only presets like `"italic"`, `"icon"`, `"tight"`) now correctly inherits typography instead of resolving to `--strong-*` CSS variables. When no preset name is provided, the base preset defaults to `inherit`.
