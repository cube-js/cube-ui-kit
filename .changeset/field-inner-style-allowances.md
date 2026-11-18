---
"@cube-dev/ui-kit": patch
---

The published `tasty.config.ts` lets a field (`Select`, `ComboBox`, `Picker`, `FilterPicker`, `ListBox` and the rest) be sized from outside: with `@tenphi/eslint-plugin-tasty` 1.20.0 or newer, `tasty/no-protected-restyle` accepts `popoverStyles`, `overlayStyles`, `listBoxStyles` and `labelStyles` that set only sizing props (`width`, `height`, …), `listStyles` that also sets `margin` and the other placing props, and `headerStyles` and `footerStyles` that set only a container's layout props (`padding`, `gap`, `flow`, …). A look on any of them (`fill`, `border`, `preset`, …), and `triggerStyles`, `inputStyles` and `optionStyles`, are still reported.
