---
"@cube-dev/ui-kit": patch
---

Fix DisplayTransition getting stuck when its bound element is replaced during a native CSS transition. Exit completes and unmounts content, and enter completion still fires once; interrupted transitions cancel the pending completion.
