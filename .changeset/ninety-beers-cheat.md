---
"@cube-dev/ui-kit": patch
---

### Added

- Raw unit calculation: Custom units with raw CSS values (e.g., `8px`) are now calculated directly instead of using `calc()`, producing cleaner CSS output.
- Recursive unit resolution: Units can reference other custom units with automatic resolution (e.g., `{ x: '8px', y: '2x' }` → `1y` = `16px`).

### Removed

- Units `rp`, `gp`, and `sp` have been removed from default units.
