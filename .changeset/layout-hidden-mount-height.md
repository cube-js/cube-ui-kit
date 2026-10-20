---
"@cube-dev/ui-kit": patch
---

Fix a `Layout` that mounts inside a hidden container, such as a closed `hideOnClose` panel or a hidden tab, staying collapsed after it is shown: it now checks its height once it is visible.
