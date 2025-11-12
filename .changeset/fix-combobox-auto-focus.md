---
"@cube-dev/ui-kit": patch
---

Fix ComboBox auto-focus behavior when using `allowsCustomValue`. The component now correctly maintains focus on the first filtered item while typing, allowing Enter key selection to work properly. The focus is automatically re-established when the currently focused item is filtered out of the list. Additionally, the refocus logic now properly verifies that the selected item exists in the filtered collection before attempting to focus on it, preventing focus on non-existent keys.
