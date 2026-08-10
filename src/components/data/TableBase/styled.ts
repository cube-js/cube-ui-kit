import { keyframes, tasty } from '@tenphi/tasty';

import { Item } from '../../content/Item';

import type { Styles } from '@tenphi/tasty';

/**
 * Geometry shared by the three row groups. They cannot share a sub-element key,
 * so they share a const — the same technique `Item.tsx` uses for
 * `DEFAULT_ICON_STYLES` / `ADDITION_STYLES`.
 */
/**
 * The refresh sweep: a band of reduced opacity travelling left to right, the
 * way ag-grid marks a grid that is reloading.
 *
 * A mask rather than a coloured overlay, so the band genuinely lowers the
 * content's opacity instead of painting a surface-coloured stripe over it. That
 * costs nothing in theming — the gradient is pure black and alpha, with no
 * colour token to resolve — and it stays correct on any backdrop.
 *
 * `mask-position` runs 100% → 0% because a mask wider than its box moves the
 * OPPOSITE way to the position value: raising it slides the image left, which
 * would send the band right to left.
 */
const refreshSweep = keyframes({
  '0%': { 'mask-position': '100% 0' },
  '100%': { 'mask-position': '0% 0' },
});

const ROW_STYLES: Styles = {
  // The stretched `rowLink` anchor positions against this.
  position: 'relative',
};

const CELL_STYLES: Styles = {
  boxSizing: 'border-box',
  // Row height lives on the CELLS, not the `<tr>`: table layout ignores
  // `min-height` on a row, and sizes it from its cells instead. `height` on a
  // cell is treated as a minimum, so a wrapping or auto-height cell still grows
  // the row.
  //
  // Cells are `border-box` and carry the 1px row separator, so the border is
  // added on top: `$row-height` is the content box, and a default row occupies
  // 41px in total.
  height: '($row-height + 1bw)',
  padding: '$cell-padding-y $cell-padding-x',
  textAlign: {
    '': 'start',
    '@own(align=center)': 'center',
    '@own(align=end)': 'end',
  },
  verticalAlign: 'middle',
  overflow: 'hidden',
  // An `autoHeight` column wraps and lets its row grow. `height` on a cell is a
  // minimum in table layout, so the declared row height stays the floor.
  whiteSpace: { '': 'nowrap', '@own(wrap)': 'normal' },
  paddingBlock: { '': '$cell-padding-y', '@own(wrap)': '1x' },
  // The checkbox column is a square affordance, not content: it centres its
  // control and contributes no inline padding of its own.
  paddingInline: {
    '': '$cell-padding-x',
    '@own(kind=selection) | @own(kind=actions)': 0,
  },
  // Pinned cells overlay the scrolling ones, so they must be opaque. Reading
  // the row's inherited paint tokens means every row state is matched for free
  // — no duplicated state matrix, no chance of the two drifting apart.
  // Reading the row's inherited paint tokens means every row state is matched
  // for free. A selected cell steps out of that and takes a flat accent tint:
  // without it a wide range is a mesh of per-cell rings rather than one block,
  // and the row's hover would keep moving underneath a selection the user has
  // already committed to.
  fill: {
    '': '#row-base #row-overlay',
    '@own(cell-selected)': '#row-base #purple.10',
  },
  color: '#row-text',
  opacity: '$dim',
  position: { '': 'static', '@own(pin=start | pin=end)': 'sticky' },
  insetInlineStart: { '': 'auto', '@own(pin=start)': '$pin-offset' },
  insetInlineEnd: { '': 'auto', '@own(pin=end)': '$pin-offset' },
  zIndex: { '': 'auto', '@own(pin=start | pin=end)': 1 },
  // The innermost pinned column needs an edge, or content scrolling underneath
  // reads as part of the pinned group. An inset box-shadow rather than a border
  // so it costs no column width, and `#border` rather than `#shadow` so it
  // matches the row dividers instead of reading as a hard black line on a dark
  // surface.
  // The pinned column's edge, and the selected cell's ring. Both are inset
  // shadows and both share this map, so the two compose rather than one
  // clobbering the other on a pinned selected cell.
  //
  // The ring is a shadow rather than an `outline`: an outline is drawn OUTSIDE
  // the box, and pulling it back with a negative `outlineOffset` needs a value
  // tasty will not resolve (`-1bw`), so the ring came out a pixel oversized on
  // every side — over the row divider above and the column rule to the left. An
  // inset shadow lands exactly on the cell's own edges and costs no layout.
  shadow: {
    '': false,
    '@own(pin-edge) & @own(pin=start)': 'inset -1bw 0 0 0 #border',
    '@own(pin-edge) & @own(pin=end)': 'inset 1bw 0 0 0 #border',
    '@own(cell-selected)': 'inset 0 0 0 1bw #purple',
    '@own(cell-selected) & @own(pin-edge) & @own(pin=start)':
      'inset 0 0 0 1bw #purple, inset -1bw 0 0 0 #border',
    '@own(cell-selected) & @own(pin-edge) & @own(pin=end)':
      'inset 0 0 0 1bw #purple, inset 1bw 0 0 0 #border',
  },
  // The frame's rounded corner, mirrored onto the cell that meets it. Without
  // it a selected cell there has its ring sliced off at 45°, since the root
  // clips with a radius. One border-width smaller than the frame's, because the
  // cell sits inside the frame's own border.
  radius: {
    '': 0,
    // `1cr` is the card radius (`--card-radius`), used directly rather than
    // aliased onto a token of our own — and emphatically not onto `$radius`,
    // which is the kit's GLOBAL radius. Declaring that here handed every
    // Button, Input and Tag rendered inside a cell the card's 10px instead of
    // the 6px they inherit everywhere else, and took every `1r`/`2r` unit in
    // the subtree with it.
    '@own(corner=start)': '(1cr - 1bw) bottom-left',
    '@own(corner=end)': '(1cr - 1bw) bottom-right',
  },
  // The vertical rule, resolved in two steps so the border maps below stay
  // small. `$column-rule` is the TABLE's answer (root-level `column-dividers`);
  // this narrows it per cell.
  //
  // A WIDTH rather than a colour. A transparent 1px border still occupies its
  // px: with `border-box` cells that quietly took a pixel of content width from
  // every column of every table, dividers or not.
  //
  // The trailing column is exempt: its rule lands flush against the frame in
  // `card` shape and reads as a doubled edge, and in `plain` shape it is a line
  // hanging off the end of the table with nothing after it.
  '$column-divider': { '': '$column-rule', '@own(last-column)': '0px' },
  transition: 'fill',
};

export const TableElement = tasty({
  qa: 'Table',
  styles: {
    /* ── tokens the root owns ─────────────────────────────────────────── */
    // Rows are 40px at the default size and the header is one step tighter at
    // 32px — the proportion the Cloud tables use. Each is the content height;
    // the 1px separator is added on top (see `CELL_STYLES.height`).
    '$row-height': {
      '': '$size-lg',
      'size=xsmall': '$size-sm',
      'size=small': '$size-md',
      'size=large': '$size-xl',
      'size=xlarge': '7x',
    },
    '$header-height': {
      '': '$size-md',
      'size=xsmall': '$size-xs',
      'size=small': '$size-sm',
      'size=large': '$size-lg',
      'size=xlarge': '$size-xl',
    },
    // 16px. Matches the `cellHorizontalPadding` the Cloud tables ship (ag-grid's
    // own default is 15px, which is off the 8px grid).
    '$cell-padding-x': '2x',
    '$cell-padding-y': 0,
    '$pin-offset': '0px',
    $dim: 1,
    '$link-decoration': 'none',
    '$resizer-hit': '1x',
    '$resizer-offset': '-.5x',
    '$resizer-line-width': '1bw',
    '#resizer-line': '#clear',
    // Vertical rules between columns: on for a grid read down a column, off for
    // a list read across a row. See `TableView`'s `hasColumnDividers`.
    '$column-rule': { '': '0px', 'column-dividers': '1bw' },
    // Neutral defaults so a cell rendered outside a row still paints sanely.
    '#row-base': '#surface',
    '#row-overlay': '#clear',
    '#row-text': '#surface-text',

    /* ── frame ────────────────────────────────────────────────────────── */
    display: 'grid',
    gridRows: 'max-content minmax(0, 1fr) max-content',
    gridColumns: 'minmax(0, 1fr)',
    position: 'relative',
    boxSizing: 'border-box',
    fill: '#surface',
    color: '#surface-text',
    radius: { '': 0, 'shape=card': '1cr' },
    border: { '': false, 'shape=card': true },
    overflow: 'hidden',
    // Bounded by the consumer (`height` / `maxHeight`). There is no page-scroll
    // mode: an unbounded table simply sizes to its content.
    height: 'max 100%',

    /* ── the single scroller ──────────────────────────────────────────── */
    Scroller: {
      $: '>',
      gridRow: 2,
      position: 'relative',
      overflow: 'auto',
      // A reserved gutter stops an appearing scrollbar from reflowing every
      // column. With one scroller for head and body there is nothing else to
      // keep in sync — this is the whole reason for the native-table design.
      scrollbar: 'thin stable',
      // Locked per axis, and only on an axis that can actually scroll.
      //
      // `none` rather than `contain`: both stop a swipe at the scroll edge from
      // chaining to the page — which is what keeps a horizontal flick from
      // triggering browser back-navigation — but `contain` still allows the
      // rubber-band bounce, and bouncing a table drags its rows away from the
      // sticky header and shows blank surface behind them.
      //
      // The non-scrollable axis stays `auto` on purpose. Chrome applies
      // overscroll rules to any `overflow: auto` element, including one whose
      // content fits, so locking both axes unconditionally makes a five-row
      // table swallow the wheel and pin the page behind it.
      // While a range drag is in progress the pointer is painting cells, not
      // text — without this a drag across the grid leaves every cell it passed
      // highlighted blue underneath the range.
      userSelect: { '': 'auto', 'range-dragging': 'none' },
      overscrollBehavior: {
        '': 'auto',
        'scroll-x & scroll-y': 'none',
        'scroll-x & !scroll-y': 'none auto',
        '!scroll-x & scroll-y': 'auto none',
      },
    },

    Table: {
      $: '> Scroller >',
      // The whole table fades while a refresh is in flight — header included.
      // Dimming only the rows left the header at full strength, which read as
      // though the columns were current and only the data was not.
      opacity: { '': 1, stale: 0.5 },
      maskImage: {
        '': 'none',
        stale:
          'linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 35%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,1) 65%, rgba(0,0,0,1) 100%)',
        // A flat, fully opaque mask is a no-op, so there is nothing to sweep —
        // the table still fades, it just does not move. A loading state can
        // last a long time, and this one would otherwise animate continuously
        // beside the data with no way to stop it. Written as its own gradient
        // rather than `none` so it cannot merge with the default above.
        '@media(prefers-reduced-motion)':
          'linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 100%)',
      },
      // Three times the width, so the band is a third of the table and there is
      // an opaque stretch either side of it. The default `repeat` tiles
      // seamlessly, both ends of the gradient being fully opaque.
      maskSize: '300% 100%',
      animation: {
        '': 'none',
        stale: `${refreshSweep} 1.4s linear infinite`,
      },
      // Belt and braces with the flat mask above, and the same shape `Spin`
      // already uses.
      animationPlayState: {
        '': 'running',
        '@media(prefers-reduced-motion)': 'paused',
      },
      transition: 'opacity',
      // `fixed` makes `<colgroup>` authoritative, so the header and the body
      // are guaranteed to agree on every column width.
      tableLayout: 'fixed',
      // `separate` is required: with `collapse`, a sticky `<thead>` loses its
      // borders and they scroll away with the content.
      borderCollapse: 'separate',
      borderSpacing: 0,
      // The exact width is set inline from the resolved layout; this is only
      // the pre-measurement fallback.
      width: '100%',
      preset: 't3',
    },

    /* ── head ─────────────────────────────────────────────────────────── */
    Head: {
      $: '> Scroller > Table >',
      position: { '': 'static', 'sticky-header': 'sticky' },
      inset: { '': 'auto', 'sticky-header': '0 top' },
      zIndex: 2,
    },
    HeadRow: {
      $: '> Scroller > Table > Head >',
      ...ROW_STYLES,
      // Header rows never carry interaction paint; neutralise the inherited
      // tokens so nothing can leak in from a row above.
      '#row-base': '#surface-2',
      '#row-overlay': '#clear',
      '#row-text': '#dark-03',
      $dim: 1,
    },
    HeaderCell: {
      $: '> Scroller > Table > Head > HeadRow >',
      ...CELL_STYLES,
      // No padding at all: the `Item` inside fills the cell edge to edge and
      // supplies the indent itself, per side. That is what lets a leading icon
      // sit tighter than text and a trailing icon sit flush — see
      // `TableHeaderItem`.
      //
      // `paddingInline` as well as the shorthand: the shared cell styles set
      // the longhand for the checkbox column, and a longhand arriving through
      // the spread outlives a `padding: 0` written after it.
      padding: 0,
      paddingInline: 0,
      height: '($header-height + 1bw)',
      // The header's typography lives here rather than on the `Item`, so a
      // consumer can restyle it through `headerCellStyles` / `styles.HeaderCell`.
      // The adapter supplies the real default via `headerPreset`; this is only
      // the fallback for a `TableView` rendered without one.
      preset: 't3m',
      border: '1bw #border bottom, $column-divider #border right',
      zIndex: { '': 'auto', '@own(pin=start | pin=end)': 3 },
      fill: {
        '': '#row-base #row-overlay',
        '@own(sortable) & @own(:hover)': '#row-base #surface-text.04',
      },
      cursor: { '': 'default', '@own(sortable)': 'pointer' },
      userSelect: 'none',
      // The containing block for `Resizer`. Cells are `static` by default, so
      // without this every handle resolves against the scroller instead and
      // they all stack up at its right edge.
      position: { '': 'relative', '@own(pin=start | pin=end)': 'sticky' },
      // A cell clips its overflow so a long label cannot bleed into its
      // neighbour, but the resize handle straddles the boundary on purpose and
      // would lose its outer half. Only cells that actually have one opt out.
      overflow: { '': 'hidden', '@own(resizable)': 'visible' },
      // How far the handle hangs past this cell's trailing edge — read by
      // `Resizer`. Published as an inherited custom property rather than asked
      // for from the handle with `@parent(...)`: a sub-element's state keys
      // resolve against the ROOT, so the handle cannot ask about the cell it
      // sits in (the same reason `#row-base` and `$link-decoration` exist).
      //
      // The trailing column has no neighbour to straddle. Left hanging, it puts
      // half its width past the table and the scroller gains a few pixels of
      // horizontal scroll onto blank space.
      '$resizer-offset': { '': '-.5x', '@own(last-column)': '0px' },
    },

    /**
     * The column resize handle, on the header cell's trailing edge.
     *
     * Positioned with longhands rather than an `inset` shorthand: the
     * arithmetic form compiled to garbage (`32px -24px 1px 16px`), which put
     * the handle inside the body and collapsed its height. It sits fully inside
     * the cell, so there is no negative offset to get wrong.
     */
    Resizer: {
      $: '> Scroller > Table > Head > HeadRow > HeaderCell >',
      position: 'absolute',
      top: 0,
      bottom: 0,
      // Centred on the boundary rather than tucked inside the cell: a handle
      // you can only grab from one side of the line is half a target, and the
      // focus ring would sit visibly off to the left of the edge it resizes.
      // The offset is half of `$resizer-hit`.
      right: '$resizer-offset',
      // A 1px line is impossible to grab, so the hit area is wider than it.
      width: '$resizer-hit',
      zIndex: 2,
      cursor: 'col-resize',
      touchAction: 'none',
      outline: {
        '': 'none',
        '@own(:focus-visible)': '1bw #focus',
      },
      outlineOffset: '1bw',

      /**
       * The line is a real child, not `&::after`: state maps inside a
       * pseudo-element block do not compile — `width` and `fill` both came out
       * empty — so the handle's own state is published as tokens instead, the
       * same mechanism `#row-base` and `$link-decoration` use.
       */
      // Drawn at rest so the handle is discoverable — except when the table
      // already rules its columns, where the cell's own border is that line and
      // a second one 4px away reads as a doubled edge. (`column-dividers` has no
      // `@own`: bare keys resolve against the root, which is where it lives.)
      '#resizer-line': {
        '': '#border',
        'column-dividers': '#clear',
        '@own(:hover) | @own(:focus-visible)': '#purple',
      },
      '$resizer-line-width': {
        '': '1bw',
        '@own(:hover) | @own(:focus-visible)': '2bw',
      },
    },

    /**
     * The visible column edge. Drawn at rest rather than only on hover — an
     * affordance you have to find by hovering an 8px strip is one nobody finds.
     * A table that rules its columns already draws that edge, so there the line
     * only appears under the cursor (see `#resizer-line`).
     */
    ResizerLine: {
      $: '> Scroller > Table > Head > HeadRow > HeaderCell > Resizer >',
      // Absolute rather than flex-aligned: `placeContent` maps to
      // `align-content justify-content`, so the obvious-looking `'end center'`
      // silently centred the line instead of ending it.
      //
      // Centred inside the handle, which is itself centred on the boundary, so
      // the line lands exactly on the edge it represents and a thicker hover
      // state grows evenly to both sides.
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: '50%',
      translate: '-50% 0',
      width: '$resizer-line-width',
      fill: '#resizer-line',
      transition: 'theme',
    },

    /**
     * Centres the checkbox in its cell. A `<td>` cannot be a flex container
     * without dropping out of table layout, so the centring lives on a wrapper
     * inside it.
     *
     * Descendant rather than direct-child, so one entry covers both the header
     * cell and the body cells.
     */
    /**
     * The stretched row link. A `<tr>` cannot be wrapped in an `<a>`, so the
     * anchor sits in the row-header cell and covers the row through `inset`.
     * Its text comes from the row-header cell, so the accessible name is the
     * row's name rather than "link".
     *
     * Below the cells' own content in the stacking order, so an in-cell button
     * or menu trigger still takes its own clicks.
     */
    RowLink: {
      $: '> Scroller > Table > Body > Row > Cell >',
      position: 'absolute',
      inset: 0,
      zIndex: 0,
      // The row already paints hover and focus; the link must add nothing.
      fill: '#clear',
      radius: 0,
      outline: {
        '': 'none',
        // Keyboard focus still has to be visible, even though the row is what
        // the user perceives as focused.
        focused: '1bw #focus',
      },
    },

    /**
     * The line showing where a dragged row would land.
     *
     * Its own row, because a native table cannot hold an arbitrary element
     * between two rows — the shape `ListBox` uses with `<li>`.
     *
     * The row and its cell collapse to nothing and the line is positioned out
     * of flow, so inserting one mid-drag does not push the rows apart. The line
     * then sits *over* the divider it replaces rather than beside it.
     */
    DropIndicatorRow: {
      $: '> Scroller > Table > Body >',
      height: 0,
    },

    DropIndicatorCell: {
      $: '> Scroller > Table > Body > DropIndicatorRow >',
      // Every one of these matters: a `<td>` carries UA padding, and any of
      // them left in place gives the row real height and shifts the table.
      padding: 0,
      border: 0,
      height: 0,
      lineHeight: 0,
      fontSize: 0,
      // The containing block for the line below.
      position: 'relative',
      overflow: 'visible',
    },

    DropIndicator: {
      $: '> Scroller > Table > Body > DropIndicatorRow > DropIndicatorCell >',
      position: 'absolute',
      insetInlineStart: 0,
      insetInlineEnd: 0,
      top: 0,
      height: '2bw',
      // Centred on the boundary, so it covers the row divider instead of
      // sitting above or below it.
      translate: '0 -50%',
      fill: '#purple',
      radius: '1r',
      zIndex: 3,
      outline: {
        '': 'none',
        // `@own`, not a bare `:focus-visible`: a sub-element's state keys
        // resolve against the ROOT, so the plain form asked whether the whole
        // table was focused. This is the keyboard drop target and needs its own.
        '@own(:focus-visible)': '2bw #purple',
      },
      outlineOffset: '1bw',
    },

    /**
     * Row numbers. Muted and tabular so they read as a ruler down the side
     * rather than as a data column competing with the real ones.
     */
    RowNumber: {
      $: '> Scroller > Table > Body > Row > Cell',
      color: '#surface-text-soft',
      fontVariantNumeric: 'tabular-nums',
    },

    /** Wraps the `⋮` trigger so it centres without becoming a table cell box. */
    RowActions: {
      $: '> Scroller > Table > Body > Row > Cell >',
      position: 'relative',
      // Above `RowLink`, or the stretched anchor would swallow its clicks.
      zIndex: 1,
      display: 'flex',
      placeContent: 'center',
      placeItems: 'center',
      height: '100%',
    },

    SelectionBox: {
      $: '> Scroller > Table',
      display: 'flex',
      placeContent: 'center',
      placeItems: 'center',
      height: '100%',
    },

    /**
     * The sort arrow. Lives in the header `Item`'s `suffix`, so it participates
     * in the header's grid rather than overlapping the label. Reserved space
     * even when unsorted — otherwise the label shifts on every sort.
     */
    SortIndicator: {
      // Descendant, not direct child: the indicator is handed to the header
      // `Item` as a slot, so it renders inside Item's own `RightIcon` (or
      // `Suffix`) wrapper rather than directly under the `<th>`.
      $: '> Scroller > Table > Head > HeadRow > HeaderCell',
      display: 'grid',
      placeItems: 'center',
      width: '2x',
      height: '2x',
      color: '#surface-text',
      opacity: {
        '': 0,
        '@own(sorted)': 1,
      },
      // `scale` rather than `rotate`: a chevron flipped by 180° reads as the
      // same glyph moved, which is harder to track than one that flips.
      scale: { '': '1 1', '@own(dir=desc)': '1 -1' },
      transition: 'opacity, scale',
    },

    /* ── body ─────────────────────────────────────────────────────────── */
    Body: {
      $: '> Scroller > Table >',
    },
    Row: {
      $: '> Scroller > Table > Body >',
      ...ROW_STYLES,
      // `position: relative` (below) is also the containing block for
      // `RowLink`, which stretches over the whole row from inside the
      // row-header cell, and for the drop indicator.
      /**
       * Totals and subtotals, pinned to the edges of the scroller.
       *
       * They live in `<tbody>` so they keep ordinary row styling, so the
       * stickiness has to be stated here. The top offset is the header's own
       * height — a pinned row sticks *under* the header, not over it.
       */
      position: { '': 'relative', '@own(pinned)': 'sticky' },
      insetBlockStart: {
        '': 'auto',
        '@own(pinned=top)': '($header-height + 1bw)',
      },
      insetBlockEnd: { '': 'auto', '@own(pinned=bottom)': 0 },
      zIndex: { '': 'auto', '@own(pinned)': 1 },

      // The row being dragged, and a row that would receive a drop *on* it.
      // Landing *between* rows is drawn by `DropIndicator` instead.
      opacity: { '': 1, '@own(dragging)': 0.4 },
      // An inset shadow rather than an outline: an outline on a `<tr>` is drawn
      // outside the row and overlaps its neighbours, and `inside` is not a
      // modifier `outline` accepts.
      shadow: {
        '': false,
        '@own(drop-target)': 'inset 0 0 0 2bw #purple',
      },
      cursor: {
        '': 'default',
        '@own(clickable)': 'pointer',
        '@own(draggable)': 'grab',
        '@own(dragging)': 'grabbing',
      },

      /* ─── the row state matrix ─────────────────────────────────────────
       * Three orthogonal maps rather than one. Deliberate: tasty coalesces
       * entries in a single state map that share a serialized value, promoting
       * them to the group's maximum priority and negating them against
       * everything below — which silently turns a middle-priority compound
       * rule into FALSE (see src/data/AGENTS.md). A combined
       * `selected × hovered × focused × disabled × dimmed × odd` map is 64
       * entries and would be riddled with collisions.
       *
       *   1. `odd` lives alone in `#row-base`, with two distinct values.
       *   2. `dimmed` never appears in a fill map — it drives `$dim`/`#row-text`.
       *   3. Every value string inside `#row-overlay` is unique.
       *   4. The bare '' default is exempt from merging, so it may repeat a
       *      value used elsewhere.
       * ────────────────────────────────────────────────────────────────── */
      '#row-base': {
        '': '#surface',
        '@own(odd)': '#surface-2',
        // Opaque and distinct, because scrolling rows pass underneath it.
        '@own(pinned)': '#surface-3',
      },
      '#row-overlay': {
        '': '#surface-text.0',
        '@own(:hover)': '#surface-text.04',
        '@own(focused)': '#surface-text.06',
        '@own(selected)': '#surface-text.09',
        '@own(selected & :hover)': '#surface-text.12',
        '@own(drop-target)': '#purple.10',
        '@own(disabled)': '#surface-text.02',
      },
      '#row-text': {
        '': '#surface-text',
        '@own(dimmed)': '#surface-text-soft',
        '@own(disabled)': '#surface-text-soft-2',
      },
      $dim: {
        '': 1,
        '@own(dimmed)': 0.6,
      },
      // Read by a row-header cell that carries a `rowLink`.
      '$link-decoration': {
        '': 'none',
        '@own(:hover)': 'underline',
      },
    },
    Cell: {
      $: '> Scroller > Table > Body > Row >',
      ...CELL_STYLES,
      // A row-header cell is a `<th>`, which the UA renders bold. Weight is the
      // table's decision, not the tag's — and a UA rule beats inheritance, so it
      // has to be stated. Deliberately NOT in the shared cell styles: the header
      // cell is a `<th>` as well, and there this would overwrite the weight its
      // `preset` sets.
      fontWeight: {
        '': 'inherit',
        // A row-header cell carrying a `rowLink` reads as a link, so it takes
        // the weight `Link` does — colour alone is easy to miss in a dense
        // table, and there is nothing else marking the row as navigable.
        '@own(link)': 600,
      },
      color: {
        '': '#row-text',
        '@own(link)': '#purple-text',
      },
      // Underline only while the row is hovered, matching how the kit's `Link`
      // stays undecorated at rest.
      //
      // Read from a token the Row publishes rather than asking about the row
      // from here: a sub-element's state keys resolve against the *root*, and
      // `@parent(:hover)` did not constrain the rule at all — every linked cell
      // came out underlined. Custom properties inherit through the DOM and
      // ignore selector context, which is the same mechanism `$dim` and
      // `#row-text` already use.
      textDecoration: {
        '': 'none',
        '@own(link)': '$link-decoration',
      },
      // A bottom border separates two rows, so the last row has nothing to
      // separate from. Whenever something else already draws that closing edge
      // — the frame in `card` shape, or the footer's own top border — the row's
      // border lands on top of it and reads as one thick 2px line.
      //
      // `last-row` is stamped on the cell by the renderer rather than derived
      // in CSS, for two reasons:
      //
      //   1. Virtualization. The window is padded with spacer `<tr>`s, so
      //      mid-scroll the last *mounted* row is not `:last-child` — the
      //      trailing spacer is. A structural selector would move the missing
      //      border around as you scroll; the stamped flag always marks the
      //      last row of the DATA.
      //   2. `@parent(:last-child, >)` asks "is my parent the last child of my
      //      grandparent". Asked from the Row that is a question about the
      //      table body, identical for every row, and an ancestor-constant
      //      condition inside a mutually-exclusive map silently deletes the
      //      default's `:not(...)` branch — which is how an earlier attempt
      //      removed every divider at once. (`@own(:last-child)` is the form
      //      that varies per row, but see 1.)
      //
      // `column-dividers` has no `@own`: a sub-element's bare state keys resolve
      // against the ROOT, which is exactly right here — the vertical rule is a
      // property of the table, not of one cell.
      //
      // Every value string is distinct, which is what keeps this map safe from
      // tasty's identical-value merge (see src/data/AGENTS.md). That is also why
      // the two "no closing edge" cases used to be OR'd into one key; the state
      // row no longer needs it, since it is a `StateCell` rather than a `Cell`.
      // Two groups, so the horizontal and the vertical rule vary independently:
      // the trailing group's width is `$column-divider`, which already knows
      // whether this table rules its columns and whether this is the last one.
      // Directions a group does not name come out zero-width, which is how the
      // middle entry drops the bottom edge without touching the rule.
      //
      // Three entries, three distinct values — a map whose entries share a
      // serialized value gets merged and negated against everything below it
      // (see src/data/AGENTS.md), which is what an exhaustive
      // dividers × last-column × last-row matrix would have walked into.
      border: {
        '': '1bw #border bottom, $column-divider #border right',
        // The frame or the footer already draws the closing edge; a second one
        // on top of it reads as a single 2px line.
        '(shape=card | has-footer) & @own(last-row)':
          '$column-divider #border right',
        // A pinned bottom row opens the pinned group, so the divider goes above
        // it — the last scrolling row has already dropped its own bottom edge,
        // and a total sitting at the frame's edge needs nothing below.
        '@own(pinned=bottom)': '1bw #border top, $column-divider #border right',
      },
    },

    /**
     * The single full-span cell that carries the empty / no-results / error
     * content.
     *
     * Deliberately NOT a `Cell`: a `Cell` paints `#row-base`/`#row-overlay`, so
     * the state content picked up the row's banding and hover fill and lit up
     * under the cursor as though it were a row of data to click. It is not a
     * row, so it does not read the row's paint tokens at all.
     */
    StateCell: {
      $: '> Scroller > Table > Body > Row >',
      boxSizing: 'border-box',
      fill: '#surface',
      color: '#surface-text',
      border: false,
      textAlign: 'center',
      verticalAlign: 'middle',
    },

    /**
     * Empty / no-results / error content. Rendered as a full-span cell inside
     * the table rather than as an absolutely-positioned overlay, so the column
     * header stays visible and nothing has to be excluded from the scroll area.
     */
    StateContent: {
      $: '> Scroller > Table > Body > Row > StateCell >',
      display: 'grid',
      placeItems: 'center',
      placeContent: 'center',
      gap: '1x',
      padding: '8x 2x',
      preset: 't3',
      color: '#surface-text-soft',
      textAlign: 'center',
    },

    /* ── foot (pinned totals) ─────────────────────────────────────────── */
    /* ── consumer overlay ─────────────────────────────────────────────── */
    /**
     * Sits over the Scroller, not inside it, so it stays put while the rows
     * underneath remain scrollable and readable.
     *
     * A refresh does NOT use this — it sweeps the table itself (see `Table`).
     * A spinner parked in the middle of the rows covered the very content the
     * "keep showing the previous result" behaviour exists to preserve.
     */
    Overlay: {
      $: '>',
      gridRow: 2,
      position: 'absolute',
      inset: 0,
      display: 'flex',
      placeContent: 'center',
      placeItems: 'center',
      // No scrim: the body already dims itself, and a second layer of dimming
      // over the same rows only makes the previous result harder to read — the
      // one thing this behaviour exists to preserve.
      zIndex: 3,
      pointerEvents: 'none',
    },

    Foot: {
      $: '> Scroller > Table >',
      position: 'sticky',
      inset: '0 bottom',
      zIndex: 2,
    },
    FootRow: {
      $: '> Scroller > Table > Foot >',
      ...ROW_STYLES,
      '#row-base': '#surface-2',
      '#row-overlay': '#clear',
      '#row-text': '#surface-text',
      $dim: 1,
    },
    FootCell: {
      $: '> Scroller > Table > Foot > FootRow >',
      ...CELL_STYLES,
      border: '1bw #border top',
      preset: 't3m',
    },
  },
});

/**
 * The header cell's content. `Item` lives INSIDE the `<th>`, never as the `<th>`
 * itself — it emits `aria-selected` unconditionally (`Item.tsx:964`), which on a
 * `columnheader` would claim the column is selected rather than sorted.
 *
 * Keeping it inside also means the `<th>` owns the interaction fill while
 * `Item` contributes only layout, and — the real prize — `Item`'s `Actions`
 * slot already stops click/pointer/Enter/Space propagation, so pressing a
 * column menu can never trigger the sort.
 */
export const TableHeaderItem = tasty(Item, {
  as: 'div',
  // Deliberately NOT `type="header"`. That maps Item's preset onto the heading
  // scale via state rules that outrank a plain override, and it renders the
  // label as an `<h3>`, which would put every column name into the document
  // outline.
  styles: {
    // `Item` is `inline-grid`; the header cell needs it to fill the `<th>`
    // horizontally. Same fix as `TreeRowItem` in Tree/styled.ts. Its height is
    // left alone so it keeps its natural `medium` size rather than stretching
    // to whatever the row height happens to be.
    display: 'grid',
    width: '100%',
    radius: 0,
    // `Item` reserves a 1px transparent border for its focus/hover treatments.
    // The `<th>` owns those here, and the border would inset the label by 1px
    // against the body cells below.
    border: 0,
    // Typography and colour are the header CELL's decision, so they stay
    // overridable through the table's own `styles`. See `HeaderCell`.
    preset: 'inherit',
    color: 'inherit',
    // Zero: `Item` applies this to the label only, which would indent the label
    // but not an icon beside it. The padding below sits on the `Item` box
    // instead, so it moves whatever is actually first in the row.
    '$inline-padding': 0,

    /**
     * The indent, per side, chosen for optical rather than geometric alignment.
     *
     * Text lines up with the body text below it at the full cell padding. An
     * icon does not: at this size it is a small, light shape, and the same 16px
     * reads as a gap — 8px sits right. A trailing icon (the sort arrow) wants
     * none at all, so it hangs at the column edge rather than floating short of
     * it.
     *
     * The `padding` shorthand rather than `paddingInline`: `Item` writes its own
     * `padding`, and a shorthand landing after a longhand wipes it — the
     * longhand form compiled away silently and every column kept the default.
     *
     * One map rather than per-side rules so the four combinations stay
     * explicit, and every value string is distinct — a state map whose entries
     * share a serialized value gets merged and negated (see
     * src/data/AGENTS.md).
     */
    padding: {
      '': '0 $cell-padding-x',
      'has-icon': '1x left, $cell-padding-x right',
      'has-right-icon': '$cell-padding-x left',
      'has-icon & has-right-icon': '1x left',
    },
    // The `<th>` owns the interaction paint — neutralise Item's own ramp so the
    // two do not stack.
    fill: {
      '': '#clear',
      hovered: '#clear',
      pressed: '#clear',
      selected: '#clear',
    },
    // The default `c2` header preset uppercases its text. That is right for the
    // column name and wrong for the sentence explaining it.
    Description: { textTransform: 'none' },
  },
});
