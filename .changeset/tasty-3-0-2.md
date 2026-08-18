---
'@cube-dev/ui-kit': patch
---

Update `@tenphi/tasty` to `3.0.2`. A patch release with no public API change — the export surface is byte-for-byte the same set of names as `3.0.1` — so nothing in the UI Kit needed migrating and the full suite passes unchanged.

Two clarifications in Tasty's docs are worth knowing if you write custom tokens: token names are case-sensitive and should start lowercase (a leading capital folds, so `$Foo` resolves to `--foo`), and `preset` / `transition` take token *names* rather than values, so a bare `$name` there warns in dev and is ignored. Neither affects this package — no capitalized token name is used anywhere in `src`.

The tree-shaking size budget goes from 123 kB to 124 kB. Tasty's core grew ~0.56 kB in this release, which put the old budget 31 bytes over; the `All` entry moved by the same amount and stays inside its 501 kB budget.
