---
'@cube-dev/ui-kit': patch
---

Add a headless-Chromium test project alongside the jsdom suite.

`pnpm test:browser` runs `*.browser.test.tsx` files in real Chromium through
Vitest's browser mode. It is a second project rather than a migration: the
existing suite covers logic, ARIA and wiring, none of which needs a browser and
all of which runs far faster without one.

The browser setup deliberately keeps `ResizeObserver` and
`@tanstack/react-virtual` real — the jsdom setup stubs both, and the virtualizer
stub hands back a fixed 40px-per-row window that no variable-height row ever
exercises.

Seeded with seven `ItemTable` cases covering what jsdom structurally cannot see:
column width resolution, header-to-body text alignment measured on the glyph
box, resize-handle geometry and pointer hit-testing, keyboard resize, sticky
headers, and per-axis overscroll containment. Every one corresponds to a bug
that reached this component and was found by hand.
