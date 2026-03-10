# Card

A container with rounded corners, border, and padding. Renders as a `<div role="region">`.

## When to Use

- Grouping related information
- Content containers in dashboards
- Highlighting standalone content blocks

## Properties

No component-specific props. Use style props directly.

### Style Defaults

- `display` — `block`
- `flow` — `column`
- `radius` — `(1cr + 1bw)`
- `fill` — `#white`
- `border` — `#border`
- `padding` — `1.5x`
- `preset` — `t3`

### Base Properties

Supports [Base properties](../../BaseProperties.md).

## Examples

```jsx
<Card>
  <Title level={3}>Card Title</Title>
  <Paragraph>Card content goes here.</Paragraph>
</Card>

<Card padding="2x" fill="#surface">
  Styled card with custom padding and background
</Card>
```
