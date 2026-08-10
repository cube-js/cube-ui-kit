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
) {
  const result = renderWithRoot(
    <div style={{ width: '600px' }}>
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
          <Board.Widget key={item.i} id={item.i} qa={item.i.toUpperCase()}>
            {item.i}
          </Board.Widget>
        ))}
      </Board>
    </div>,
  );

  return result;
}

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
  return [...document.querySelectorAll<HTMLElement>('[data-board-widget-host]')]
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
async function dragPointer(
  target: HTMLElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
  steps = 4,
) {
  const at = (i: number) => {
    const t = i / steps;
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;

    return { clientX: x, clientY: y, pageX: x, pageY: y };
  };

  await userEvent.pointer([
    { keys: '[MouseLeft>]', target, coords: at(0) },
    ...Array.from({ length: steps }, (_, i) => ({
      target,
      coords: at(i + 1),
    })),
    { keys: '[/MouseLeft]', target, coords: at(steps) },
  ]);
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

describe('Board group move', () => {
  const STACK: LayoutItem[] = [
    { i: 'a', x: 0, y: 0, w: 12, h: 1 },
    { i: 'b', x: 0, y: 1, w: 12, h: 1 },
    { i: 'c', x: 0, y: 2, w: 12, h: 1 },
    { i: 'd', x: 0, y: 3, w: 12, h: 1 },
  ];

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
