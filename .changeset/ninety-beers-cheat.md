---
"@cube-dev/ui-kit": minor
---

### Added

- Raw unit calculation: Custom units with raw CSS values (e.g., `8px`) are now calculated directly instead of using `calc()`, producing cleaner CSS output.
- Recursive unit resolution: Units can reference other custom units with automatic resolution (e.g., `{ x: '8px', y: '2x' }` → `1y` = `16px`).

### Changed

- Default units now use raw pixel values instead of CSS variables:
  - `x`: `8px` (was `var(--gap)`)
  - `r`: `6px` (was `var(--radius)`)
  - `cr`: `10px` (was `var(--card-radius)`)
  - `bw`: `1px` (was `var(--border-width)`)
  - `ow`: `3px` (was `var(--outline-width)`)
  
  To restore CSS variable behavior, configure units explicitly: `configure({ units: { x: 'var(--gap)' } })`.

### Removed

- Units `rp`, `gp`, and `sp` have been removed from default units.
