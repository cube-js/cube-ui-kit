---
'@cube-dev/ui-kit': minor
---

Keep the caret in place in `TextInput`, `TextArea`, `PasswordInput` and `SearchInput` when the
controlled value comes back late.

A controlled `<input>` renders whatever string its parent hands it. If the parent hands back the
pre-keystroke string — because its state arrives through a store that publishes a render late, a
debounce, or a deferred update — React writes that stale string into the DOM node, and a native
`value` assignment collapses the selection. Typing in the middle of a field threw the caret to the
end. The text still landed a render later, so it read as a caret bug rather than a data-flow one.

These four fields now hold the typed text locally until the parent catches up. `onChange` still
fires once per keystroke with the full value, so nothing downstream changes: no debouncing, no
commit-on-blur, no coalesced calls. An incoming `value` is adopted whenever it is a genuine change
from the parent — an undo, a reset, a transformed string, another record — and on blur the parent's
value takes over again.

Components that already own their typed text are untouched: `NumberInput`, `ComboBox`,
`SearchComboBox`, `FilterListBox`, `CommandMenu`, `CommandTextArea`, `ColorPicker` and
`InlineInput`.

Two additions to the public API:

- `useBufferedValue(value, onChange, options)` — the hook behind it, exported for controls that
  own their own input. It is generic, and `options.getKey` lets non-string values (an array of
  colour stops rebuilt on every emit) be matched by signature rather than identity.
- `isBuffered` on the four fields — set it to `false` for a caller that must see the field snap
  back to its own `value` the instant it declines a keystroke.

```tsx
// A parent whose state arrives a render late no longer fights the caret.
<TextInput value={spec.title} onChange={(title) => updateSpec({ title })} />
```
