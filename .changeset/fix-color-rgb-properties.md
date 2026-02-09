---
"@cube-dev/ui-kit": patch
---

Fix color RGB custom property generation and @property syntax

- Fix `convertColorChainToRgbChain` to correctly extract RGB values from `rgb(var(--name-color-rgb) / alpha)` patterns. Previously, `--current-color-rgb` was incorrectly set to the full `rgb()` expression instead of just the `var(--name-color-rgb)` reference.
- Fix `INTERNAL_PROPERTIES` syntax: change invalid `<number> <number> <number>` syntax to valid `<number>+` for RGB triplet properties.
- Automatically create companion `-rgb` custom properties when registering color `@property` definitions. Color properties (e.g., `#white`) now automatically get their `--white-color-rgb` companion with proper syntax and initial value derived from the color's initial value.
