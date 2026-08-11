---
'@cube-dev/ui-kit': patch
---

Ship `tasty.config.ts` to consumers, and stop `no-redundant-default-prop` breaking `ResizablePanel` call sites.

`tasty.config.ts` was missing from the package's `files` list, so it never reached the tarball and
`extends: '@cube-dev/ui-kit'` in a consumer's own tasty config silently resolved to nothing. The
ESLint plugin's token-existence rules then reported every real token (`#border`, `#surface`,
`#dark`) as unknown — around 660 phantom findings in one downstream app alone. The config also now
declares `importSources`, since consumers import `tasty` from this package rather than from
`@tenphi/tasty` and the plugin only inspects calls it can trace to a tracked import. It unions with
the parent config's list, so this package's own `@tenphi/tasty` imports stay covered.

`CubeResizablePanelProps.direction` is now optional. It was typed required even though both
`ResizablePanel` and `Handler` destructure it as `direction = 'right'`, so the defaults registry
recorded that runtime default and the rule removed explicit `direction="right"` from consumer call
sites, which then failed to typecheck. The type now agrees with the implementation and the rule's
advice is actionable.

The lint fixture is why this was not caught here: it rendered
`<ResizablePanel direction="right" {...props} />`, hardcoding the prop purely to satisfy the
required type. The probe proves a default by rendering with and without the prop, so a hardcoded
value sits in both renders, they match, and the prop is recorded as defaulted whether it is or not.

A new `fixture-hygiene` test now fails on that shape anywhere in the fixture list. It caught two
more: `FilterPicker` hardcoded `selectionMode="single"` and `GridProvider` hardcoded `columns={2}`.
Both happened to be correct, but neither was proven. All three render bare now, and the registry
output is unchanged — so those defaults are proven rather than assumed.
