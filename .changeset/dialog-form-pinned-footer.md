---
"@cube-dev/ui-kit": minor
---

`DialogForm` now renders its Submit and Cancel buttons in a pinned `Footer` beside the scrolling `Content`, instead of inside it. A long form scrolls its body while the actions stay visible; previously they scrolled away with the content and a dialog that needed pinned actions could not use `DialogForm` at all. The `<form>` now wraps both slots, so the buttons are still inside it and native submit is unchanged. This shifts the gap between the last field and the actions by the footer's own padding, so dialogs with actions are slightly taller.

`Dialog` also hands a direct-child `<form>` its flex context, so a hand-composed `Dialog > Form > Content + Footer` scrolls and pins without restating `display: flex`, `flexGrow: 1`, `height: 'min 0'` and `gap: 0` on the form. A form nested deeper is left alone.
