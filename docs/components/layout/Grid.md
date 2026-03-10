# Grid

A CSS Grid layout container. Arranges children in a grid with configurable columns and rows.

## When to Use

- Two-dimensional layouts (rows and columns)
- Complex layouts requiring precise placement
- Responsive grids with different breakpoint configurations

## Properties

- **`template`** `string` — Shorthand for `gridTemplate`
- **`columns`** `string` — Shorthand for `gridColumns` (e.g. `"1fr 1fr"`, `"auto 1fr"`)
- **`rows`** `string` — Shorthand for `gridRows`
- **`areas`** `string` — Shorthand for `gridAreas`

### Style Defaults

- `display` — `grid`
- `flow` — `row`

### Base Properties

Supports [Base properties](../../BaseProperties.md).

## Examples

### Two columns

```jsx
<Grid columns="1fr 1fr" gap="1x">
  <Block>Column 1</Block>
  <Block>Column 2</Block>
</Grid>
```

### Three-column layout

```jsx
<Grid columns="auto 1fr auto" gap="2x">
  <Text>Label</Text>
  <Text>Value</Text>
  <Text>Unit</Text>
</Grid>
```
