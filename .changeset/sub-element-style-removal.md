---
"@cube-dev/ui-kit": minor
---

Allow passing `false` to sub-element keys in tasty styles to remove all styles for that sub-element when extending/wrapping styled components.

```tsx
const CustomTable = tasty(Table, {
  Cell: false, // Removes all Cell styles from the base component
});
```

Nullish values (`null`, `undefined`) are treated as ignored (no change to styles).
