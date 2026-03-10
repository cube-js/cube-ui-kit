# Result

An empty state or result display with icon, title, and optional content. Supports status presets with built-in icons.

## When to Use

- Empty states (no data, no results)
- Success/error feedback after actions
- 404, 403, 500 error pages
- Informational messages

## Properties

- **`status`** `'success' | 'error' | 'info' | 'warning' | 404 | 403 | 500` (default: `'info'`) — Predefined status with corresponding icon
- **`title`** `ReactNode` — Main title text
- **`subtitle`** `ReactNode` — Secondary text below title
- **`icon`** `ReactNode` — Custom icon (overrides status icon)
- **`isCompact`** `boolean` — Compact horizontal layout

### Style Defaults

- `display` — `flex` (switches to `grid` when `isCompact`)
- `flow` — `column`
- `placeContent` — `center` (switches to `start` when `isCompact`)
- `placeItems` — `center` (switches to `start` when `isCompact`)
- `gap` — `3x` (switches to `2x 1x` when `isCompact`)
- `padding` — `6x 4x` (switches to `0` when `isCompact`)
- `textAlign` — `center` (switches to `left` when `isCompact`)

### Base Properties

Supports [Base properties](../../BaseProperties.md).

## Examples

```jsx
<Result status="success" title="Saved" subtitle="Your changes have been saved." />

<Result status="error" title="Something went wrong" subtitle="Please try again." />

<Result status={404} title="Page not found" />

<Result status="info" title="No items" subtitle="Add your first item to get started.">
  <Button>Add Item</Button>
</Result>
```
