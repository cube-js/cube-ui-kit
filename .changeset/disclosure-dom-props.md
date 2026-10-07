---
'@cube-dev/ui-kit': patch
---

`Disclosure`, `Disclosure.Group` and `Disclosure.Item` forward DOM attributes (`id`, `className`, `style`, `aria-*`, `data-*`), `theme` and event handlers to their root, and their types accept them. A caller's `tokens` now merge with the `$disclosure-transition` token instead of being dropped. `Disclosure.Item`'s `id` stays its group key and isn't rendered as the DOM `id`.
