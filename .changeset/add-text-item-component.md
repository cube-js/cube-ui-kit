---
"@cube-dev/ui-kit": minor
---

Added `TextItem` component for displaying text with automatic overflow handling and tooltips. Features include:
- Auto-tooltip on text overflow (enabled by default)
- Text highlighting with `highlight` prop for search results
- Customizable highlight styles via `highlightStyles` prop
- Case-sensitive/insensitive highlight matching
- Inherits all `Text` component props

Added `Text.Highlight` sub-component for semantic text highlighting (uses `<mark>` element).

**Breaking:** Removed `Text.Selection` in favor of `Text.Highlight`.

