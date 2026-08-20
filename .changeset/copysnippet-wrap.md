---
'@cube-dev/ui-kit': minor
---

`PrismCode` and `CopySnippet` take an `isWrapped` prop that soft-wraps long content instead of scrolling it sideways.

By default both components keep each line on one line and scroll horizontally, which buries long error messages and logs off to the right. `isWrapped` lays the content out on multiple lines instead: unbreakable runs like URLs, tokens and identifiers break too (`overflow-wrap: anywhere`), not just spaces. On `CopySnippet` the block additionally grows vertically to fit — so even a single very long line is fully readable rather than clamped to the collapsed height — and the prop is forwarded to the inner `PrismCode`, which owns the wrapping itself.

```jsx
<PrismCode code={longErrorMessage} language="bash" isWrapped />
<CopySnippet code={longErrorMessage} language="bash" isWrapped />
```

On `CopySnippet` it is a different axis from `nowrap` — `nowrap` collapses real newlines into one scrolling line, `isWrapped` breaks long lines — and `nowrap` wins when both are set. The copy button and syntax highlighting are unchanged.
