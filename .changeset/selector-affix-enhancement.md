---
"@cube-dev/ui-kit": patch
---

Enhanced selector affix syntax (`$`) for sub-element styling in tasty. Capitalized words in the affix are now automatically transformed to sub-element selectors, allowing complex selector chains like `$: '> Body > Row >'` which generates `.table > [data-element="Body"] > [data-element="Row"] > [data-element="Cell"]`.

