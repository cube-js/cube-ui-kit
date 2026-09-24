---
"@cube-dev/ui-kit": minor
---

`DialogForm` now renders its Submit and Cancel buttons in a pinned `Footer` beside the scrolling `Content`, instead of inside it. A long form scrolls its body while the actions stay visible; previously they scrolled away with the content and a dialog that needed pinned actions could not use `DialogForm` at all. The `<form>` now wraps both slots, so the buttons are still inside it and native submit is unchanged. The actions now sit as far below the last field as in any other dialog footer, 8px further than before.

`Dialog` also hands a direct-child `<form>` its flex context and cancels the form's own spacing between its children, so a hand-composed `Dialog > Form > Content + Footer` scrolls and pins without restating `display: flex`, `flexGrow: 1`, `height: 'min 0'` and `gap: 0` on the form. A form nested deeper is left alone.
