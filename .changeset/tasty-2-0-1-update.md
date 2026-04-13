---
"@cube-dev/ui-kit": minor
---

Update `@tenphi/tasty` to `2.0.1`.

- Unified hash-based class names across all rendering environments for stable cross-environment style deduplication.
- New `presets` and `globalStyles` options in `configure()`.
- Default `letterSpacing` in typography presets changed from `'0'` to `'normal'`.
- Simplified GC to touch-count-driven mechanism — no longer requires `auto: true` configuration.
- Fixed overlapping and duplicate CSS selectors produced by the condition simplifier.

Migrated: removed deprecated `gc: { auto: true }` from `configure()` call (GC now runs automatically).
