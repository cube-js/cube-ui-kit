---
"@cube-dev/ui-kit": patch
---

`ListBox` and `FilterListBox` accept their documented style props in TypeScript: `height`, `width`, `flex`, `margin` and the rest of the base, outer and color groups. They were always applied at runtime, but the props type did not declare them, so `<ListBox height="20x">` failed to type-check and callers routed it through `styles` instead.
