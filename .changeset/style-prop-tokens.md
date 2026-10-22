---
'@cube-dev/ui-kit': patch
---

Components now pass runtime values through Tasty `tokens` instead of inline `style`. `Prefix`, `Suffix` and `DirectionIcon` keep a `style` you pass them, which their own inline style used to replace. `ComboBox` and `SearchComboBox` take their focused stacking from their styles, so a `styles.zIndex` override now applies.
