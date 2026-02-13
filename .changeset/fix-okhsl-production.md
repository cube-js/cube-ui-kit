---
"@cube-dev/ui-kit": patch
---

Fix okhsl color conversion in production builds by registering okhsl as a built-in parser function instead of relying on a side-effect configure() call that can be tree-shaken away.
