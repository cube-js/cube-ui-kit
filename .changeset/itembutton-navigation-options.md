---
"@cube-dev/ui-kit": patch
---

`ItemButton` no longer renders `navigationOptions` (or the deprecated `label`) as an attribute on its element. Navigation still receives the options, but the element also got `navigationOptions="[object Object]"`, and React warned about an unknown prop in development.
