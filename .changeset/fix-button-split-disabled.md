---
"@cube-dev/ui-kit": patch
---

Fix `Button` disabled state resolution in `Button.Split` context.

- Replace `??` chain with `||` so that `isLoading={false}` no longer blocks `splitContext.isDisabled` inheritance
- Ensure `splitContext.isDisabled` always wins over child props (a disabled split button should disable all children)
- Fix edge case where `isDisabled={false}` with `isLoading={true}` incorrectly resulted in a clickable loading button
