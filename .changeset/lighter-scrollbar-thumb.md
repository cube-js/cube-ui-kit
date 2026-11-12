---
"@cube-dev/ui-kit": patch
---

Scrollbar thumbs are lighter and the same everywhere. The default `#scrollbar-thumb` is now 20% of `#text` instead of 50%, and `Panel` uses it instead of its own color. To keep a stronger thumb, override `#scrollbar-thumb`, or pass `innerStyles={{ scrollbar: 'thin #dark.2' }}` to a `Panel`.
