---
"@cube-dev/ui-kit": patch
---

A `Badge` or `Tag` in a field's `labelSuffix` no longer grows the label row by a pixel. The suffix was wrapped in a block, where an inline-level element sits in a line box whose strut added space under it, so the row measured 21px instead of 20px and the field below stepped out of line with its neighbours. A single-element suffix is now a flex item, centred on the row. Mixed content — text, a fragment, several elements — is wrapped in a `<span>` and keeps flowing inline, spaces included.
