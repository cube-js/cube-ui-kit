# Text

A flexible text component for inline or block text. Renders as `<span>` by default with support for typography presets, ellipsis, and semantic variants.

## When to Use

- Inline text within other components
- Labels, captions, and short text content
- Text that needs ellipsis truncation or custom typography

## Properties

- **`as`** `TagName` (default: `'span'`) — HTML element to render
- **`monospace`** `boolean` — Use monospace font
- **`ellipsis`** `boolean` — Truncate overflow with ellipsis (sets `display: block`, `nowrap`, `overflow: hidden`)
- **`nowrap`** `boolean` — Prevent text wrapping
- **`block`** `boolean` — Display as block element
- **`italic`** `string` — Font style (maps to `fontStyle`)
- **`weight`** `string | number` — Font weight (maps to `fontWeight`)
- **`transform`** `string` — Text transform (maps to `textTransform`)

### Style Defaults

- `display` — `inline` (switches to `block` when `ellipsis` or `block`)
- `margin` — `0`
- `padding` — `0`

### Base Properties

Supports [Base properties](../../BaseProperties.md).

### Variants

- `Text.Minor` — Muted/secondary text color
- `Text.Danger` — Error or destructive text
- `Text.Success` — Success or positive text
- `Text.Strong` — Bold emphasis
- `Text.Emphasis` — Italic emphasis
- `Text.Placeholder` — Placeholder-style text
- `Text.Highlight` — Highlighted text (mark element)

## Examples

```jsx
<Text>Inline text</Text>

<Text ellipsis style={{ maxWidth: 200 }}>
  Long text that will be truncated with ellipsis
</Text>

<Text.Minor>Secondary information</Text.Minor>

<Text.Danger>Error message</Text.Danger>
```
