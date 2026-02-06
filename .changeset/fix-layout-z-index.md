---
"@cube-dev/ui-kit": minor
---

- Fix Layout component z-index stacking by using DOM order instead of explicit z-index values
- Add `doNotOverflow` prop to Layout component to control overflow behavior
- **BREAKING**: Layout root element now defaults to `overflow: visible` instead of `overflow: hidden`. Use `doNotOverflow` prop to restore the previous behavior.