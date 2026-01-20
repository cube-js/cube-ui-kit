---
'@cube-dev/ui-kit': minor
---

**Breaking:** Enhanced `textOverflow` style handler with automatic setup for text truncation. Previously, `textOverflow: 'ellipsis'` only set `text-overflow: ellipsis` (which doesn't work without `overflow: hidden`). Now it automatically adds `overflow: hidden` and `white-space: nowrap` for single-line ellipsis, making it actually functional.

New features:
- `textOverflow: 'ellipsis'` - single-line truncation with ellipsis (now works correctly)
- `textOverflow: 'ellipsis / 3'` - multi-line truncation (3 lines) with `-webkit-line-clamp`
- `textOverflow: 'clip'` - single-line clip with `overflow: hidden`

The `displayStyle` handler now manages `display`, `hide`, `textOverflow`, `overflow`, and `whiteSpace` together. User-provided `overflow` and `whiteSpace` values take precedence over auto-generated ones from `textOverflow`.
