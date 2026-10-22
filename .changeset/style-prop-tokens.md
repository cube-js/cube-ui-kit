---
'@cube-dev/ui-kit': patch
---

Components now pass runtime values through Tasty `tokens` instead of inline `style`. `Prefix`, `Suffix`, `DirectionIcon`, `ResizablePanel`, `Layout.Panel`, `Layout.Pane` and `Layout.Content` keep a `style` you pass them, which their own inline style used to replace. `ComboBox` and `SearchComboBox` take their focused stacking from their styles, so a `styles.zIndex` override now applies.

`tasty.config.ts` now lists every color token the palette emits (45 were missing, including the `special` theme's accent tokens, the `*-accent-disabled-text`, `*-accent-selected-fill` and `*-accent-surface-border` tokens, and `#current-fill`) and the `@dark` and `@hc` states, so projects that extend it no longer get unknown-token or unknown-state errors for them from `@tenphi/eslint-plugin-tasty`.
