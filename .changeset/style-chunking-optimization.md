---
"@cube-dev/ui-kit": minor
---

Implement style chunking optimization for improved CSS reuse and performance. Styles are now split into logical chunks (appearance, font, dimension, container, scrollbar, position, misc, and subcomponents), each with its own cache key and CSS class. This enables better CSS reuse across components and reduces CSS output size, especially for components with many variants like Button and Item. The optimization is fully backward compatible - elements still receive className(s) as before, but now with improved caching granularity.

**New exports:**
- `useStyles` hook - Generate CSS classes for element-scoped styles with chunking support
- `useGlobalStyles` hook - Inject global styles for a given selector
- Chunk utilities: `CHUNK_NAMES`, `STYLE_TO_CHUNK`, `categorizeStyleKeys` (for advanced use cases)
