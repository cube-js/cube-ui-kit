---
"@cube-dev/ui-kit": patch
---

The `uikit:colors` harness tool now runs without the project's install, such as from a package that `harnesspm fetch` downloaded: it loads one bundled file instead of `@tenphi/glaze` and React.
