---
---

`audit-docs`: honour style props a component omits from its props interface. A component that repurposes a style prop drops it via `Omit<SomeStyleProps, 'x'>` and destructures it as an ordinary prop, so it never reaches `extractStyles` — `Board`'s `margin` is the grid gap, not a CSS margin. The audit read the style list named in the `extractStyles` call and knew nothing about the `Omit`, so it demanded the docs list a prop the component does not accept. Tooling only; nothing about the published package changes.
