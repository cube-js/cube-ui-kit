---
'@cube-dev/ui-kit': patch
---

`type="primary"` buttons (also `Item` and `ItemAction`) now have a softer border: the fill mixed at 70% over the page surface, emulating a translucent edge. The old border was a lighter, more saturated shade, and in dark mode it glowed, so filled buttons looked larger than outline buttons of the same size. The rim now follows the fill on hover and press, which replaces the bright `accent-text` pressed rim on the danger, success, warning and note themes. The `special` theme mixes over `#special-surface`, since it sits on dark backgrounds. The `*-accent-surface-border` tokens are still published.
