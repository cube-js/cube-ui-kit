---
'@cube-dev/ui-kit': minor
---

Upgrade `@tenphi/tasty` from 0.15.3 to 1.1.0.

**Breaking changes:**

- Font CSS custom properties renamed: `--font` → `--font-sans`, `--monospace-font` → `--font-mono`
- Preset modifier syntax now uses `/` separator (e.g., `'t3 / strong'` instead of `'t3 strong'`)
- Removed standalone `strong` and `em` typography presets (use modifiers instead: `'inherit / bold'`, `'inherit / italic'`)
- The `1fs` unit is no longer supported; replaced with `1em`
