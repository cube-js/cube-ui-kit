---
'@cube-dev/ui-kit': minor
---

`Board`: corner-anchored widget chrome, app-defined widget modifiers, a reason on `onLayoutChange`, and a real `dragCancel` default.

- **`dragCancel` now defaults to `BOARD_SELECTION_CANCEL`** instead of no cancel at all. A control inside a widget has to keep its own press whether or not the board happens to support selection — previously that only worked on a _selectable_ board, where `selectionCancel` incidentally doubled as the drag guard, so every other board had to hand-write a selector or a pointer-down on a child's button would drag the widget instead. Pass your own selector to narrow or widen it, or `''` for the old behaviour.

- **`cornerChrome`** (with **`cornerChromePlacement`**, default `'ne'`) puts a control on a widget's corner, centred on it. It renders in the same layer as the corner resize grips, which is the layer that escapes the widget's own `overflow: hidden` — chrome hung off the corner from inside a widget is cropped in half by that clip, or by an ancestor's scroll container when the widget sits in the first row. Being outside the widget host, it is also outside the drag gesture, so pressing it can never start a drag and it needs no `dragCancel` entry.

- **`mods`** on `Board.Widget` (and board-wide via `widgetProps`) merges app-defined modifiers into the ones the board sets, so a `styles` map can match on app state (`mods={{ editing: true }}` with `styles={{ shadow: { editing: '…' } }}`) instead of the app swapping whole style objects per state. Board's own modifiers are applied last, so a custom one can never shadow `selected`, `drag` and the rest, which the board's styling and its accessibility wiring both depend on.

- **`onLayoutChange` now reports why the layout changed** — `'drag'`, `'resize'`, `'transfer'`, or `'normalize'` for the commits no gesture caused (a reflow for a changed column count, an `isAutoHeight` widget growing). An app that persisted every commit had no way to tell a user's edit from the board fitting itself to a constraint that moved, so it wrote the reflow back as an edit and marked a document dirty nobody touched. The argument is additive: existing one-parameter handlers keep working.

The docs also now explain that widget style maps are **merged**: a map with no `''` entry extends the defaults, while one that sets `''` replaces them and needs `'@inherit'` to keep any. Reaching for `'': false` to switch a single state off is the easy mistake — it silently takes `selected`, `pre-selected` and the drag lift with it.
