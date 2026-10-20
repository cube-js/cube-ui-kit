---
"@cube-dev/ui-kit": minor
---

Add `hideOnClose` to `Layout.Panel` (outside dialog mode): a closed panel is hidden instead of unmounting its content, so the content keeps its state, such as an unsent draft or a request in flight, until the panel reopens. The hidden panel takes no space, no focus and no resize handle.
