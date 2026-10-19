---
"@cube-dev/ui-kit": patch
---

`<Root palette>` no longer writes the palette store while it renders when the prop changes. Before, a new `palette` value notified `GlobalStyles` and every `usePaletteValue` / `usePaletteConfig` reader in the middle of Root's render, and React logged "Cannot update a component while rendering a different component", so hosts had to call `setPaletteConfig()` themselves before changing the prop. The first mount still applies the palette during render, so the first paint and SSR output stay branded; later changes now apply in a layout effect, which still lands before paint. Changing the prop alone is enough. A `<Root>` that mounts while another tree is already rendered with a different palette still applies it during its first render. Because Root's layout effect runs after its descendants', a `setPaletteConfig()` call from a descendant's layout effect in the same commit now loses to the prop; call it from a passive effect or an event handler.
