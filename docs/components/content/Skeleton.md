# Skeleton

A skeleton loading indicator with preset layouts. Composes `Placeholder` components to mimic content structure.

## When to Use

- Loading states for complex layouts
- Progressive content loading
- Replacing spinners with content-aware placeholders

## Properties

- **`layout`** `'page' | 'content' | 'topbar' | 'menu' | 'stats' | 'tabs' | 'table' | 'chart'` (default: `'page'`) — Preset layout pattern
- **`lines`** `number` (default: `5`) — Number of placeholder lines (for page, content, menu, tabs layouts)
- **`rows`** `number` (default: `5`) — Number of table rows (for table layout)
- **`columns`** `number` (default: `5`) — Number of columns (for table and chart layouts)
- **`tabs`** `number` (default: `3`) — Number of tabs (for tabs layout)
- **`cards`** `number` (default: `3`) — Number of stat cards (for stats layout)
- **`isStatic`** `boolean` (default: `false`) — Disable shimmer animation

### Base Properties

Supports [Base properties](../../BaseProperties.md).

## Examples

```jsx
<Skeleton layout="content" lines={5} />

<Skeleton layout="page" />

<Skeleton layout="table" rows={5} columns={4} />

<Skeleton layout="chart" columns={8} />
```
