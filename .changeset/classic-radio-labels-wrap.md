---
"@cube-dev/ui-kit": patch
---

`Radio.Group`: a classic radio's label now wraps within the room the group gets, as documented, instead of running past a narrow container such as a dialog on a phone. A classic group with room keeps its width, and button and tabs groups are unchanged. The overrides that used to make a label wrap (group `width="100%"`, Radio `width="auto"` and `labelStyles={{ whiteSpace: 'normal' }}`) are no longer needed.
