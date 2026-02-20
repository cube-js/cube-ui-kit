---
"@cube-dev/ui-kit": minor
---

**Breaking change:** Renamed design tokens used by the tasty style system:
- `$leaf-sharp-radius` → `$sharp-radius`
- `$card-shadow` → `$shadow` (in shadow.ts default and component styles)
- `$fade-width` removed — fade now defaults to `calc(2 * var(--gap))`

**New:** Tasty now ships with built-in defaults for core design tokens, so the style system works out of the box without a project-level token setup:
- CSS `@property` registrations with initial values for `$gap` (4px), `$radius` (6px), `$border-width` (1px), `$outline-width` (3px), `$transition` (80ms), `$sharp-radius` (0px), `$bold-font-weight` (700)
- Default `:root` variables for `--font`, `--monospace-font`, and `--border-color` (currentColor)

These defaults are overridden by any tokens the consuming project sets on `:root`.
