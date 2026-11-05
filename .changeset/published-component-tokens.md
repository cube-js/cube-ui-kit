---
"@cube-dev/ui-kit": patch
---

The published `tasty.config.ts` lists the component tokens the docs offer you, so `tasty/valid-custom-property` and `tasty/valid-color-token` accept them in your code: Dialog's `$dialog-size`, `$dialog-padding-h`, `$dialog-title-padding-v`, `$dialog-content-padding-v` and `$dialog-footer-v`; the `$size` that `Item`, `Button` and the text inputs publish, and Item's `$prefix-gap` and `$suffix-gap`; ItemButton's `$action-size`; ItemTable's row and cell tokens; Layout's `$content-padding`; `$full-label-width`; GridProvider's `$column-width`; `#slider-thumb`; `$overlay-inset-top`; and the app-wide `$font-sans` and `$font-mono`. Internal component tokens such as `#color-picker`, `$tab-indicator-size` and `$scrollbar-h-left` leave the published list, so the rules report a read of one as a name that isn't yours.
