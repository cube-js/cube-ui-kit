# Space

A flex container that adds consistent gap between children. Supports horizontal (default) and vertical directions.

## When to Use

- Spacing between buttons, icons, or inline elements
- Vertical or horizontal stacks with consistent gaps
- Replacing manual margin hacks with semantic spacing

## Properties

- **`direction`** `'vertical' | 'horizontal'` (default: `'horizontal'`) — Layout direction

### Style Defaults

- `display` — `flex`
- `gap` — `1x`
- `flow` — `row` (switches to `column` when `direction="vertical"`)
- `placeItems` — `center stretch` (switches to `stretch` when vertical)

### Base Properties

Supports [Base properties](../../BaseProperties.md).

## Examples

### Horizontal (default)

```jsx
<Space>
  <Button>Save</Button>
  <Button>Cancel</Button>
</Space>
```

### Vertical with custom gap

```jsx
<Space direction="vertical" gap="2x">
  <Title level={3}>Title</Title>
  <Paragraph>Description</Paragraph>
</Space>
```
