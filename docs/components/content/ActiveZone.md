# ActiveZone

A focusable, clickable zone with hover and focus states. Used for making non-button elements interactive.

## When to Use

- Clickable cards or list items
- Custom interactive regions
- Wrapping content that should respond to click/hover/focus

## Properties

- **`label`** `string` — Accessible label for screen readers
- **`onClick`** `MouseEventHandler` — Click handler
- **`isDisabled`** `boolean` — Disables interaction, reduces opacity

### Style Defaults

- `display` — `inline-grid`
- `position` — `relative`
- `opacity` — `1` (switches to `0.4` when disabled)
- `transition` — `theme`

### Base Properties

Supports [Base properties](../../BaseProperties.md).

## Examples

```jsx
<ActiveZone label="Open details" onClick={() => openDetails()}>
  <Card>
    <Title level={4}>Clickable Card</Title>
    <Paragraph>This whole card is clickable</Paragraph>
  </Card>
</ActiveZone>
```
