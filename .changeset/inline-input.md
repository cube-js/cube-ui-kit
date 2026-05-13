---
'@cube-dev/ui-kit': minor
---

**InlineInput**: new top-level component for inline-editable text, plus internal refactor of `Tabs` to use it.

- `InlineInput` is a reusable inline-editing primitive. It inherits typography/color from its parent so it drops into headings, paragraphs, tab titles, table cells, etc. without style customization. Value and `isEditing` can each be controlled or uncontrolled.
- Activation modes via `editTrigger`: `'dblclick'` (default), `'click'`, or `'none'` (programmatic only). The imperative ref exposes `startEditing()`, `stopEditing(submit?)`, `focus()`, and `getValue()` and works regardless of `editTrigger`.
- Deterministic focus flow: focus is taken via `FocusScope autoFocus restoreFocus={false}`, blur is detected via `useFocusWithin` (not a manual `onBlur` + RAF guard). Tests / Playwright can drive `dblclick → type → blur` without waiting on frames.
- Optimistic display: when controlled and the parent updates `value` asynchronously, the just-committed value is shown immediately to avoid flicker.
- Async save with auto-rollback: `onSubmit` may return a `Promise`. On rejection the component reverts its optimistic value back to the actual `value` prop. A token guard prevents stale rejections from clobbering newer commits.

`Tabs` now uses `InlineInput` internally for editable tab titles (no behaviour change for consumers — F2, double-click, "rename" menu, blur-to-submit, escape-to-cancel all work as before). The internal `EditableTitle` component and its `chainRaf` / multi-RAF focus dance are gone, which removes the race conditions that previously made the editing flow hard to drive deterministically.
