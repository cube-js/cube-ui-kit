---
"@cube-dev/ui-kit": minor
---

`DialogForm` now renders its Submit and Cancel buttons in a pinned `Footer` beside the scrolling `Content`, instead of inside it. A long form scrolls its body while the actions stay visible; previously they scrolled away with the content and a dialog that needed pinned actions could not use `DialogForm` at all. The `<form>` now wraps both slots, so the buttons are still inside it and native submit is unchanged. The actions now sit as far below the last field as in any other dialog footer, 8px further than before.

A `Form` placed directly in a `Dialog` now lays itself out as the dialog's slot column, so a hand-composed `Dialog > Form > Content + Footer` scrolls and pins without restating `display: flex`, `flexGrow: 1`, `height: 'min 0'` and `gap: 0` on the form. This is the form's own state, so `styles` passed to the form still override it. A form nested deeper, or a plain `<form>` element, is left alone.
