# Panel

> **Deprecated**: Use [Layout](../content/Layout.md) with `Layout.Panel` instead. Layout.Panel provides collapsible side panels with resizing, transitions, overlay modes, and automatic content adjustment — all features that Panel lacks.

A section container with optional stretched, floating, or card styling. Renders as `<section>` with an absolute-positioned inner scrollable area.

## When to Use

- Sidebar or drawer content
- Modal/dialog content areas
- Card-styled panels with border and radius

## Properties

- **`isStretched`** `boolean` — Fill available space (absolute positioning, `inset: 0`)
- **`isCard`** `boolean` — Card appearance with border (`1bw`) and radius (`1r`)
- **`isFloating`** `boolean` — Floating overlay positioning (absolute)
- **`isFlex`** `boolean` — Use flex layout instead of grid for the inner element
- **`innerStyles`** `Styles` — Styles applied to the inner content area
- **`extra`** `ReactNode` — Content rendered outside the inner scrollable area
- **`placeContent`** `string` — Content placement for the inner area
- **`placeItems`** `string` — Items placement for the inner area
- **`gridColumns`** `string` — Grid columns for the inner area
- **`gridRows`** `string` — Grid rows for the inner area
- **`flow`** `string` — Flow direction for the inner area
- **`gap`** `string` — Gap for the inner area

### Style Defaults

- `display` — `block`
- `position` — `relative` (switches to `absolute` when `isStretched` or `isFloating`)
- `flexGrow` — `1`
- `radius` — `0` (switches to `1r` when `isCard`)
- `border` — `0` (switches to `1bw` when `isCard`)

### Base Properties

Supports [Base properties](../../BaseProperties.md).

## Examples

### Basic panel

```jsx
<Panel>
  <Title level={3}>Panel Content</Title>
  <Paragraph>Content goes here</Paragraph>
</Panel>
```

### Card-styled panel

```jsx
<Panel isCard padding="1x">
  Card-styled panel with border
</Panel>
```

### Stretched sidebar

```jsx
<Panel isStretched fill="#surface">
  Fills its parent container
</Panel>
```
