---
'@cube-dev/ui-kit': patch
---

`no-redundant-default-prop`: cover the defaults components set as styles.

`<Space gap="1x">` restates what `Space` already does, and the rule did not notice. Two
independent gaps had to line up for that, and both are fixed here — the registry grows from
401 proven defaults to 441.

**The docs parser only read one of the two default sections.** A component's tasty style
defaults are documented under `### Style Defaults` as `` - `gap` — `1x` ``, not as a
`## Properties` bullet with a `(default: …)` annotation, so all 30 components with such a
section contributed nothing. Those styles are defaults in every sense that matters here:
ui-kit components forward style props, so passing one restates the component's own value.
Bullets carrying a conditional note — `` `flow` — `row` (switches to `column` when
`direction="vertical"`) `` — are skipped rather than probed, since the note is an explicit
statement that the value depends on something the probe may not vary.

**The probe compared class names it should have ignored.** Tasty derives its class hash from
the _input_ style object rather than the CSS it produces, so `gap: true` (what `Space` sets)
and `gap: '1x'` (what the prop passes) emit byte-identical rules under different class names.
The differential render therefore reported a genuine redundancy as "differs", and the prop
was recorded as unverified instead of becoming a candidate. Class names are now canonicalised
the same way React's generated IDs already were: positional placeholders assigned in order of
first appearance, so an extra, missing or reordered class still compares unequal and only the
arbitrary hash is normalised away.

Every new entry is a style prop, so all of them are optional — this cannot repeat the
`ResizablePanel.direction` problem, where the rule removed a prop that was typed required.
