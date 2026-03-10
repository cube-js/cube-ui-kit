# ButtonGroup

A container for grouping buttons with consistent spacing. Extends `Space` and inherits all its defaults.

## When to Use

- Grouping related actions (Save/Cancel)
- Button bars and toolbars

## Properties

Inherits all Space properties.

### Style Defaults

Inherits Space defaults:

- `display` — `flex`
- `gap` — `1x`
- `flow` — `row`
- `placeItems` — `center stretch`
- `gridArea` — `buttonGroup`

### Base Properties

Supports [Base properties](../../BaseProperties.md).

## Examples

### Horizontal group

```jsx
<Button.Group>
  <Button>Save</Button>
  <Button type="secondary">Cancel</Button>
</Button.Group>
```

### Vertical group

```jsx
<Button.Group direction="vertical">
  <Button>Option 1</Button>
  <Button>Option 2</Button>
</Button.Group>
```
