---
"@cube-dev/ui-kit": minor
---

Add `@properties` support for defining CSS `@property` at-rules in tasty styles.

**New features:**
- Define CSS custom properties with `@properties` in styles using token syntax (`$name`, `#name`)
- Color tokens (`#name`) auto-set `syntax: '<color>'` and default `initialValue: 'transparent'`
- Double-prefix syntax (`$$name`, `##name`) for referencing property names in transitions and animations
- `useProperty()` hook and `injector.property()` now accept token syntax

**Example:**
```jsx
const Component = tasty({
  styles: {
    '@properties': {
      '$rotation': { syntax: '<angle>', initialValue: '0deg' },
      '#accent': { initialValue: 'purple' }, // syntax: '<color>' auto-set
    },
    transform: 'rotate($rotation)',
    transition: '$$rotation 0.3s', // outputs: --rotation 0.3s
  },
});
```
