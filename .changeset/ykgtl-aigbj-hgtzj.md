---
"@cube-dev/ui-kit": minor
---

### Added

- Predefined tokens in `configure()`: Define reusable tokens (`$name` for values, `#name` for colors) that are replaced during style parsing. Unlike component-level `tokens` prop, predefined tokens are baked into the generated CSS for better performance and consistency.

```ts
configure({
  tokens: {
    $spacing: '2x',
    '$card-padding': '4x',
    '#accent': '#purple',
  },
});

// Use in styles - tokens are replaced at parse time
const Card = tasty({
  styles: {
    padding: '$card-padding',  // → calc(4 * var(--gap))
    fill: '#accent',           // → var(--purple-color)
  },
});
```

- Plugins can now provide predefined tokens via the `tokens` property in `TastyPlugin`.
