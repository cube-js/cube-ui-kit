---
"@cube-dev/ui-kit": minor
---

Add `#current` color token that maps to CSS `currentcolor` keyword. Supports opacity using `color-mix`:

- `#current` → `currentcolor`
- `#current.5` → `color-mix(in oklab, currentcolor 50%, transparent)`
- `#current.$opacity` → `color-mix(in oklab, currentcolor calc(var(--opacity) * 100%), transparent)`

Note: `#current` is a reserved token and cannot be overridden via `configure({ tokens: {...} })`. Using `#current` to define other color tokens will log a warning and be ignored.
