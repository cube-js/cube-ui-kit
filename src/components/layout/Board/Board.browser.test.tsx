import { renderWithRoot, screen, userEvent } from '../../../test';

import { Board } from './index';

import type { LayoutItem } from './grid-core';

/**
 * Board in a real browser.
 *
 * The jsdom suite covers the wiring, and it has to mock every rectangle to do
 * it — which is exactly the wrong tool for two questions. Whether the band
 * `extraRows` reserves is really board (rather than a number in an inline
 * style) is a hit-testing question, and hit-testing needs a browser. Whether a
 * group survives being dragged across other widgets is a pointer question, and
 * the geometry that decides it comes from real measured rects.
 */

const ROW = 100;

/** A widget per layout item, `qa` upper-cased so `screen.getByTestId` is terse. */
function renderBoard(
  layout: LayoutItem[],
  props: Record<string, unknown> = {},
  widgetProps: Record<string, Record<string, unknown>> = {},
  containerWidth = 600,
) {
  const result = renderWithRoot(
    <div style={{ width: `${containerWidth}px` }}>
      <Board
        cols={12}
        rowHeight={ROW}
        margin={[0, 0]}
        containerPadding={[0, 0]}
        selectionMode="multiple"
        defaultLayout={layout}
        {...props}
      >
        {layout.map((item) => (
          <Board.Widget
            key={item.i}
            id={item.i}
            qa={item.i.toUpperCase()}
            {...widgetProps[item.i]}
          >
            {item.i}
          </Board.Widget>
        ))}
      </Board>
    </div>,
  );

  return result;
}

/**
 * One instance per test, rather than the bare `userEvent.*` calls the jsdom
 * suite uses. Each bare call builds a fresh instance with fresh state, so a
 * button pressed in one call is not held in the next and a modifier held in one
 * is not held in the next — both of which a marquee gesture depends on.
 */
let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  // `pointerEventsCheck: 0` because the board deliberately swaps the widget
  // being dragged for an `opacity: 0`, `pointer-events: none` stand-in and
  // renders a clone in the overlay. The release therefore lands on an element
  // that is, correctly, not interactive — refusing to dispatch it would be
  // refusing to finish a gesture the component supports.
  user = userEvent.setup({ pointerEventsCheck: 0 });
});

const board = () => screen.getByTestId('Board');
const widget = (id: string) => screen.getByTestId(id.toUpperCase());
/** The absolutely-positioned layer the marquee handler lives on. */
const content = () => widget('a').parentElement as HTMLElement;

/** Wait for the board to measure its container and lay the widgets out. */
async function settled() {
  await vi.waitFor(() =>
    expect(widget('a').getBoundingClientRect().width).toBeGreaterThan(0),
  );
}

/** Ids top-to-bottom, then left-to-right — "did the group split" in one line. */
function stackOrder(): string[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[data-board-widget-host]'),
  )
    .map((el) => ({
      id: el.getAttribute('data-board-widget-id')!,
      rect: el.getBoundingClientRect(),
    }))
    .sort((a, b) =>
      Math.abs(a.rect.top - b.rect.top) > 1
        ? a.rect.top - b.rect.top
        : a.rect.left - b.rect.left,
    )
    .map((it) => it.id);
}

/**
 * A press-drag-release along a straight line, in a few steps.
 *
 * `pageX`/`pageY` are set alongside the client coords deliberately: React
 * Aria's `useMove` — which owns widget dragging — reads the page pair, and a
 * gesture that only carries client coords looks like a press that never moved.
 */
const coordsAt = (p: { x: number; y: number }) => ({
  clientX: p.x,
  clientY: p.y,
  pageX: p.x,
  pageY: p.y,
});

/** Press and walk to `to` without releasing — for asserting mid-gesture state. */
async function pressAndMove(
  target: HTMLElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
  steps = 4,
) {
  const at = (i: number) => {
    const t = i / steps;

    return coordsAt({
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    });
  };

  await user.pointer([
    { keys: '[MouseLeft>]', target, coords: at(0) },
    ...Array.from({ length: steps }, (_, i) => ({
      target,
      coords: at(i + 1),
    })),
  ]);
}

async function release(target: HTMLElement, at: { x: number; y: number }) {
  await user.pointer([{ keys: '[/MouseLeft]', target, coords: coordsAt(at) }]);
}

async function dragPointer(
  target: HTMLElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
  steps = 4,
) {
  await pressAndMove(target, from, to, steps);
  await release(target, to);
}

/**
 * A marquee gesture in board-relative pixels.
 *
 * The press is aimed at the content layer, the same element the handler sits
 * on, but the coordinates still have to land on empty grid: the handler bails
 * when the press resolves to a widget, and in a real browser the point decides
 * that rather than the mock.
 */
async function marquee(
  from: { x: number; y: number },
  to: { x: number; y: number },
  modifier?: 'Shift' | 'Control',
) {
  const origin = board().getBoundingClientRect();
  const abs = (p: { x: number; y: number }) => ({
    x: origin.left + p.x,
    y: origin.top + p.y,
  });

  if (modifier) await user.keyboard(`{${modifier}>}`);
  await dragPointer(content(), abs(from), abs(to));
  if (modifier) await user.keyboard(`{/${modifier}}`);
}

const TWO_ROWS: LayoutItem[] = [
  { i: 'a', x: 0, y: 0, w: 6, h: 1 },
  { i: 'b', x: 6, y: 0, w: 6, h: 1 },
  { i: 'c', x: 0, y: 1, w: 6, h: 1 },
];

describe('Board extraRows', () => {
  it('hugs its content by default, so there is nothing below to grab', async () => {
    renderBoard(TWO_ROWS);
    await settled();

    expect(board().getBoundingClientRect().height).toBeCloseTo(2 * ROW, 0);
  });

  it('reserves the band as real, hit-testable board surface', async () => {
    renderBoard(TWO_ROWS, { extraRows: 3 });
    await settled();

    const rect = board().getBoundingClientRect();
    expect(rect.height).toBeCloseTo(5 * ROW, 0);

    // The claim `extraRows` actually makes. A point two rows below the last
    // widget has to resolve to something inside the board — an inline
    // `min-height` that nothing can be pressed on would satisfy the jsdom
    // assertions and still leave the marquee undiscoverable.
    const hit = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + 4 * ROW,
    );
    expect(board().contains(hit)).toBe(true);
    expect(hit?.closest('[data-board-widget-host]')).toBeNull();
  });

  it('starts a marquee from the reserved band', async () => {
    const onSelectionChange = vi.fn();
    renderBoard(TWO_ROWS, { extraRows: 3, onSelectionChange });
    await settled();

    const rect = board().getBoundingClientRect();

    // Press below every widget — page background before `extraRows` — and drag
    // back up across the whole grid.
    await dragPointer(
      content(),
      { x: rect.right - 8, y: rect.top + 4.5 * ROW },
      { x: rect.left + 8, y: rect.top + 8 },
    );

    expect(onSelectionChange).toHaveBeenCalledWith(['a', 'b', 'c']);
  });
});

/**
 * Which widgets a band covers is decided by measured rectangles, so these ran
 * in jsdom only by mocking the content layer's rect and hand-computing the
 * intersections against it. Here the rects are the browser's.
 *
 * `extraRows` is on throughout for a reason that is itself the feature: a lasso
 * needs empty grid to start from, and this three-widget layout has almost none
 * without it.
 */
describe('Board resize grip placement', () => {
  /**
   * The one thing jsdom cannot answer here: a widget clips its children
   * (`overflow: hidden`, deliberately), so whether a grip centred on the corner
   * survives at all is a question about real painted geometry, not about which
   * element it was rendered into.
   */
  const layout: LayoutItem[] = [{ i: 'a', x: 2, y: 1, w: 4, h: 2 }];

  async function revealGrips() {
    await settled();
    // Grips only appear on hover/focus/resize.
    await user.hover(widget('a'));
    await vi.waitFor(() =>
      expect(
        screen.getByTestId('BoardResizeGrip').getBoundingClientRect().width,
      ).toBeGreaterThan(0),
    );
  }

  it('keeps the default grip inside the widget box', async () => {
    renderBoard(layout);
    await revealGrips();

    const box = widget('a').getBoundingClientRect();
    const grip = screen.getByTestId('BoardResizeGrip').getBoundingClientRect();

    expect(grip.right).toBeLessThanOrEqual(box.right + 0.5);
    expect(grip.bottom).toBeLessThanOrEqual(box.bottom + 0.5);
  });

  it('centres a corner grip on the widget corner without clipping it', async () => {
    renderBoard(layout, { resizeGripPlacement: 'corner' });
    await revealGrips();

    const box = widget('a').getBoundingClientRect();
    const grip = screen.getByTestId('BoardResizeGrip').getBoundingClientRect();

    // Centred on the corner: half of the grip hangs outside on each axis.
    expect(grip.left + grip.width / 2).toBeCloseTo(box.right, 0);
    expect(grip.top + grip.height / 2).toBeCloseTo(box.bottom, 0);
    // And it is really painted, not clipped away to nothing by the widget box -
    // the whole reason it is drawn outside the widget in the first place.
    expect(grip.width).toBeGreaterThan(0);
    expect(grip.height).toBeGreaterThan(0);
  });

  it('stays revealed and grabbable on the half that hangs outside', async () => {
    renderBoard(layout, { resizeGripPlacement: 'corner' });
    await revealGrips();

    const box = widget('a').getBoundingClientRect();
    // A point just past the widget's corner - on the grip, outside the widget.
    const outside = { x: box.right + 3, y: box.bottom + 3 };

    // Whatever the browser hit-tests there must be the resize hit-zone, or the
    // grip is inviting a gesture that lands somewhere else.
    const hit = document.elementFromPoint(outside.x, outside.y);
    expect(hit?.closest('[data-qa="BoardResizeHandle"]')).not.toBeNull();

    // Drop the hover first, so the next step cannot pass on an attribute that was
    // simply left over from hovering the widget.
    await user.pointer({ target: board(), coords: { x: 2, y: 2 } });
    await vi.waitFor(() =>
      expect(screen.getByTestId('BoardResizeGrip')).not.toHaveAttribute(
        'data-revealed',
      ),
    );

    // Now the overhang on its own has to bring the grip back. The widget is not
    // hovered here, so if this works it is because the hit-zone came out with the
    // grip - otherwise the affordance retreats from the gesture it invites.
    await user.pointer({ target: hit as Element, coords: outside });
    await vi.waitFor(() =>
      expect(screen.getByTestId('BoardResizeGrip')).toHaveAttribute(
        'data-revealed',
      ),
    );
  });
});

describe('Board marquee', () => {
  // cols 6 over 600px -> a(0-200, 0-100)  b(200-400, 0-100)  c(0-200, 100-200),
  // with rows 2-3 left empty by `extraRows`.
  const SELECTION: LayoutItem[] = [
    { i: 'a', x: 0, y: 0, w: 2, h: 1 },
    { i: 'b', x: 2, y: 0, w: 2, h: 1 },
    { i: 'c', x: 0, y: 1, w: 2, h: 1 },
  ];

  const renderMarquee = (
    props: Record<string, unknown> = {},
    widgetProps: Record<string, Record<string, unknown>> = {},
  ) => renderBoard(SELECTION, { cols: 6, extraRows: 2, ...props }, widgetProps);

  /** Empty space right of `b`, down to a point left of it — covers `a` and `b`. */
  const OVER_A_B = [
    { x: 580, y: 20 },
    { x: 20, y: 80 },
  ] as const;
  /** Up the left-hand column from the empty band — covers `a` and `c`, not `b`. */
  const OVER_A_C = [
    { x: 100, y: 380 },
    { x: 50, y: 20 },
  ] as const;

  it('selects every widget the band intersects', async () => {
    const onSelectionChange = vi.fn();
    renderMarquee({ onSelectionChange });
    await settled();

    await marquee(...OVER_A_B);

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenCalledWith(['a', 'b']);
  });

  it('commits once per gesture, not once per pointer frame', async () => {
    const onSelectionChange = vi.fn();
    renderMarquee({ onSelectionChange });
    await settled();

    // `dragPointer` walks the band across several intermediate positions.
    await marquee(...OVER_A_B);

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });

  it('renders the band while dragging and removes it on release', async () => {
    renderMarquee();
    await settled();

    const origin = board().getBoundingClientRect();
    const at = (x: number, y: number) => ({
      clientX: origin.left + x,
      clientY: origin.top + y,
      pageX: origin.left + x,
      pageY: origin.top + y,
    });

    await user.pointer([
      { keys: '[MouseLeft>]', target: content(), coords: at(580, 20) },
      { target: content(), coords: at(300, 60) },
    ]);
    expect(screen.getByTestId('BoardMarquee')).toBeInTheDocument();

    await user.pointer([
      { keys: '[/MouseLeft]', target: content(), coords: at(300, 60) },
    ]);
    expect(screen.queryByTestId('BoardMarquee')).not.toBeInTheDocument();
  });

  /** Press and drag a band in board coordinates, without releasing. */
  async function marqueePress(
    from: { x: number; y: number },
    to: { x: number; y: number },
    modifier?: 'Shift' | 'Control',
  ) {
    const origin = board().getBoundingClientRect();
    const abs = (p: { x: number; y: number }) => ({
      x: origin.left + p.x,
      y: origin.top + p.y,
    });

    if (modifier) await user.keyboard(`{${modifier}>}`);
    await pressAndMove(content(), abs(from), abs(to));

    return async () => {
      await release(content(), abs(to));
      if (modifier) await user.keyboard(`{/${modifier}}`);
    };
  }

  // Only the band used to move: the widgets it enclosed lit up after release, so
  // there was no way to see what a lasso was about to take.
  it('marks the widgets under the band before the pointer is released', async () => {
    const onSelectionChange = vi.fn();
    renderMarquee({ onSelectionChange });
    await settled();

    const finish = await marqueePress(...OVER_A_B);

    for (const id of ['a', 'b']) {
      expect(widget(id)).toHaveAttribute('data-pre-selected');
      // Provisional only — nothing has been committed yet.
      expect(widget(id)).not.toHaveAttribute('data-selected');
    }
    expect(widget('c')).not.toHaveAttribute('data-pre-selected');
    expect(onSelectionChange).not.toHaveBeenCalled();

    await finish();

    for (const id of ['a', 'b']) {
      expect(widget(id)).toHaveAttribute('data-selected');
      expect(widget(id)).not.toHaveAttribute('data-pre-selected');
    }
  });

  // A widget the lasso is *adding* to reads as a preview; one it already owns
  // must keep reading as selected rather than being downgraded to one.
  it('leaves an already-selected widget selected during an additive lasso', async () => {
    renderMarquee({ defaultSelectedKeys: ['c'] });
    await settled();

    const finish = await marqueePress(...OVER_A_C, 'Shift');

    expect(widget('c')).toHaveAttribute('data-selected');
    expect(widget('c')).not.toHaveAttribute('data-pre-selected');
    expect(widget('a')).toHaveAttribute('data-pre-selected');

    await finish();
  });

  it('suppresses text selection for the length of the gesture', async () => {
    renderMarquee();
    await settled();

    const finish = await marqueePress(...OVER_A_B);

    expect(board()).toHaveAttribute('data-marquee');
    expect(getComputedStyle(board()).userSelect).toBe('none');
    // The band starts on empty canvas but travels across widget text, which is
    // where the browser would otherwise begin a selection.
    expect(
      widget('a').dispatchEvent(
        new Event('selectstart', { bubbles: true, cancelable: true }),
      ),
    ).toBe(false);

    await finish();

    expect(board()).not.toHaveAttribute('data-marquee');
    expect(getComputedStyle(board()).userSelect).toBe('auto');
    expect(
      widget('a').dispatchEvent(
        new Event('selectstart', { bubbles: true, cancelable: true }),
      ),
    ).toBe(true);
  });

  it('ignores a press below the movement threshold and clears instead', async () => {
    const onSelectionChange = vi.fn();
    renderMarquee({ onSelectionChange, defaultSelectedKeys: ['b'] });
    await settled();

    await marquee({ x: 500, y: 300 }, { x: 501, y: 300 });

    expect(screen.queryByTestId('BoardMarquee')).not.toBeInTheDocument();
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
  });

  it('adds to the existing selection with Shift', async () => {
    const onSelectionChange = vi.fn();
    renderMarquee({ onSelectionChange, defaultSelectedKeys: ['c'] });
    await settled();

    await marquee(...OVER_A_B, 'Shift');

    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b', 'c']);
  });

  // Dragging is off while the modifier is held, so the whole board — widgets
  // included — becomes one selection surface.
  it('adds to the selection from the platform modifier flag', async () => {
    const onSelectionChange = vi.fn();
    renderMarquee({ onSelectionChange });
    await settled();

    await marquee(...OVER_A_B, 'Control');

    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b']);
  });

  it('never starts on a widget — that press is a drag', async () => {
    renderMarquee();
    await settled();

    const rect = widget('a').getBoundingClientRect();

    await dragPointer(
      widget('a'),
      { x: rect.left + 10, y: rect.top + 10 },
      { x: rect.left + 200, y: rect.top + 40 },
    );

    expect(screen.queryByTestId('BoardMarquee')).not.toBeInTheDocument();
  });

  it('re-announces two consecutive selections that read the same', async () => {
    renderMarquee();
    await settled();
    const status = screen.getByRole('status');

    await marquee(...OVER_A_B);
    const first = status.textContent;

    // `a` + `c` this time — a different selection that renders the same text.
    await marquee(...OVER_A_C);

    // A screen reader skips a live-region update whose text is byte-identical
    // to the one before it, so these must differ.
    expect(first).toContain('2 widgets selected');
    expect(status).toHaveTextContent('2 widgets selected');
    expect(status.textContent).not.toBe(first);
  });

  it('skips a widget that opted out of selection', async () => {
    const onSelectionChange = vi.fn();
    renderMarquee({ onSelectionChange }, { b: { isSelectable: false } });
    await settled();

    // A band over both `a` and `b`; only `a` may be picked up, matching what a
    // press on `b` would (not) do.
    await marquee(...OVER_A_B);

    expect(onSelectionChange).toHaveBeenCalledWith(['a']);
  });

  it('is disabled by allowMarqueeSelection={false}', async () => {
    renderMarquee({ allowMarqueeSelection: false });
    await settled();

    await marquee(...OVER_A_B);

    expect(screen.queryByTestId('BoardMarquee')).not.toBeInTheDocument();
  });
});

/**
 * Where a group lands is measured geometry from end to end: the pointer delta
 * becomes a cell delta through the board's own column width. In jsdom every one
 * of these rectangles was a mock, so the tests could only confirm the mocks were
 * self-consistent.
 *
 * 1200px over 12 columns, no margins or padding — cell N starts at exactly
 * N * 100px, matching the arithmetic the assertions are written in.
 */
describe('Board group drag', () => {
  const PAIR: LayoutItem[] = [
    { i: 'a', x: 0, y: 0, w: 2, h: 1 },
    { i: 'b', x: 6, y: 0, w: 2, h: 1 },
    { i: 'far', x: 0, y: 4, w: 2, h: 1 },
  ];

  const renderPair = (props: Record<string, unknown> = {}, layout = PAIR) =>
    renderBoard(
      layout,
      {
        compact: null,
        defaultSelectedKeys: ['a', 'b'],
        ...props,
      },
      {},
      1200,
    );

  /** Grab a widget at its centre and travel `(dx, dy)` device pixels. */
  const grabAndDrag = async (id: string, dx: number, dy: number) => {
    const el = widget(id);
    const r = el.getBoundingClientRect();
    const from = { x: r.left + r.width / 2, y: r.top + r.height / 2 };

    await dragPointer(el, from, { x: from.x + dx, y: from.y + dy });
  };

  const positions = (items: LayoutItem[]) =>
    Object.fromEntries(items.map((it) => [it.i, `${it.x},${it.y}`]));

  it('moves every selected widget by the same delta', async () => {
    const onLayoutChange = vi.fn();
    renderPair({ onLayoutChange });
    await settled();

    await grabAndDrag('a', 200, 100);

    await vi.waitFor(() => expect(onLayoutChange).toHaveBeenCalled());
    expect(positions(onLayoutChange.mock.lastCall![0])).toMatchObject({
      a: '2,1',
      b: '8,1',
    });
  });

  it('commits exactly once, before onDragStop', async () => {
    const calls: string[] = [];
    renderPair({
      onLayoutChange: () => calls.push('layout'),
      onDragStop: () => calls.push('stop'),
    });
    await settled();

    await grabAndDrag('a', 200, 0);

    expect(calls.filter((c) => c === 'layout')).toHaveLength(1);
    expect(calls).toEqual(['layout', 'stop']);
  });

  // Clamping each item separately collapses the group against the wall, and it
  // never recovers — the delta has to be clamped once, against the whole group.
  it('keeps the group shape when dragged into an edge', async () => {
    const onLayoutChange = vi.fn();
    renderPair({ onLayoutChange });
    await settled();

    await grabAndDrag('a', -400, 0);

    await vi.waitFor(() => expect(onLayoutChange).toHaveBeenCalled());
    const committed = onLayoutChange.mock.lastCall![0] as LayoutItem[];
    const a = committed.find((it) => it.i === 'a')!;
    const b = committed.find((it) => it.i === 'b')!;

    expect(a.x).toBe(0);
    expect(b.x - a.x).toBe(6);
  });

  it('never leaves a widget pinned after a group drop', async () => {
    const onLayoutChange = vi.fn();
    renderPair({ onLayoutChange, compact: 'vertical' });
    await settled();

    await grabAndDrag('a', 200, 100);

    await vi.waitFor(() => expect(onLayoutChange).toHaveBeenCalled());
    // A leaked pin would freeze the widget forever — and consumers persist
    // layouts, so it would survive a reload.
    expect(
      (onLayoutChange.mock.lastCall![0] as LayoutItem[]).every(
        (it) => !it.static,
      ),
    ).toBe(true);
  });

  it('reports every mover through the drag callbacks', async () => {
    const onDragStart = vi.fn();
    renderPair({ onDragStart });
    await settled();

    await grabAndDrag('a', 100, 0);

    const info = onDragStart.mock.lastCall![0];
    expect(info.items.map((it: LayoutItem) => it.i)).toEqual(['a', 'b']);
    expect(info.item).toBe(info.items[0]);
    expect(info.placeholders).toHaveLength(2);
  });

  it('renders one placeholder per moving widget', async () => {
    renderPair();
    await settled();

    const r = widget('a').getBoundingClientRect();
    await pressAndMove(
      widget('a'),
      { x: r.left + r.width / 2, y: r.top + r.height / 2 },
      { x: r.left + r.width / 2 + 100, y: r.top + r.height / 2 },
    );

    expect(screen.getAllByTestId('BoardPlaceholder')).toHaveLength(2);
  });

  // Reported: dragging a group down on a compacting board shoved the widgets
  // below it further down, and the board only caught up on the *next* pointer
  // step. The group was being held in place while everything reflowed around
  // it — something a single widget is never allowed to do under vertical
  // compaction, which is why a single drag felt natural and a group did not.
  it('compacts the group during the drag, like a single widget', async () => {
    const frames: LayoutItem[][] = [];
    renderPair(
      {
        compact: 'vertical',
        onDrag: (info: { layout: LayoutItem[] }) =>
          frames.push(info.layout.map((it) => ({ ...it }))),
      },
      [
        { i: 'a', x: 0, y: 0, w: 2, h: 1 },
        { i: 'b', x: 2, y: 0, w: 2, h: 1 },
        { i: 'far', x: 0, y: 3, w: 2, h: 1 },
      ],
    );
    await settled();

    const r = widget('a').getBoundingClientRect();
    // One jump rather than a walk: the claim is that *every* frame is already
    // compacted, and intermediate frames at 1.5 or 3 rows down are legitimately
    // different arrangements, not lagging ones.
    await pressAndMove(
      widget('a'),
      { x: r.left + r.width / 2, y: r.top + r.height / 2 },
      { x: r.left + r.width / 2, y: r.top + r.height / 2 + 600 },
      1,
    );

    expect(frames.length).toBeGreaterThan(0);
    for (const frame of frames) {
      // `far` rises to the top and the group packs in beneath it, rather than
      // hanging six rows down where the pointer is. `b` follows `a` down instead
      // of staying on row 0 beside `far`: the block floats as a unit for the
      // whole drag, and the drop re-compacts the board to settle the cell it
      // leaves open.
      expect(positions(frame)).toEqual({ far: '0,0', a: '0,1', b: '2,1' });
    }
  });

  it('leaves unselected widgets where they are', async () => {
    const onLayoutChange = vi.fn();
    renderPair({ onLayoutChange });
    await settled();

    await grabAndDrag('a', 100, 0);

    await vi.waitFor(() => expect(onLayoutChange).toHaveBeenCalled());
    expect(positions(onLayoutChange.mock.lastCall![0]).far).toBe('0,4');
  });
});

describe('Board group move', () => {
  const STACK: LayoutItem[] = [
    { i: 'a', x: 0, y: 0, w: 12, h: 1 },
    { i: 'b', x: 0, y: 1, w: 12, h: 1 },
    { i: 'c', x: 0, y: 2, w: 12, h: 1 },
    { i: 'd', x: 0, y: 3, w: 12, h: 1 },
  ];

  // Reported against a real dashboard: a pair sitting diagonally under a wide
  // widget would not move at all, however far up it was dragged — the widget on
  // top looked pinned. Each member only overlaps the one below it in columns, so
  // this exercises the whole pipeline (registry delta -> `moveElements` ->
  // placeholders), not just the algorithm.
  const STAIRCASE: LayoutItem[] = [
    { i: 'top', x: 4, y: 0, w: 4, h: 2 },
    { i: 'a', x: 3, y: 2, w: 4, h: 2 },
    { i: 'b', x: 5, y: 4, w: 4, h: 2 },
  ];

  // The `Selection` story's own layout, geometry and selection gesture: board
  // defaults for cols/rowHeight/margin/containerPadding (not the zeroed ones the
  // rest of this file uses — the landing cell is derived from those pixels), the
  // pair built by pressing one widget and Shift-pressing the next rather than
  // seeded through `defaultSelectedKeys`.
  const STORY: LayoutItem[] = [
    { i: 'a', x: 0, y: 0, w: 4, h: 2 },
    { i: 'b', x: 4, y: 0, w: 4, h: 2 },
    { i: 'c', x: 8, y: 0, w: 4, h: 2 },
    { i: 'd', x: 0, y: 2, w: 6, h: 2 },
    { i: 'e', x: 6, y: 2, w: 6, h: 2 },
  ];

  const renderStory = (onLayoutChange: () => void) =>
    renderWithRoot(
      <div style={{ width: '1168px' }}>
        <Board
          padding="1x"
          widgetProps={{ isCard: true }}
          selectionMode="multiple"
          defaultLayout={STORY}
          onLayoutChange={onLayoutChange}
        >
          {STORY.map((it) => (
            <Board.Widget key={it.i} id={it.i} qa={it.i.toUpperCase()}>
              {it.i}
            </Board.Widget>
          ))}
        </Board>
      </div>,
    );

  /** Modifiers are held through the keyboard API; the pointer API ignores them. */
  const press = async (id: string, modifier?: 'Shift') => {
    const el = widget(id);
    const r = el.getBoundingClientRect();
    if (modifier) await user.keyboard(`{${modifier}>}`);
    await user.pointer([
      {
        keys: '[MouseLeft]',
        target: el,
        coords: coordsAt({ x: r.left + r.width / 2, y: r.top + r.height / 2 }),
      },
    ]);
    if (modifier) await user.keyboard(`{/${modifier}}`);
  };

  const committed = (onLayoutChange: ReturnType<typeof vi.fn>) =>
    Object.fromEntries(
      onLayoutChange.mock.lastCall![0].map((it: LayoutItem) => [
        it.i,
        `${it.x},${it.y}`,
      ]),
    );

  it('lifts a pressed-and-Shift-pressed pair to the top row', async () => {
    const onLayoutChange = vi.fn();

    renderStory(onLayoutChange);
    await settled();

    await press('d');
    await press('e', 'Shift');
    expect(widget('d')).toHaveAttribute('data-selected');
    expect(widget('e')).toHaveAttribute('data-selected');

    const grabbed = widget('d');
    const from = grabbed.getBoundingClientRect();
    // Measured, not assumed: this board runs on the default rowHeight/margin.
    // `a` is on row 0 and `d` on row 2, so their gap is two rows of pitch.
    const rowPitch = (from.top - widget('a').getBoundingClientRect().top) / 2;

    await dragPointer(
      grabbed,
      { x: from.left + from.width / 2, y: from.top + from.height / 2 },
      {
        x: from.left + from.width / 2,
        y: from.top + from.height / 2 - 2 * rowPitch,
      },
    );

    await vi.waitFor(() => expect(onLayoutChange).toHaveBeenCalled());
    expect(committed(onLayoutChange)).toEqual({
      d: '0,0',
      e: '6,0',
      a: '0,2',
      b: '4,2',
      c: '8,2',
    });
  });

  // Reported: dragging a pair *sideways* slid it down under the widgets it
  // should have pushed aside, and they looked pinned. Travel along the
  // compaction axis is zero here, so nothing about the direction says the group
  // is taking ground — but it is, and the widgets standing on it have to move.
  it('pushes the widget in the way down when a pair is dragged sideways', async () => {
    const onLayoutChange = vi.fn();

    renderStory(onLayoutChange);
    await settled();

    await press('a');
    await press('d', 'Shift');

    const grabbed = widget('a');
    const from = grabbed.getBoundingClientRect();
    // Four columns right, measured off `b` (which starts exactly four across).
    const colShift = widget('b').getBoundingClientRect().left - from.left;

    await dragPointer(
      grabbed,
      { x: from.left + from.width / 2, y: from.top + from.height / 2 },
      {
        x: from.left + from.width / 2 + colShift,
        y: from.top + from.height / 2,
      },
    );

    await vi.waitFor(() => expect(onLayoutChange).toHaveBeenCalled());
    expect(committed(onLayoutChange)).toEqual({
      // The pair keeps the rows it was on, `b` moves below it, and `c` — which
      // it never overlapped — stays exactly where it was.
      a: '4,0',
      d: '4,2',
      b: '4,4',
      c: '8,0',
      e: '6,6',
    });
  });

  it('moves a diagonal pair to the top and pushes the widget above below it', async () => {
    const onLayoutChange = vi.fn();
    renderBoard(STAIRCASE, {
      compact: 'vertical',
      defaultSelectedKeys: ['a', 'b'],
      onLayoutChange,
    });
    await settled();

    expect(stackOrder()).toEqual(['top', 'a', 'b']);

    const grabbed = widget('b');
    const from = grabbed.getBoundingClientRect();

    await dragPointer(
      grabbed,
      { x: from.left + from.width / 2, y: from.top + from.height / 2 },
      {
        x: from.left + from.width / 2,
        y: from.top + from.height / 2 - 4 * ROW,
      },
    );

    await vi.waitFor(() => expect(onLayoutChange).toHaveBeenCalled());
    // The pair keeps its diagonal and `top` ends up under it, rather than the
    // whole drag being a no-op.
    expect(
      Object.fromEntries(
        onLayoutChange.mock.lastCall![0].map((it: LayoutItem) => [
          it.i,
          `${it.x},${it.y}`,
        ]),
      ),
    ).toEqual({ a: '3,0', b: '5,2', top: '4,4' });
  });

  // Compaction packs every item independently by a global `(y, x)` sort, so the
  // widgets a group is dragged past used to be packed *between* its members.
  it('keeps a selected pair together when dragged up past other widgets', async () => {
    renderBoard(STACK, {
      compact: 'vertical',
      defaultSelectedKeys: ['c', 'd'],
    });
    await settled();

    expect(stackOrder()).toEqual(['a', 'b', 'c', 'd']);

    const grabbed = widget('c');
    const from = grabbed.getBoundingClientRect();

    await dragPointer(
      grabbed,
      { x: from.left + from.width / 2, y: from.top + from.height / 2 },
      {
        x: from.left + from.width / 2,
        y: from.top + from.height / 2 - 2 * ROW,
      },
    );

    await vi.waitFor(() => expect(stackOrder()).toEqual(['c', 'd', 'a', 'b']));
  });

  // The drop re-compacts the source board, so an arrangement only the
  // group-aware pass can produce would be undone the moment the pointer is
  // released — the drag would preview right and land wrong.
  it('commits exactly the arrangement the last drag frame showed', async () => {
    const frames: LayoutItem[][] = [];
    const onLayoutChange = vi.fn();

    renderBoard(STACK, {
      compact: 'vertical',
      defaultSelectedKeys: ['c', 'd'],
      onLayoutChange,
      onDrag: (info: { layout: LayoutItem[] }) =>
        frames.push(info.layout.map((it) => ({ ...it }))),
    });
    await settled();

    const grabbed = widget('c');
    const from = grabbed.getBoundingClientRect();

    await dragPointer(
      grabbed,
      { x: from.left + from.width / 2, y: from.top + from.height / 2 },
      {
        x: from.left + from.width / 2,
        y: from.top + from.height / 2 - 2 * ROW,
      },
    );

    await vi.waitFor(() => expect(onLayoutChange).toHaveBeenCalled());

    const asPositions = (items: LayoutItem[]) =>
      Object.fromEntries(items.map((it) => [it.i, `${it.x},${it.y}`]));

    expect(frames.length).toBeGreaterThan(0);
    expect(asPositions(onLayoutChange.mock.lastCall![0])).toEqual(
      asPositions(frames.at(-1)!),
    );
  });
});

describe('a fixed cols × rows matrix', () => {
  /**
   * `rows` + `rowHeight="stretch"` is the shape a nested container board needs:
   * a matrix of a declared size that fills the box it is given. Both halves are
   * measurement questions — how tall the board actually is, and how tall one
   * cell ends up — so neither can be asked in jsdom.
   */
  function renderMatrix(rows: number, height: number, cols = 2) {
    return renderWithRoot(
      <div style={{ width: '400px', height: `${height}px` }}>
        <Board
          cols={cols}
          rows={rows}
          rowHeight="stretch"
          margin={[0, 0]}
          containerPadding={[0, 0]}
          compact="free"
          defaultLayout={[{ i: 'a', x: 0, y: 0, w: 1, h: 1 }]}
        >
          <Board.Widget id="a" qa="A">
            a
          </Board.Widget>
        </Board>
      </div>,
    );
  }

  it('divides its measured height into exactly `rows` cells', async () => {
    renderMatrix(4, 400);
    await settled();

    // One cell of a 4-row matrix in a 400px box is 100px tall, whatever the
    // content needs — the whole point of the mode.
    await vi.waitFor(() =>
      expect(widget('a').getBoundingClientRect().height).toBeCloseTo(100, 0),
    );
  });

  it('resizes its cells with the container instead of adding rows', async () => {
    const { rerender } = renderMatrix(4, 400);
    await settled();
    await vi.waitFor(() =>
      expect(widget('a').getBoundingClientRect().height).toBeCloseTo(100, 0),
    );

    rerender(
      <div style={{ width: '400px', height: '800px' }}>
        <Board
          cols={2}
          rows={4}
          rowHeight="stretch"
          margin={[0, 0]}
          containerPadding={[0, 0]}
          compact="free"
          defaultLayout={[{ i: 'a', x: 0, y: 0, w: 1, h: 1 }]}
        >
          <Board.Widget id="a" qa="A">
            a
          </Board.Widget>
        </Board>
      </div>,
    );

    // Twice the height, same row count → twice the cell. A board that hugged
    // its content would have kept the cell and grown the empty space instead.
    await vi.waitFor(() =>
      expect(widget('a').getBoundingClientRect().height).toBeCloseTo(200, 0),
    );
  });

  it('stays a normal content-hugging board when no row count is declared', async () => {
    // `rowHeight="stretch"` with no `rows` has no matrix to fill. Dividing the
    // parent's height by the CONTENT extent instead would resize every cell
    // whenever a widget landed on a new row — while still claiming the parent's
    // whole height to do it — so the mode simply does not engage.
    renderWithRoot(
      <div style={{ width: '400px', height: '900px' }}>
        <Board
          cols={2}
          rowHeight="stretch"
          margin={[0, 0]}
          containerPadding={[0, 0]}
          compact="free"
          defaultLayout={[{ i: 'a', x: 0, y: 0, w: 1, h: 1 }]}
        >
          <Board.Widget id="a" qa="A">
            a
          </Board.Widget>
        </Board>
      </div>,
    );
    await settled();

    // The default row height, not 900px (the parent) and not 900/1.
    await vi.waitFor(() =>
      expect(widget('a').getBoundingClientRect().height).toBeCloseTo(ROW, 0),
    );
    // And it hugs its one row rather than filling the 900px parent.
    expect(board().getBoundingClientRect().height).toBeCloseTo(ROW, 0);
  });

  it('paints every declared row, so an empty matrix is still a drop surface', async () => {
    renderMatrix(4, 400);
    await settled();

    // The board fills the container it was given rather than collapsing to the
    // single row its one widget needs.
    await vi.waitFor(() =>
      expect(board().getBoundingClientRect().height).toBeCloseTo(400, 0),
    );
  });
});
