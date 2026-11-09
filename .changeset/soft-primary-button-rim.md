---
'@cube-dev/ui-kit': patch
---

`type="primary"` buttons (also `Item` and `ItemAction`) no longer draw a visible border. The old border was a lighter, more saturated shade of the fill that glowed in dark mode, so filled buttons looked larger than outline buttons of the same size. The fill now covers the whole button. Inside `Button.Split`, primary halves are divided by a 1px gap that shows the background behind the split, instead of a shared border. The `current` theme keeps its rim on disabled buttons. The `*-accent-surface-border` tokens are still published.
