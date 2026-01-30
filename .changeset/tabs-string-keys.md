---
"@cube-dev/ui-kit": patch
---

Update Tabs component API to use `string` type instead of `Key` for all key-related props and callbacks. This aligns the public API with the internal implementation which already converts keys to strings for React Aria compatibility.
