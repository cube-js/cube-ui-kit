---
"@cube-dev/ui-kit": minor
---

Add recipes feature to the tasty style system. Recipes are predefined, named style bundles registered via `configure({ recipes })` and applied to components via the `recipe` style property. Multiple recipes can be composed with commas (`recipe: 'card, elevated'`), and component styles always override recipe values. Recipes work with both runtime `tasty` and zero-runtime `tastyStatic`.
