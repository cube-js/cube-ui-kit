---
'@cube-dev/ui-kit': patch
---

Stop `useAutoTooltip` from measuring label overflow inside its callback ref. React invokes callback refs during `commitAttachRef`, so reading `scrollWidth`/`clientWidth` there forced a style recalc and layout per element, mid-commit — every tooltip-bearing `Button`, `Item`, `TextItem`, `LayoutHeader` and `InlineInput` paying its own reflow. The `ResizeObserver` already delivers an initial callback on `observe()`, after layout but before paint, so the measurement lands in the same frame and is batched across every observed label.
