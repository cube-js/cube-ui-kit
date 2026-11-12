---
"@cube-dev/ui-kit": patch
---

Scrollbar thumbs are fainter, and `Panel`'s now matches the rest. The default `#scrollbar-thumb` is 20% of `#text` instead of 50%, and `Panel` reads it instead of its own color. To keep the previous default, set `'#scrollbar-thumb': '#text.5'` in your tokens. To keep `Panel`'s previous thumb, pass `tokens={{ '#scrollbar-thumb': '#dark.2' }}` to it.
