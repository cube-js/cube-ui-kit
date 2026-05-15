---
'@cube-dev/ui-kit': patch
---

**Special theme**: `special`-variant components (`Button`, `ItemAction`, `ItemButton`, etc.) now render consistently across light, dark, and high-contrast schemes. Previously, dark mode inverted the brand-purple pressed/focused border (`#purple-text`, `mode: 'auto'`) and the PRIMARY disabled chip (`#primary-disabled`, scheme-adaptive neutral) — both visibly different from the light-mode design.

The fix is a new standalone `specialTheme` in `src/tokens/palette.ts` (not extended from `defaultTheme`) whose tokens are all `mode: 'fixed'`, so the resolved OKHSL is identical in every scheme. It emits `#special-surface`, `#special-accent-fill`, `#special-accent-fill-hover`, `#special-accent-fill-text`, `#special-accent-text`, `#special-accent-disabled-surface`, and `#special-accent-disabled-surface-text`. The PRIMARY disabled state now uses a brand-tinted chip (`#special-accent-disabled-surface`) instead of a neutral grey, and OUTLINE's disabled fill no longer mirrors the `pressed` state. The legacy `#fixed-dark` and `#fixed-primary-text` aliases keep working — they now resolve to `#special-surface` and `#special-accent-text` respectively. Validation borders (`#danger-text` / `#success-text`) intentionally stay scheme-adaptive.
