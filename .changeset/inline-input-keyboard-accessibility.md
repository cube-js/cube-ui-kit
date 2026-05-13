---
'@cube-dev/ui-kit': patch
---

**InlineInput**: improved keyboard accessibility and stability.

- New prop `keyboardActivation?: boolean` (default `true`). When enabled, the display element is keyboard-focusable (`tabIndex=0`, `role="button"`, `aria-roledescription="editable text"`) and responds to `Enter`, `F2`, and `Space` to enter edit mode. Hosts that already own keyboard activation (e.g. editable tabs whose `<button>` listens for `F2`) can pass `keyboardActivation={false}` to avoid creating a nested tab stop.
- A keyboard focus ring (`#primary` token, rounded) appears on the display element when it receives keyboard focus (`useFocusRing`'s `isFocusVisible`). It is suppressed automatically while editing (focus is on the inner input) and when `keyboardActivation={false}` (so the host's focus ring is the one users see — as in `Tabs`). New `focused` modifier exposed on the root for consumers.
- The display element now mirrors `isDisabled` / `isReadOnly` via `aria-disabled` / `aria-readonly`, and `aria-label` / `aria-labelledby` are forwarded to it when focusable.
- Pointer activators (`onClick` / `onDoubleClick`) are now wired only when the chosen `editTrigger` actually needs them, instead of being always-on no-ops.
- Internal fixes: `stopEditing()` reads the synchronous `isEditingRef` instead of a potentially stale render closure, and the ref mirror is updated via `useLayoutEffect` so torn-away concurrent renders cannot leak a stale value across commits.

**Tabs**: editable tabs continue to be driven by `F2` / context-menu rename at the tab-button level; `InlineInput` now receives `keyboardActivation={false}` from `TabButton` so the inline title does not introduce an extra tab stop or a duplicate focus ring inside the tab.
