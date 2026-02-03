---
"@cube-dev/ui-kit": minor
---

Add support for boolean `true` values in color tokens. When `true` is provided for a color token (`#name`), it converts to `transparent`. This works in:
- Component styles: `#overlay: { '': true, ':hover': '#purple' }`
- Tokens prop: `<Element tokens={{ '#overlay': true }} />`
- Global config: `configure({ tokens: { '#surface': true } })`

Boolean `false` skips the token entirely (no CSS output).
