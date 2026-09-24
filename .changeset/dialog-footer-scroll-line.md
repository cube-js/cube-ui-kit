---
"@cube-dev/ui-kit": minor
---

`Dialog`'s `Footer` now draws a top border while the dialog's `Content` scrolls, and none while it fits. The footer carries a `content-overflow` modifier for as long as the body overflows, tracked through resizes and content changes, so the line separates the actions from a body that continues beneath them without cluttering a short dialog. Set `border` in the footer's own styles to keep the line always or never draw it. `Content` now renders `data-id="Content"`, which is how the dialog finds its body.
