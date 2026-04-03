---
"@cube-dev/ui-kit": patch
---

fix(Tabs, RadioGroup): align radio/tabs size mapping

Both `Tabs type="radio"` and `Radio.Tabs` now use the same two API sizes with consistent Item button mappings:
- `large` (default): medium button (32px), 40px total
- `medium`: xsmall button (24px), 32px total
