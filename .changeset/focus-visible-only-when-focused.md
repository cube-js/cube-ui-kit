---
"@cube-dev/ui-kit": patch
---

Switching between keyboard and pointer input no longer re-renders every button, checkbox, switch, select and radio on the page. Their focus state now listens for the input modality only while the element is focused, so a click after a Tab or Escape press re-renders one element instead of all of them.
