---
"@cube-dev/ui-kit": minor
---

Add `@properties` support for defining CSS `@property` at-rules in tasty styles.

**New features:**
- Define CSS custom properties with `@properties` in styles using token syntax (`$name`, `#name`)
- Color tokens (`#name`) auto-set `syntax: '<color>'` and default `initialValue: 'transparent'`
- Double-prefix syntax (`$$name`, `##name`) for referencing property names in transitions and animations
- `useProperty()` hook and `injector.property()` now accept token syntax
- Global properties can be configured via `configure({ properties: {...} })`

**Example:**
```jsx
// Global properties (optional)
configure({
  properties: {
    '$rotation': { syntax: '<angle>', initialValue: '0deg' },
  },
});

// Local properties in styles
const Component = tasty({
  styles: {
    '@properties': {
      '$scale': { syntax: '<number>', initialValue: 1 },
      '#accent': { initialValue: 'purple' }, // syntax: '<color>' auto-set
    },
    transform: 'rotate($rotation) scale($scale)',
    transition: '$$rotation 0.3s, $$scale 0.2s', // outputs: --rotation 0.3s, --scale 0.2s
  },
});
```
