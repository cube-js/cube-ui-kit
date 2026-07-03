---
"@cube-dev/ui-kit": patch
---

Fix several `CommandTextArea` issues and a related `ComboBox` filtering regression:

- **Stale virtual focus / commit**: As the typed token narrows, virtual focus now moves to the first still-visible option when the previously highlighted option is filtered out, and `Enter`/`Tab` can no longer commit a hidden command (e.g. typing `/` then `h` no longer inserts `/clear`). Visible options are derived from the component's own filtered collection instead of the ListBox state ref, which can lag by one render.
- **Conditional Hook**: `listStateRef` no longer calls `useRef` conditionally, preventing the Hook-order changes that could occur when the optional `listStateRef` prop was added or removed.
- **Stale caret after external value updates**: When the textarea value changes from outside (controlled updates, form reset, or a seeded `defaultValue`), the caret is now resynced from the DOM selection so trigger parsing uses a valid index.
- **`defaultValue` ignored**: An uncontrolled `CommandTextArea` now seeds its text (and trigger parsing) from `defaultValue`.
- **`ComboBox` filtering**: `ComboBox` again filters on `textValue` only, as documented. The shared `filterCollectionNodes` helper now matches plain-text `children`/`description` only when a component opts in via `matchExtraFields` (used by `CommandTextArea`).
