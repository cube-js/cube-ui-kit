---
'@cube-dev/ui-kit': patch
---

Unified the `primary`-type fill ramp across all themes. `DANGER`, `SUCCESS`, `WARNING`, `NOTE` and `SPECIAL` now follow the same monotonically-darkening `accent-surface` → `-2` → `-3` (default → hover → pressed) ramp already used by the default theme, so contrast against the app background increases consistently with each interaction step in both light and dark schemes. Previously the colored themes used a `default` → `-hover` → `default` shape (no press feedback) and the special theme used a separate `accent-fill` / `accent-fill-hover` / `accent-fill` ramp.

The special theme palette was renamed for consistency: `accent-fill` → `accent-surface`, `accent-fill-text` → `accent-surface-text`, `accent-fill-hover` → `accent-surface-hover`, plus new `accent-surface-2` and `accent-surface-3` steps. The legacy `accent-surface-hover` token is retained for the `#primary-hover` / `#<theme>-hover` color aliases consumed by external code.

**Breaking (special theme tokens only):** `#special-accent-fill`, `#special-accent-fill-text`, and `#special-accent-fill-hover` were renamed to `#special-accent-surface`, `#special-accent-surface-text`, and `#special-accent-surface-hover` respectively. External consumers referencing these by name should update their references.
