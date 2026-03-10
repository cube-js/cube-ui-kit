# PrismCode

Syntax-highlighted code block using Prism. Supports multiple languages.

## When to Use

- Documentation code examples
- Displaying code in UI
- Technical content with syntax highlighting

## Properties

- **`code`** `string` (default: `''`) — The code snippet to highlight
- **`language`** `string` (default: `'javascript'`) — Language for syntax highlighting (`javascript`, `typescript`, `json`, `yaml`, `bash`, `sql`, `css`, `html`, etc.)

### Style Defaults

- `margin` — `0`
- `padding` — `0`
- `overflow` — `auto`
- `scrollbar` — `styled`

### Base Properties

Supports [Base properties](../../BaseProperties.md).

## Examples

```jsx
<PrismCode code="const x = 1;" language="javascript" />

<PrismCode
  code={'function hello() {\n  return "world";\n}'}
  language="typescript"
/>
```
