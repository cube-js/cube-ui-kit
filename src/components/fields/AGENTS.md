# Fields

Read [`docs/rules/input-components.md`](../../../docs/rules/input-components.md) before touching anything here — hook order, the two `useFieldProps` modes, id/label wiring, `wrapWithField`, validation props.

## Textarea autosize

`TextArea` and `CommandTextArea` share [`TextInput/useAutoSizeTextArea.ts`](TextInput/useAutoSizeTextArea.ts). It measures an off-screen mirror on purpose: **never size a live textarea by mutating its own height** (`height: auto` → read `scrollHeight` → restore). That re-lays out every ancestor mid-keystroke, and a scroll container sharing the column then has its scroll offset moved and imperfectly restored by the browser's scroll anchoring — the chat-input jitter of CUB-4042. Note also that `height: auto` sizes a textarea from its `rows` attribute and the font's line box, not from CSS `line-height`, so a `scrollHeight` read that way carries a floor and cannot report a shrink.
