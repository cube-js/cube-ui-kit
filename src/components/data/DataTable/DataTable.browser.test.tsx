import { renderWithRoot, screen, userEvent } from '../../../test';

import { DataTable } from './DataTable';

import type { CubeDataTableColumn } from './types';

interface Row {
  id: string;
  region: string;
  channel: string;
  orders: number;
  revenue: number;
  conversion: number;
}

const COLUMNS: CubeDataTableColumn<Row>[] = [
  { key: 'region', title: 'Region', minWidth: 140 },
  { key: 'channel', title: 'Channel', minWidth: 120 },
  { key: 'orders', title: 'Orders', dataType: 'number', minWidth: 110 },
  { key: 'revenue', title: 'Revenue', dataType: 'number', minWidth: 140 },
  { key: 'conversion', title: 'Conversion', dataType: 'number', minWidth: 130 },
];

const ROWS: Row[] = Array.from({ length: 240 }, (_, i) => ({
  id: `r${i}`,
  region: 'us-east-1',
  channel: 'organic',
  orders: i,
  revenue: i * 100,
  conversion: i / 1000,
}));

const grid = () => screen.getByRole('grid');
const scroller = () =>
  document.querySelector<HTMLElement>('[data-element="Scroller"]')!;

describe('DataTable layout', () => {
  it('does not overflow horizontally when the columns fit', async () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={COLUMNS}
        height="420px"
        // Wide enough that every `minWidth` fits with room to spare, so any
        // horizontal overflow is the layout's own doing rather than genuinely
        // wider content.
        width="900px"
      />,
    );

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());

    const sc = scroller();

    await vi.waitFor(() => expect(sc.scrollHeight).toBeGreaterThan(0));

    // The bug: the `<colgroup>` is sized against a width that includes the
    // vertical scrollbar, so the table is a scrollbar wider than the box it
    // sits in and scrolls sideways onto empty space.
    expect(sc.scrollWidth).toBe(sc.clientWidth);
  });

  it('still scrolls sideways when the columns genuinely do not fit', async () => {
    renderWithRoot(
      <DataTable data={ROWS} columns={COLUMNS} height="420px" width="400px" />,
    );

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());

    const sc = scroller();

    // Σ minWidth is 640, so 400 has to overflow — clamping the table to the
    // client width must not come at the cost of collapsing the columns.
    await vi.waitFor(() =>
      expect(sc.scrollWidth).toBeGreaterThan(sc.clientWidth),
    );
  });
});

describe('cell selection', () => {
  const cellAt = (rowIndex: number, key: string) =>
    Array.from(grid().querySelectorAll('tbody tr[data-element="Row"]'))[
      rowIndex
    ].querySelector<HTMLElement>(`[data-key="${key}"]`)!;
  const selectedCount = () =>
    grid().querySelectorAll('[data-cell-selected]').length;

  const at = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();

    return { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
  };
  const OPTS = { bubbles: true, pointerId: 1, isPrimary: true, button: 0 };

  /**
   * `pointerover`, not `pointerenter`.
   *
   * React does not listen for `pointerenter` — it is a non-bubbling event, so
   * React synthesizes `onPointerEnter` from the `pointerover`/`pointerout` pair
   * and their `relatedTarget`. A dispatched `pointerenter` reaches nothing,
   * which a real mouse move never has to worry about.
   */
  const moveOver = (from: HTMLElement | null, to: HTMLElement) => {
    if (from) {
      from.dispatchEvent(
        new PointerEvent('pointerout', {
          ...OPTS,
          ...at(from),
          relatedTarget: to,
        }),
      );
    }
    to.dispatchEvent(
      new PointerEvent('pointerover', {
        ...OPTS,
        ...at(to),
        relatedTarget: from,
      }),
    );
  };

  /** A real pointer gesture — the one thing synthetic events cannot stand in for. */
  async function dragFrom(a: HTMLElement, b: HTMLElement) {
    a.dispatchEvent(new PointerEvent('pointerdown', { ...OPTS, ...at(a) }));
    moveOver(a, b);
    window.dispatchEvent(new PointerEvent('pointerup', { ...OPTS, ...at(b) }));
  }

  it('paints the rectangle a drag sweeps out', async () => {
    renderWithRoot(
      <DataTable data={ROWS.slice(0, 4)} columns={COLUMNS} height="420px" />,
    );

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());

    await dragFrom(cellAt(0, 'region'), cellAt(2, 'orders'));

    // 3 rows × 3 columns (region, channel, orders) — the block, not the path.
    await vi.waitFor(() => expect(selectedCount()).toBe(9));
  });

  it('does not let a drag snap to the end by brushing a sticky total', async () => {
    const TOTAL = { ...ROWS[0], id: 'total', region: 'Total' };

    renderWithRoot(
      <DataTable
        data={ROWS.slice(0, 20)}
        columns={COLUMNS}
        pinnedBottomRows={[TOTAL]}
        height="200px"
      />,
    );

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());

    const total = grid().querySelector<HTMLElement>(
      'tr[data-pinned="bottom"] [data-key="revenue"]',
    )!;

    // The total sits OVER the scrolling rows and is last in the row order, so a
    // downward drag brushes it long before the end of the data — which would
    // otherwise take everything in between.
    await dragFrom(cellAt(0, 'revenue'), total);

    expect(selectedCount()).toBe(1);
  });

  it('takes the total when it is shift-clicked rather than passed through', async () => {
    const TOTAL = { ...ROWS[0], id: 'total', region: 'Total' };

    renderWithRoot(
      <DataTable
        data={ROWS.slice(0, 3)}
        columns={COLUMNS}
        pinnedBottomRows={[TOTAL]}
        height="420px"
      />,
    );

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());

    const total = grid().querySelector<HTMLElement>(
      'tr[data-pinned="bottom"] [data-key="revenue"]',
    )!;
    const first = cellAt(0, 'revenue');

    first.dispatchEvent(
      new PointerEvent('pointerdown', { ...OPTS, ...at(first) }),
    );
    window.dispatchEvent(
      new PointerEvent('pointerup', { ...OPTS, ...at(first) }),
    );
    total.dispatchEvent(
      new PointerEvent('pointerdown', {
        ...OPTS,
        ...at(total),
        shiftKey: true,
      }),
    );
    window.dispatchEvent(
      new PointerEvent('pointerup', { ...OPTS, ...at(total) }),
    );

    // 3 data rows + the total: asked for, not passed through.
    await vi.waitFor(() => expect(selectedCount()).toBe(4));
  });

  it('stops extending once the button is released', async () => {
    renderWithRoot(
      <DataTable data={ROWS.slice(0, 4)} columns={COLUMNS} height="420px" />,
    );

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());

    await dragFrom(cellAt(0, 'region'), cellAt(1, 'region'));
    await vi.waitFor(() => expect(selectedCount()).toBe(2));

    // A hover after mouse-up must not grow the range — the gesture is over, and
    // the release can land anywhere, which is why it is watched on the window.
    moveOver(cellAt(1, 'region'), cellAt(3, 'revenue'));

    expect(selectedCount()).toBe(2);
  });
});

describe('row move animation', () => {
  const rowTransforms = () =>
    Array.from(
      grid().querySelectorAll<HTMLElement>('tbody tr[data-element="Row"]'),
    ).map((row) => row.style.transform);

  it('slides rows from where they were when the sort changes', async () => {
    renderWithRoot(
      <DataTable
        data={ROWS.slice(0, 6)}
        columns={[{ key: 'orders', title: 'Orders', isSortable: true }]}
        height="420px"
      />,
    );

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());

    const header = grid().querySelector<HTMLElement>('thead th')!;
    const before = Array.from(
      grid().querySelectorAll('tbody [data-key="orders"]'),
    ).map((cell) => cell.textContent?.trim());

    let seenTranslate = false;
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        // `oldValue`, not the live style: invert and play happen in one
        // synchronous block, so by the time this callback runs the transform is
        // already back to none. The old value is the only trace of the invert.
        if (record.oldValue?.includes('translateY')) seenTranslate = true;

        const target = record.target as HTMLElement;

        if (target.style?.transform?.includes('translateY')) {
          seenTranslate = true;
        }
      }
    });

    observer.observe(grid().querySelector('tbody')!, {
      attributes: true,
      attributeFilter: ['style'],
      attributeOldValue: true,
      subtree: true,
    });

    // Twice: `ROWS` is already ascending by `orders`, so one click sorts it
    // into the order it is already in and nothing moves.
    await userEvent.click(header);
    await userEvent.click(header);

    // The DOM order changes immediately — the animation only lags the paint —
    // so nothing has to wait for it to read the sorted result.
    await vi.waitFor(() =>
      expect(
        Array.from(grid().querySelectorAll('tbody [data-key="orders"]')).map(
          (cell) => cell.textContent?.trim(),
        ),
      ).not.toEqual(before),
    );

    // Observed rather than sampled: the invert lasts a single frame, so reading
    // the style after the fact races the animation and usually loses.
    observer.disconnect();

    expect(seenTranslate).toBe(true);
  });

  it('settles back to no transform once it has played', async () => {
    renderWithRoot(
      <DataTable
        data={ROWS.slice(0, 6)}
        columns={[{ key: 'orders', title: 'Orders', isSortable: true }]}
        height="420px"
      />,
    );

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());

    const header = grid().querySelector<HTMLElement>('thead th')!;

    await userEvent.click(header);
    await userEvent.click(header);

    // Left behind, a stale `transition` would animate transforms this feature
    // never set — a dragged row, for one.
    await vi.waitFor(
      () => expect(rowTransforms().every((t) => t === '')).toBe(true),
      { timeout: 2000 },
    );
  });

  it('does not animate a page turn, only a reorder', async () => {
    renderWithRoot(
      <DataTable
        data={ROWS.slice(0, 12)}
        columns={[{ key: 'orders', title: 'Orders' }]}
        defaultPageSize={6}
        autoHidePagination={false}
        height="420px"
      />,
    );

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());

    const pageTwo = await vi.waitFor(() => {
      const button = Array.from(
        document.querySelectorAll<HTMLElement>('button'),
      ).find((b) => b.textContent?.trim() === '2');

      expect(button).toBeTruthy();

      return button!;
    });

    await userEvent.click(pageTwo);

    // Different rows, not moved ones — sliding them around would read as noise.
    await vi.waitFor(() => expect(rowTransforms().length).toBeGreaterThan(0));
    expect(rowTransforms().every((t) => t === '')).toBe(true);
  });
});
