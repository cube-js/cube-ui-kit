# Fields

Read [`docs/rules/input-components.md`](../../../docs/rules/input-components.md) before touching anything here — hook order, the `useFieldProps` modes, id/label wiring, `wrapWithField`, validation props.

## Nullable form models

`FieldBaseProps<Value>` describes what a field binding accepts, including `null | undefined` when supported; it does not describe only what the control emits on change. Preserve nullable API values in the store and normalize them only for display. Coverage lives in `Form/modern/nullable.test.tsx` under `src/components/form/` and `typecheck/consumer/modern-form-nullable.tsx`.

## Textarea autosize

`TextArea` and `CommandTextArea` share [`TextInput/useAutoSizeTextArea.ts`](TextInput/useAutoSizeTextArea.ts). It measures an off-screen mirror on purpose: **never size a live textarea by mutating its own height** (`height: auto` → read `scrollHeight` → restore). That re-lays out every ancestor mid-keystroke, and a scroll container sharing the column then has its scroll offset moved and imperfectly restored by the browser's scroll anchoring — the chat-input jitter of CUB-4042. Note also that `height: auto` sizes a textarea from its `rows` attribute and the font's line box, not from CSS `line-height`, so a `scrollHeight` read that way carries a floor and cannot report a shrink.

## File selection state

FileInput owns native file selection separately from its model value. A controlled replacement/reset must clear obsolete native files as well as update the visible filename; browsers cannot restore file bytes from a string. Text uploads need the model value for reset synchronization too. Abort a pending FileReader when replaced or unmounted. Cover controlled, uncontrolled, and both form backends when changing this adapter.
