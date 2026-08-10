# `src/components/data` — table components

`ItemTable` (records) and `DataTable` (analytics results) are siblings over a
shared internal engine, `TableBase`. `TableBase` exports no public component:
adapters resolve props into `TableViewProps` and hand them to `<TableView>`,
which is the only place table DOM exists.

## Hard boundary: no Cube domain concepts

Nothing under this directory may reference `measure`, `dimension`, `pivot`,
`drill`, `grain`, `member`, or any other Cube vocabulary. The generic mechanism
belongs here; the domain meaning stays in the consuming app.

The escape hatches that keep this line holdable:

- `column.header.menu` / `column.header.actions` take an opaque `ReactNode`, so
  a caller can mount an arbitrarily complex column menu without the kit knowing
  what is in it.
- `renderCellMenu`, `column.render`, `column.cellStyles` and `renderRow` cover
  the rest.

If something seems to need domain knowledge in here, it needs a new generic
prop instead.

## Why a native `<table>`

Because a **grid item's containing block is its own grid area**, `position:
sticky` cannot work on the cells of a CSS-grid row — which is why div-based
grids need ag-grid-style flex "lanes" for pinned columns. A **table cell's**
containing block is the scrollport, so sticky works directly on `<th>`/`<td>`.

That one fact buys: sticky pinned columns with no lanes, header/body column
alignment via `<colgroup>` with no scroll sync, and `<td colspan>` spacers as
the eventual column-virtualization mechanism.

Two constraints follow and must not be "simplified" away:

- `border-collapse: separate` is required. With `collapse`, a sticky `<thead>`
  loses its borders and they scroll away with the content. Row separators
  therefore live on cells, not on `<tr>`.
- `table-layout: fixed` makes `<colgroup>` authoritative. Widths are resolved in
  JS (`use-table-columns.ts`) from a `ResizeObserver` measurement, not by the
  browser's auto layout.

## Row state is published as inherited custom properties

Tasty sub-element state keys resolve against the **root**, not the element's DOM
parent: inside `Cell: {}`, the key `hovered` compiles to
`.t0.t0[data-hovered] […Cell]` — the *table* hovered, not the row. A cell can
therefore never react to its row's state through a state map.

So `Row` publishes `#row-base`, `#row-overlay`, `#row-text` and `$dim`, and
cells consume them (`fill: '#row-base #row-overlay'`). Custom properties inherit
through the DOM and ignore selector context. Pinned cells overlay the scrolling
ones and must be opaque, and this is what makes them match their row for free.

Use `@own(...)` for an element's own state.

## The row state matrix must not be one map

Tasty coalesces entries in a single state map that share a serialized value,
promotes them to the group's maximum priority, and negates them against
everything below — silently turning a middle-priority compound rule into FALSE.
See `src/data/AGENTS.md`.

A combined `selected × hovered × focused × disabled × dimmed × odd` map is 64
entries and would be riddled with collisions. `styled.ts` splits it three ways:

1. `odd` lives alone in `#row-base`, with two distinct values.
2. `dimmed` never appears in a fill map — it drives `$dim` and `#row-text`.
3. Every value string inside `#row-overlay` is unique.

There is a regression test asserting a `selected + hovered` row computes a
different background than a merely `hovered` one. Keep it.

## `Item` goes inside the `<th>`, never as the `<th>`

`Item` emits `aria-selected` unconditionally (`Item.tsx:964`), which on a
`columnheader` claims the column is *selected* rather than *sorted*. It is also
`inline-grid` with its own intrinsic size, and it paints its own hover/pressed
ramp.

So `TableHeaderItem` sits inside the header cell: the `<th>` owns the
interaction fill and the ARIA, `Item` contributes layout. The prize is that
`Item`'s `Actions` slot already stops click/pointer/Enter/Space propagation, so
pressing a column menu can never trigger the sort.

**At most one `Item` per body row.** `Item` runs `useHotkeys` on every instance
even with no `hotkeys` prop, and its `@interacted` alias uses `:has()`. One per
cell would churn hundreds of subscriptions per scroll tick. Every other cell
uses `TextItem`.

## Layout bugs need a real browser

`pnpm test` runs jsdom, which reports every element as zero-sized. That is fine
for logic, ARIA and wiring, and it is why the bulk of the suite lives there —
it is much faster. But it cannot see layout at all, and this component's bugs
concentrate exactly there. Ones that shipped and were found by hand:

- an `inset` shorthand with arithmetic compiling to `32px -24px 1px 16px`
- every resize handle stacking at the scroller's edge, because a `<th>` is
  `position: static` and was not the containing block
- `placeContent: 'end center'` centring instead of ending — it maps to
  `align-content justify-content`
- header labels indented twice, to 32px, visible only by measuring the **glyph
  box** with a `Range`; the label *element* was in the right place
- a drop indicator whose selectors never matched, leaving an invisible line and
  a 1px row shift
- state maps inside a `&::after` block silently not compiling

`pnpm test:browser` runs the same tests in headless Chromium
(`vitest.browser.config.ts`, files named `*.browser.test.tsx`). Its setup
deliberately keeps `ResizeObserver` and `@tanstack/react-virtual` **real** —
the jsdom setup stubs both, and the stub hands back a fixed 40px-per-row window
that no variable-height row ever exercises.

Reach for it when a change touches geometry, sticky positioning, pointer
hit-testing, focus order, or an observer. Three things cannot be tested any
other way: React Aria's drag-and-drop ignores synthetic events (verified — the
same sequence fails against `ListBox` too), `IntersectionObserver` never fires
in a hidden document, and `useMove` needs real pointer and key events.
