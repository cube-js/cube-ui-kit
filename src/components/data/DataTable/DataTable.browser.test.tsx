import { userEvent as realInput } from '@vitest/browser/context';

import { renderWithRoot, screen, userEvent } from '../../../test';
import { Menu } from '../../actions/Menu';

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
  it('fills a flex pane by default', async () => {
    renderWithRoot(
      <div
        data-qa="TableHost"
        style={{ display: 'flex', flexDirection: 'column', height: 420 }}
      >
        <DataTable
          qa="SizingTable"
          data={ROWS.slice(0, 4)}
          columns={COLUMNS}
          paginationMode="off"
        />
      </div>,
    );

    const frame = screen.getByTestId('SizingTable');

    await vi.waitFor(() =>
      expect(Math.round(frame.getBoundingClientRect().height)).toBe(420),
    );
  });

  it('shrink-wraps rows in auto-height mode despite a supplied height', async () => {
    renderWithRoot(
      <div
        data-qa="TableHost"
        style={{ display: 'flex', flexDirection: 'column', height: 420 }}
      >
        <DataTable
          qa="SizingTable"
          data={ROWS.slice(0, 4)}
          columns={COLUMNS}
          paginationMode="off"
          height="300px"
          isAutoHeight
        />
      </div>,
    );

    const frame = screen.getByTestId('SizingTable');

    await vi.waitFor(() =>
      expect(frame.getBoundingClientRect().height).toBeGreaterThan(0),
    );

    const frameRect = frame.getBoundingClientRect();
    const tableRect = grid().getBoundingClientRect();

    expect(frameRect.height).toBeLessThan(300);
    // The card/frame edge may contribute one border pixel; there must not be a
    // leftover flexible track below the final row.
    expect(Math.abs(frameRect.bottom - tableRect.bottom)).toBeLessThanOrEqual(
      2,
    );
  });

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

  // NOTE: there is deliberately no "does not animate on mount" test here.
  // Every version I wrote passed with the guard removed as well — in this
  // harness the first commit that has a `<tbody>` already has its column widths
  // resolved, so the mount moves no offsets and there is nothing to catch. A
  // test that cannot fail is worse than none: it reads as coverage. The
  // relayout case below exercises the same guard and does fail without it.

  it('does not animate a relayout that leaves the order alone', async () => {
    const LONG = Array.from({ length: 8 }, (_, i) => ({
      ...ROWS[i],
      region: `${'a very long region label '.repeat(4)}${i}`,
    }));

    renderWithRoot(
      <DataTable
        data={LONG}
        columns={[
          // Wrapping is what makes a relayout move row offsets at all: with
          // `table-layout: fixed` and no wrapping, narrowing changes column
          // widths and nothing else, so there is no movement to animate and
          // nothing to catch.
          { key: 'region', title: 'Region', autoHeight: true },
          { key: 'orders', title: 'Orders', dataType: 'number' },
        ]}
        height="300px"
        width="700px"
      />,
    );

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());
    await new Promise((resolve) => setTimeout(resolve, 300));

    const root = grid().closest('[data-qa="DataTable"]') as HTMLElement;
    const firstRow = grid().querySelector<HTMLElement>(
      'tbody tr[data-element="Row"]:nth-child(2)',
    )!;
    const offsetBefore = firstRow.offsetTop;

    let seenTranslate = false;
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.oldValue?.includes('translateY')) seenTranslate = true;
      }
    });

    observer.observe(grid().querySelector('tbody')!, {
      attributes: true,
      attributeFilter: ['style'],
      attributeOldValue: true,
      subtree: true,
    });

    root.style.width = '360px';

    await new Promise((resolve) => setTimeout(resolve, 400));

    observer.disconnect();

    // The premise: offsets really did move. Without this the assertion below
    // passes whether or not the guard does anything.
    expect(firstRow.offsetTop).not.toBe(offsetBefore);
    expect(seenTranslate).toBe(false);
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

/**
 * The auto-hidden `⋮` trigger.
 *
 * `realInput`, not the `userEvent` the rest of this file uses: that one is
 * `@testing-library/user-event`, which dispatches synthetic events and so never
 * produces a CSS `:hover`. Reveal here is driven by `:hover` on the `<th>`, so a
 * synthetic hover reports the trigger as permanently invisible and every
 * assertion below passes for the wrong reason.
 */
describe('DataTable column menu visibility', () => {
  const MENU_COLUMNS: CubeDataTableColumn<Row>[] = COLUMNS.map((column) =>
    column.key === 'region'
      ? {
          ...column,
          title: 'Conversion rate by region',
          width: 130,
          isSortable: true,
          header: { menu: <Menu.Item key="pin">Pin column</Menu.Item> },
        }
      : column,
  );

  function mount() {
    renderWithRoot(
      <>
        {/* Somewhere to park the pointer that is not the table. */}
        <div id="away" style={{ height: 40 }}>
          away
        </div>
        <DataTable
          data={ROWS}
          columns={MENU_COLUMNS}
          height="420px"
          width="600px"
        />
      </>,
    );

    return vi.waitFor(() => {
      const cell = grid().querySelector<HTMLElement>(
        'thead [data-key="region"]',
      )!;

      expect(cell).toBeTruthy();

      return {
        cell,
        away: document.getElementById('away')!,
        slot: cell.querySelector<HTMLElement>('[data-element="Actions"]')!,
        label: cell.querySelector<HTMLElement>('[data-element="Label"]')!,
      };
    });
  }

  const opacity = (el: HTMLElement) => Number(getComputedStyle(el).opacity);

  it('hides the trigger at rest and reveals it on hover', async () => {
    const { cell, away, slot } = await mount();

    await realInput.hover(away);
    await vi.waitFor(() => expect(opacity(slot)).toBe(0));

    // Handled entirely by `Item`'s own `auto-hide-actions` rule, via its
    // `@interacted` alias. Pinned here because the whole menu is undiscoverable
    // if it ever stops resolving — and because a synthetic hover cannot see it,
    // so nothing in the jsdom suite can.
    await realInput.hover(cell);
    await vi.waitFor(() => expect(opacity(slot)).toBe(1));
  });

  it('does not reflow the header label when the trigger appears', async () => {
    const { cell, away, label } = await mount();

    await realInput.hover(away);
    await vi.waitFor(() =>
      expect(label.getBoundingClientRect().width).toBe(53),
    );

    await realInput.hover(cell);
    await new Promise((resolve) => setTimeout(resolve, 300));

    // `preserveActionsSpace` reserves the slot up front, so only the opacity
    // moves. Without it the slot's width animates 8px → 30px and this label
    // re-truncates from 75px to 53px — the header text shifting under the
    // cursor as it arrives.
    expect(label.getBoundingClientRect().width).toBe(53);
  });

  it('keeps the cell lit and the trigger visible while its menu is open', async () => {
    const { cell, away, slot } = await mount();

    await realInput.hover(away);
    await vi.waitFor(() => expect(opacity(slot)).toBe(0));

    // `backgroundImage`, not `backgroundColor`: the two-colour `fill` form paints
    // the base as the colour and the overlay as a gradient LAYER, so the
    // interaction paint never touches `background-color` at all.
    const restFill = getComputedStyle(cell).backgroundImage;

    await realInput.hover(cell);
    await realInput.click(screen.getByRole('button', { name: 'Column menu' }));
    await screen.findByRole('menuitem', { name: 'Pin column' });

    // Pointer away, menu still open.
    await realInput.hover(away);
    await new Promise((resolve) => setTimeout(resolve, 300));

    // The `⋮` stays put because `MenuTrigger` marks the trigger pressed while
    // open, which `Item`'s `@interacted` alias picks up through `data-pressed`.
    expect(opacity(slot)).toBe(1);
    // And the cell keeps its hover fill, from `menu-open` in `HeaderCell.fill` —
    // an open popover hanging off an unlit column reads as detached from it.
    expect(getComputedStyle(cell).backgroundImage).not.toBe(restFill);
  });
});

/**
 * Per-column tints, in the only tier that can see paint.
 *
 * The three things Cube Cloud's ag-grid version gets wrong are the three things
 * asserted here: banding survives inside a tinted column, the fill stays opaque
 * so a pinned column still occludes, and the text clears WCAG AA in every
 * scheme rather than only the one it was picked in.
 */
describe('DataTable column colors', () => {
  const TINTED: CubeDataTableColumn<Row>[] = [
    { key: 'region', title: 'Region', minWidth: 140 },
    { key: 'orders', title: 'Orders', dataType: 'number', minWidth: 110 },
    {
      key: 'revenue',
      title: 'Revenue',
      dataType: 'number',
      minWidth: 140,
      color: '#0ea5e9',
    },
  ];

  const TOTAL = { ...ROWS[0], id: 'total', region: 'Total' };

  /**
   * Any computed color string → non-premultiplied sRGB bytes plus alpha.
   *
   * Never parse the string by hand here. A computed color serializes in
   * whatever space it was authored in — the palette is OKLCH, so these come
   * back as `oklch(...)` / `oklab(...)`, and reading the first three numbers as
   * 0-255 channels turns a legible pair into a contrast of 1.0. Canvas makes
   * the browser do the conversion, whatever the syntax.
   */
  function srgb(color: string): [number, number, number, number] {
    const canvas = document.createElement('canvas');

    canvas.width = canvas.height = 1;

    const context = canvas.getContext('2d')!;

    context.clearRect(0, 0, 1, 1);
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);

    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;

    return [r, g, b, a / 255];
  }

  /** WCAG 2 contrast between two computed colors, in any color syntax. */
  function contrast(a: string, b: string): number {
    const channel = (value: number) => {
      const c = value / 255;

      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (color: string) => {
      const [r, g, blue] = srgb(color);

      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(blue);
    };
    const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);

    return (x + 0.05) / (y + 0.05);
  }

  const cellsOf = (key: string) =>
    Array.from(
      grid().querySelectorAll<HTMLElement>(
        `tbody tr[data-element="Row"]:not([data-pinned]) [data-key="${key}"]`,
      ),
    );

  async function mount() {
    renderWithRoot(
      <DataTable
        data={ROWS.slice(0, 4)}
        columns={TINTED}
        pinnedBottomRows={[TOTAL]}
        height="420px"
        width="600px"
      />,
    );

    await vi.waitFor(() =>
      expect(cellsOf('revenue').length).toBeGreaterThan(1),
    );
  }

  it('keeps the row banding inside a tinted column', async () => {
    await mount();

    const tinted = cellsOf('revenue');
    const plain = cellsOf('orders');

    const evenFill = getComputedStyle(tinted[0]).backgroundColor;
    const oddFill = getComputedStyle(tinted[1]).backgroundColor;

    // The assertion Cloud fails: there a per-column background wins outright over
    // the banding fill, so the stripe vanishes in that column. Here the tint
    // carries its own band.
    expect(oddFill).not.toBe(evenFill);
    // And it is genuinely a tint, not the neutral row colour.
    expect(evenFill).not.toBe(getComputedStyle(plain[0]).backgroundColor);
    expect(oddFill).not.toBe(getComputedStyle(plain[1]).backgroundColor);
  });

  it('paints an opaque fill, so a pinned tinted column still occludes', async () => {
    await mount();

    for (const cell of cellsOf('revenue').slice(0, 2)) {
      const fill = getComputedStyle(cell).backgroundColor;

      // Alpha of exactly 1, read through the browser rather than matched
      // against `rgb(`/`rgba(` — the computed value serializes in the space the
      // token was authored in, which for this palette is OKLCH. A translucent
      // fill would let scrolling cells show through a sticky column.
      expect(srgb(fill)[3]).toBe(1);
    }
  });

  it.each([
    ['light', {}],
    ['dark', { scheme: 'dark' }],
    ['high contrast', { contrast: 'high' }],
    ['dark high contrast', { scheme: 'dark', contrast: 'high' }],
  ] as const)('clears WCAG AA in %s', async (_name, attrs) => {
    const root = document.documentElement;

    Object.assign(root.dataset, attrs);

    try {
      await mount();

      const header = grid().querySelector<HTMLElement>(
        'thead [data-key="revenue"]',
      )!;
      const [even, odd] = cellsOf('revenue');

      // Both bands and the header. Glaze re-solves the tone per scheme against a
      // real contrast floor, which is exactly what a hex pair picked once in
      // light mode cannot do.
      for (const element of [even, odd, header]) {
        const style = getComputedStyle(element);

        expect(
          contrast(style.backgroundColor, style.color),
        ).toBeGreaterThanOrEqual(4.5);
      }
    } finally {
      delete root.dataset.scheme;
      delete root.dataset.contrast;
    }
  });

  it('still shows hover and cell selection over a tint', async () => {
    await mount();

    const [even] = cellsOf('revenue');
    const rest = getComputedStyle(even).backgroundImage;

    await realInput.hover(even);
    await vi.waitFor(() =>
      // The tint is pre-composed into the cell's BASE, which leaves the second
      // fill layer free for the interaction paint. Stacking the tint as an
      // overlay instead would have displaced this.
      expect(getComputedStyle(even).backgroundImage).not.toBe(rest),
    );
  });
});

/**
 * `rowSize` in the only tier that can measure a rendered row.
 *
 * jsdom can assert which token won, but every element there is zero-sized, so it
 * cannot tell whether `$size-sm` actually lands as 28px of row.
 */
describe('DataTable rowSize', () => {
  const rowPx = () =>
    Math.round(
      grid()
        .querySelector<HTMLElement>(
          'tbody tr[data-element="Row"]:not([data-pinned]) td',
        )!
        .getBoundingClientRect().height,
    );
  const headerPx = () =>
    Math.round(
      grid()
        .querySelector<HTMLElement>('thead th[data-element="HeaderCell"]')!
        .getBoundingClientRect().height,
    );

  async function mount(props: Record<string, any>) {
    renderWithRoot(
      <DataTable
        data={ROWS.slice(0, 5)}
        columns={COLUMNS}
        height="300px"
        width="700px"
        paginationMode="off"
        {...props}
      />,
    );

    await vi.waitFor(() => expect(rowPx()).toBeGreaterThan(0));
  }

  // The separator is added on top of the content box — see `CELL_STYLES.height`,
  // where a cell is `($row-height + 1bw)`.
  it.each([
    ['small', 29],
    ['medium', 33],
    ['large', 41],
  ] as const)(
    'renders %s rows at %spx including the separator',
    async (rowSize, expected) => {
      await mount({ rowSize });

      expect(rowPx()).toBe(expected);
    },
  );

  it('leaves the header where `size` put it', async () => {
    await mount({});

    const before = headerPx();

    document.body.innerHTML = '';
    await mount({ rowSize: 'large' });

    expect(rowPx()).toBe(41);
    expect(headerPx()).toBe(before);
  });
});

/**
 * Resizing moves one divider.
 *
 * Browser tier because it is entirely about resolved widths, which jsdom reports
 * as zero. Driven from the keyboard: `useMove` implements both halves of the
 * interaction, and the arrow path is deterministic where a synthetic pointer
 * drag is not.
 */
describe('DataTable column resize', () => {
  const RESIZE_COLUMNS: CubeDataTableColumn<Row>[] = [
    { key: 'region', title: 'Region', minWidth: 100 },
    { key: 'channel', title: 'Channel', minWidth: 100 },
    { key: 'orders', title: 'Orders', minWidth: 100 },
    { key: 'revenue', title: 'Revenue', minWidth: 100 },
  ];

  const widths = () =>
    Object.fromEntries(
      Array.from(
        grid().querySelectorAll<HTMLElement>(
          'thead th[data-element="HeaderCell"]',
        ),
      ).map((th) => [
        th.getAttribute('data-key'),
        Math.round(th.getBoundingClientRect().width),
      ]),
    );

  it('changes only the dragged column, not its neighbours', async () => {
    renderWithRoot(
      <DataTable
        data={ROWS.slice(0, 3)}
        columns={RESIZE_COLUMNS}
        width="800px"
        height="200px"
        paginationMode="off"
      />,
    );

    await vi.waitFor(() => expect(widths().region).toBeGreaterThan(0));

    const before = widths();
    const resizer = grid().querySelector<HTMLElement>(
      'thead [data-key="channel"] [data-element="Resizer"]',
    )!;

    resizer.focus();

    for (let i = 0; i < 8; i++) {
      resizer.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
      resizer.dispatchEvent(
        new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }),
      );
    }

    await vi.waitFor(() =>
      expect(widths().channel).toBeGreaterThan(before.channel),
    );

    const after = widths();

    // `region` is BEFORE the handle. It moving at all is the bug: every column
    // without an explicit width is `flex: 1`, so making only the dragged one
    // fixed re-split the leftover across all the others. Measured before the
    // fix: +8 on `channel` took 3px off each of the other three.
    expect(after.region).toBe(before.region);
    expect(after.orders).toBe(before.orders);
    expect(after.revenue).toBe(before.revenue);
  });
});

describe('DataTable focus', () => {
  it('draws no focus ring around the scroller', async () => {
    renderWithRoot(
      <DataTable
        data={ROWS.slice(0, 5)}
        columns={COLUMNS}
        height="240px"
        width="700px"
        paginationMode="off"
      />,
    );

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());

    const scroller = document.querySelector<HTMLElement>(
      '[data-element="Scroller"]',
    )!;

    // A real key first, so the browser's `:focus-visible` heuristic treats the
    // programmatic focus that follows as keyboard-driven — which is exactly the
    // path a cell press takes.
    await realInput.keyboard('{Tab}');
    scroller.focus({ preventScroll: true });

    expect(scroller.matches(':focus-visible')).toBe(true);
    // The scroller is focusable only so the range's shortcuts have somewhere to
    // land. The browser's default `outline: auto` drew a box round the whole
    // scrollport, and the frame's `overflow: hidden` clipped all but the bottom
    // edge — which shipped as a stray line above the footer.
    expect(getComputedStyle(scroller).outlineStyle).toBe('none');
  });
});

/**
 * The sort-direction hint.
 *
 * Browser tier with `realInput`: the hint is driven by CSS `:hover` on the header
 * cell, and `@testing-library/user-event` dispatches synthetic events that never
 * produce one — so nothing in the jsdom suite can see this.
 */
describe('DataTable sort hint', () => {
  const SORTABLE = COLUMNS.map((column) => ({ ...column, isSortable: true }));

  function mount(extra: Record<string, any> = {}) {
    renderWithRoot(
      <>
        <div id="away" style={{ height: 40 }}>
          away
        </div>
        <DataTable
          data={ROWS.slice(0, 5)}
          columns={SORTABLE}
          height="240px"
          width="800px"
          paginationMode="off"
          {...extra}
        />
      </>,
    );

    return vi.waitFor(() => {
      const header = grid().querySelector<HTMLElement>(
        'thead [data-key="channel"]',
      )!;

      expect(header).toBeTruthy();

      return {
        header,
        away: document.getElementById('away')!,
        indicator: header.querySelector<HTMLElement>(
          '[data-element="SortIndicator"]',
        )!,
      };
    });
  }

  const opacity = (el: HTMLElement) => Number(getComputedStyle(el).opacity);

  it('previews the arrow on hover and solidifies it once sorted', async () => {
    const { header, away, indicator } = await mount();

    await realInput.hover(away);
    await vi.waitFor(() => expect(opacity(indicator)).toBe(0));

    // Hovering a sortable-but-unsorted header shows what pressing it would do.
    await realInput.hover(header);
    await vi.waitFor(() => expect(opacity(indicator)).toBeCloseTo(0.4, 2));

    // Pressing it commits, and the arrow goes solid — and stays solid with the
    // pointer moved away, which is the difference between a hint and a state.
    await realInput.click(header);
    await realInput.hover(away);

    await vi.waitFor(() => expect(opacity(indicator)).toBe(1));
  });

  it('leaves a non-sortable header without a hint', async () => {
    const { header, away } = await mount({ columns: COLUMNS });

    // No indicator at all when the column cannot sort — the hint must not become
    // a reason to render one.
    expect(header.querySelector('[data-element="SortIndicator"]')).toBeNull();

    await realInput.hover(header);
    expect(
      getComputedStyle(header).getPropertyValue('--sort-hint').trim(),
    ).toBe('0');
    await realInput.hover(away);
  });
});
