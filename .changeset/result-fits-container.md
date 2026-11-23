---
"@cube-dev/ui-kit": patch
---

`Result` is never wider than its container. Content that cannot wrap, such as a long path, used to push it past a container narrower than `80ch`; its width is now `max min(80ch, 100%)`, and its `Content` stays within it.
