---
'@cube-dev/ui-kit': minor
---

Add widget selection and rigid group movement to `Board`.

Set `selectionMode="single" | "multiple"` and read the selection with
`selectedKeys` / `defaultSelectedKeys` / `onSelectionChange` (keys are layout item
ids, always returned in layout order).

Pressing a widget selects it on pointer-down and arms a drag of the selection —
selecting and grabbing are one gesture, so move the pointer and it drags, stay
still and it was only a selection. <kbd>Shift</kbd> (or <kbd>Cmd</kbd>/
<kbd>Ctrl</kbd>) toggles membership, dragging from empty canvas lassos
(`allowMarqueeSelection`), <kbd>Space</kbd> toggles the focused widget, and
<kbd>Escape</kbd> clears.

Selection behaves like focus: it tracks what the user is working with and moves on
as soon as they touch something else — pressing another widget makes that the
selection, and pressing an interactive control inside a widget or moving focus off
the board drops it entirely.

With `"multiple"`, dragging any selected widget moves the whole selection as a
rigid block that reflows by the board's own rules — the same compaction a single
widget gets, so a group can never be parked in empty space on a `vertical` board
and the widgets around it close the gap in the same frame. Every widget travels by the same delta, the group clamps against the
grid edge as a unit instead of collapsing into it, a frame that cannot be placed
is rejected outright rather than partially applied, and the move commits through a
single `onLayoutChange`. Arrow keys move the group too. `BoardInteractionInfo`
gains `items`, `oldItems` and `placeholders` describing the whole gesture; the
existing `item` / `oldItem` / `placeholder` fields are unchanged, and a board with
no selection behaves exactly as before.

The `selectionCancel` selector (board- or widget-level, defaulting to the exported
`BOARD_SELECTION_CANCEL`) marks interactive descendants; `[data-no-select]` opts
out a custom control. On a selectable board it also gates dragging, which fixes a
long-standing trap: `useMove`'s pointer-down calls `preventDefault()`, so without
a `dragCancel` an `input` inside a widget could not be focused or typed into.
Selected widgets are drawn with a `#primary-border` border and a `#primary` ring —
an edge treatment rather than a fill, since selection reads as a focus-like state;
`outline` stays reserved for the real focus ring. Widgets get a `selected`
modifier you can restyle through `widgetProps.styles`.

`onWidgetsDelete` reports a <kbd>Delete</kbd>/<kbd>Backspace</kbd> press with a
non-empty selection. Board never mutates the layout itself, so removal stays
yours to implement and to make undoable.

Accessibility: widget hosts are now `role="group"` with an accessible name from
the new `Board.Widget` `aria-label` prop (falling back to `qa`, then the layout
id). `aria-roledescription` is now localized rather than hardcoded English — it
was previously also invalid, sitting on a role-less element. Selected widgets are
described as "Selected", and selection changes are announced through a polite live
region.

Widget hosts also expose `data-board-widget-id` and `data-selected`.

**Behavior change:** `Board.Widget` no longer clips its content unless it is a
card. A borderless widget (`isCard={false}`, the default) previously had
`overflow: hidden`, which cropped any `outline` a descendant drew for its focused
or active state. Card widgets still clip to their border. If you relied on the old
clipping, set `widgetProps={{ overflow: 'hidden' }}` on the board or
`overflow="hidden"` on the widget.
