---
'@cube-dev/ui-kit': patch
---

Internal: migrated every color reference in `src/data/item-themes.ts` to use Glaze palette tokens directly, removing all dependencies on the legacy alias layer in `src/tokens/colors.ts` (e.g. `#dark` → `#surface-text`, `#dark-02` → `#surface-text-soft`, `#primary-text` → `#primary-accent-text`, `#primary-hover` → `#primary-accent-surface-hover`, `#primary` brand fill → `#primary-accent-surface`, `#light` → `#surface-3`, `#clear` → `transparent`, and the matching `danger` / `success` / `warning` / `note` ramps). Resolved values are unchanged — every alias was a direct re-export of the same Glaze token — so component visuals are identical. The legacy aliases in `colors.ts` are still exported for backwards compatibility with consumer code.
