---
'@cube-dev/ui-kit': patch
---

Fixed tab indicator not appearing when Tabs is rendered inside a lazy-visibility container (e.g., Dialog, collapsed panel). A ResizeObserver now detects when the container transitions from zero to non-zero width and recalculates the indicator position.
