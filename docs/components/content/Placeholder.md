# Placeholder

A loading placeholder with optional shimmer animation. Used for skeleton-style loading states.

## When to Use

- Content loading states
- Skeleton screens
- Placeholder for images or text while loading

## Properties

- **`size`** `string` (default: `'2x'`) — Placeholder height
- **`circle`** `boolean` — Circular shape with `aspect-ratio: 1/1` (e.g. for avatars)
- **`isStatic`** `boolean` — Disable shimmer animation

### Style Defaults

- `display` — `block`
- `fill` — `#dark.10`
- `height` — `2x`
- `radius` — `1r` (switches to `round` when `circle`)
- `opacity` — `.35`

### Base Properties

Supports [Base properties](../../BaseProperties.md).

## Examples

```jsx
<Placeholder width="200px" height="24px" />

<Placeholder circle size="4x" />

<Placeholder isStatic width="100%" />
```
