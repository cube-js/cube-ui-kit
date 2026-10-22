---
'@cube-dev/ui-kit': minor
---

`Dialog`: a `width` with a single value, such as `width="520px"` or `width={600}`, is now the dialog's preferred width and keeps its type's maximum, so a fixed-width dialog no longer overflows a phone screen. Modals, popovers and fullscreen dialogs stay inside the new `$dialog-max-size` token, trays inside their shell, and takeovers and panels inside the viewport. A width that sets its own minimum or maximum is applied as given. Up to 700px of screen width, modals, popovers and fullscreen dialogs now keep a `2x` gutter on each side instead of `4x`, so they use more of a phone screen. On a narrow screen a default-size tray uses its whole 90vw shell. The `Modal` shell no longer adds a gutter of its own, so content other than a `Dialog` sets its own width.
