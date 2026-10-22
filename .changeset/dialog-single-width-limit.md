---
'@cube-dev/ui-kit': minor
---

`Dialog`: a `width` with a single value, such as `width="520px"` or `width={600}`, is now the dialog's preferred width and keeps its type's maximum, so a fixed-width dialog no longer overflows a phone screen. Modals, popovers and fullscreen dialogs stay inside the new `$dialog-max-size` token, and trays, takeovers and panels inside the viewport. A width that sets its own minimum or maximum is applied as given. Up to 700px of screen width, dialogs now keep a `2x` gutter on each side instead of `4x`, so they use more of a phone screen.
