---
"@cube-dev/ui-kit": patch
---

Reduce wide ItemTable and DataTable scrolling work by rendering the visible body-column window. Keep headers, pinned and structural columns, row naming, wrapping and custom cells mounted to preserve keyboard access, menus, state and measured row heights. Preserve complete layout for custom body styling, arbitrary cell DOM props and explicitly disabled virtualization.
