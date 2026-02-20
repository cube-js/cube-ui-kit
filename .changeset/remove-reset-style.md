---
"@cube-dev/ui-kit": minor
---

**Breaking change:** Removed `reset` style property from tasty style system. Browser reset styles are now provided via recipes (`reset`, `button`, `input`, `input-autofill`, `input-placeholder`, `input-search-cancel-button`) registered in the UI kit configuration. Recipe names are now space-separated, with `|` separating base recipes from post-merge recipes.

**Migration:**
- Replace `reset: 'button'` with `recipe: 'reset button'`
- Replace `reset: 'input'` with `recipe: 'reset input | input-autofill'` and add sub-element styles for `Placeholder` and `&::-webkit-search-cancel-button`
