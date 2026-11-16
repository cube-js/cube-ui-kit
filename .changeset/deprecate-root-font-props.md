---
'@cube-dev/ui-kit': patch
---

`Root`'s `fonts`, `fontDisplay` and `publicUrl` props are deprecated. They are left from when UI Kit loaded a webfont and have done nothing since it moved to the system font stack, so you can delete them. `Root` no longer renders the `data-font-display` attribute.
