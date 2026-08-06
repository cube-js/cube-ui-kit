---
'@cube-dev/ui-kit': major
---

Remove the `block` prop from `Text` and the `inline` prop from `Title`. Use `display` instead:

```diff
- <Text block>…</Text>
+ <Text display="block">…</Text>

- <Title inline>…</Title>
+ <Title display="inline">…</Title>
```

Both were inherited from Tasty's `BaseProps` until v3 dropped them, at which point the UI Kit re-declared them locally. `display` already covers the use case on every Tasty component, so a bespoke boolean per component is redundant.

`inline` on `Title` was already inert — it was destructured and discarded, and `TitleElement` hardcodes `display: 'block'`. Removing it changes nothing at runtime.

`block` on `Text` was real: it drove a `block` mod feeding the `'ellipsis | block'` display branch. That branch is now just `ellipsis`, so `<Text ellipsis>` still renders as a block. Note that passing `display` replaces the whole default state map, so `<Text ellipsis display="inline">` will not force block — the explicit value wins, which is the intent.

Proper `isBlock` / `isInline` props may follow later where they earn their place; this is deliberately not that.
