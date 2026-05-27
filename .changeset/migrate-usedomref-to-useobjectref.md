---
'@cube-dev/ui-kit': minor
---

**Breaking:** Refs forwarded to `Modal`, `Tray`, `Dialog`, `Form`, `MenuTrigger`, `Menu`, `CommandMenu`, `RadioGroup`, `CheckboxGroup`, and `Label` now resolve to the underlying DOM element directly. The previous `@react-spectrum/utils` `{ UNSAFE_getDOMNode() }` wrapper (`DOMRefValue`) has been removed. Migrate by reading `ref.current` instead of calling `ref.current?.UNSAFE_getDOMNode()` on these components.

Internally, these components now use `useObjectRef` from `@react-aria/utils` in place of `useDOMRef` from `@react-spectrum/utils`. Refs into focusable wrappers like `Button` (which still use `useFocusableRef`) are unaffected and continue to expose `UNSAFE_getDOMNode()` plus `focus()`.
