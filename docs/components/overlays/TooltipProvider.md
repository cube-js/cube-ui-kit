# TooltipProvider

A convenience wrapper that combines `TooltipTrigger` and `Tooltip` into a single component. The simplest way to add tooltips.

## When to Use

- Simple tooltips with minimal configuration
- Wrapping elements that need tooltip on hover
- When separate `TooltipTrigger` + `Tooltip` would be verbose

## Properties

- **`title`** `ReactNode` — Tooltip content
- **`tooltipStyles`** `Styles` — Custom styles for the tooltip
- **`width`** `string` — Tooltip width
- **`isDisabled`** `boolean` — Disable the tooltip

Inherits all TooltipTrigger properties: `placement`, `offset`, `crossOffset`, `delay`, etc.

### Base Properties

Supports [Base properties](../../BaseProperties.md).

## Examples

### Simple tooltip

```jsx
<TooltipProvider title="Help text">
  <Button>Hover me</Button>
</TooltipProvider>
```

### Render function children

```jsx
<TooltipProvider title="Click to copy">
  {(triggerProps, ref) => (
    <span {...triggerProps} ref={ref}>Custom trigger</span>
  )}
</TooltipProvider>
```
