---
'@cube-dev/ui-kit': patch
---

`DisplayTransition` finishes a transition when its `ref` is wrapped in a function that is new on every render, such as an inline wrapper or an unmemoized `mergeRefs` in code that React Compiler doesn't compile. React detaches such a ref and re-attaches the same element on each render, and that dropped the transition listeners. A re-render after the transition had started then left an exit unfinished, with the element still mounted, and `onRest('enter')` never fired.
