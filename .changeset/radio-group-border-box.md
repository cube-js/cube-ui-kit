---
'@cube-dev/ui-kit': patch
---

`RadioGroup` is `border-box`, so an explicit width means the box you can see.

The `tabs` layout is the one with padding of its own, and it was laid out as `content-box`: `<Radio.Tabs styles={{ width: '100%' }} />` came out `1x` wider than its container and overhung the right edge. The color popover's space switcher (HST / LCH / RGB) was the visible case — it touched the popover border while everything above and below it sat inside the padding.

Groups without an explicit width are unaffected: they size to `max-content`, which measures the same either way.
