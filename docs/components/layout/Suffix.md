# Suffix

An absolutely positioned suffix slot, typically used inside input-like components to show icons or actions on the right.

## When to Use

- Input suffixes (clear button, unit labels)
- Right-aligned decorations in form fields

## Properties

- **`onWidthChange`** `Function` — Callback when suffix width changes (used for input padding calculation)
- **`outerGap`** `CSSProperties['gap']` (default: `'1bw'`) — Gap between suffix and the component edge

### Style Defaults

- `position` — `absolute`
- `display` — `grid`
- `flow` — `column`
- `gap` — `0`
- `placeItems` — `center`
- `color` — `#dark-02`

### Base Properties

Supports [Base properties](../../BaseProperties.md).

## Examples

```jsx
<Block position="relative">
  <TextInput placeholder="Search..." />
  <Suffix>
    <Button size="small" iconOnly>
      <Icon icon={IconX} />
    </Button>
  </Suffix>
</Block>
```
