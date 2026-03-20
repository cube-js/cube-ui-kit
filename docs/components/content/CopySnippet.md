# CopySnippet

A code block with copy-to-clipboard functionality and syntax highlighting. Extends `Card`.

## When to Use

- Documentation code examples
- API response displays
- Sharing code snippets with copy functionality

## Properties

- **`code`** `string` (default: `''`) — The code to display
- **`language`** `string` (default: `'javascript'`) — Syntax highlighting language
- **`title`** `string` (default: `'Code example'`) — Accessible title
- **`prefix`** `string` (default: `''`) — Prefix text (e.g. `$`)
- **`multiline`** `boolean` — Allow multiline display
- **`nowrap`** `boolean` — Prevent line wrapping
- **`showTooltip`** `boolean` (default: `false`) — Show tooltip on hover

### Style Defaults

- `fill` — `#surface-2`
- `border` — `0`
- `radius` — `1r`
- `padding` — `0`
- `preset` — `default`

### Base Properties

Supports [Base properties](../../BaseProperties.md).

## Examples

```jsx
<CopySnippet code="const x = 1;" language="javascript" />

<CopySnippet
  code={'{\n  "key": "value"\n}'}
  language="json"
  multiline
/>
```
