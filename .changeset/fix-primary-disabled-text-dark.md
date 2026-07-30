---
'@cube-dev/ui-kit': patch
---

Fix primary (and other solid accent) disabled button labels — `#*-accent-disabled-surface-text` rides the extreme away from its disabled chip (`tone: 'max'`), so the label stays deliberately faint (~cr 1.7, reading as disabled rather than as live text) while keeping a consistent separation from the chip in light, dark, and high-contrast schemes.

Previously this was a contrast-driven relative step (`lightness: '+1'` with `contrast: 1.51`). Authoring it as an extreme is only viable from `@tenphi/glaze` 1.2.0, which no longer re-maps a based extreme through the dark tone window — that compressed the base-to-extreme span and lowered the dark label's contrast.
