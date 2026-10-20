---
"@cube-dev/ui-kit": minor
---

`TextItem` no longer accepts the `ellipsis` and `nowrap` props it inherited from `Text`. It renders one line truncated with an ellipsis, so both props had no effect, and `ellipsis={false}` could not turn truncation off. Remove them from `TextItem` call sites; for text that wraps, use `Text`.
