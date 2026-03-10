# Flex

A flexbox layout container. Arranges children in a row by default with no predefined gap.

## When to Use

- One-dimensional layouts (row or column)
- Aligning and distributing space between items
- When you need more control than `Space` provides

## Properties

No component-specific props. Use style props directly.

### Style Defaults

- `display` — `flex`
- `flow` — `row`

### Base Properties

Supports [Base properties](../../BaseProperties.md).

## Examples

### Row with gap

```jsx
<Flex gap="1x">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</Flex>
```

### Column layout

```jsx
<Flex flow="column" gap="2x">
  <Title level={3}>Section</Title>
  <Paragraph>Content</Paragraph>
</Flex>
```

### Space between

```jsx
<Flex placeContent="space-between">
  <Text>Left</Text>
  <Text>Right</Text>
</Flex>
```
