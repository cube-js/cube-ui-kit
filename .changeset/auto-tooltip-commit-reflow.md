---
'@cube-dev/ui-kit': patch
---

Stop `useAutoTooltip` from measuring label overflow inside its callback ref. React invokes callback refs during `commitAttachRef`, so reading `scrollWidth`/`clientWidth` there forced a style recalc and layout per element, mid-commit — every tooltip-bearing `Button`, `Item`, `TextItem`, `LayoutHeader` and `InlineInput` paying its own reflow. The measurement now runs in a microtask queued from the ref: it lands after React's whole commit and before paint, so every label reads once all of them have written and the reads collapse into a single style and layout flush. A microtask rather than the `ResizeObserver`'s first delivery, because observer callbacks are part of the rendering steps and a runner that is not producing frames can hold them past the point something asks whether the tooltip is active; the observer still covers every later resize.
