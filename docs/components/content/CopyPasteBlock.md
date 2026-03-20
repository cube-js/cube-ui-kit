# CopyPasteBlock

A block that displays a value with copy-to-clipboard functionality. Supports paste via click/focus.

## When to Use

- API keys or tokens display
- One-time codes or passwords
- Values users need to copy or paste

## Properties

- **`title`** `string` — Label for the block
- **`value`** `string` (default: `''`) — The value to display and copy
- **`placeholder`** `ReactNode` — Placeholder when value is empty
- **`size`** `'small' | 'medium' | 'large'` (default: `'medium'`) — Block size

### Style Defaults

- `fill` — `#surface-2`
- `radius` — `1r`
- `cursor` — pointer
- `preset` — `t3` (switches to `t2` when `size="large"`)
- `height` — `5x` (`4x` for small, `6x` for large)

### Base Properties

Supports [Base properties](../../BaseProperties.md).

## Examples

```jsx
<CopyPasteBlock title="API Key" value={apiKey} />

<CopyPasteBlock title="Token" value={token} size="small" />
```
