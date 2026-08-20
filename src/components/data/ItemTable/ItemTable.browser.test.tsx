import { act } from 'react';
import { userEvent as realInput } from 'vitest/browser';

import { DatabaseIcon } from '../../../icons';
import { renderWithRoot, screen } from '../../../test';
import { Button } from '../../actions/Button';

import { ItemTable } from './ItemTable';

import type { CubeItemTableColumn } from './types';

interface Row {
  id: string;
  name: string;
  region: string;
  queries: number;
}

const COLUMNS: CubeItemTableColumn<Row>[] = [
  { key: 'name', title: 'Name', isRowHeader: true, minWidth: 120 },
  { key: 'region', title: 'Region', minWidth: 120 },
  {
    key: 'queries',
    title: 'Queries',
    align: 'end',
    minWidth: 100,
    format: (value) => value.toLocaleString(),
  },
];

const ROWS: Row[] = Array.from({ length: 40 }, (_, i) => ({
  id: `r${i}`,
  name: `deployment-${String(i).padStart(3, '0')}`,
  region: i % 2 ? 'eu-west-1' : 'us-east-1',
  queries: i * 1_000,
}));

const grid = () => screen.getByRole('grid');
const headerCell = (key: string) =>
  grid().querySelector<HTMLElement>(`thead th[data-key="${key}"]`)!;
const bodyCell = (key: string) =>
  grid().querySelector<HTMLElement>(`tbody [data-key="${key}"]`)!;

/** The left edge of the actual glyphs, not of the element that holds them. */
function glyphLeft(element: Element) {
  const range = document.createRange();

  range.selectNodeContents(element);

  return range.getBoundingClientRect().left;
}

/** One frame, so layout and any observer have settled. */
const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

/**
 * Layout tests, in a real browser.
 *
 * Everything here failed silently under jsdom — not by reporting a wrong
 * answer, but by having no layout to report at all. Each case corresponds to a
 * bug that shipped into this component and was found by hand.
 */
describe('ItemTable layout', () => {
  it('resolves column widths from the container', async () => {
    renderWithRoot(<ItemTable data={ROWS} columns={COLUMNS} width="600px" />);

    await nextFrame();

    const widths = Array.from(grid().querySelectorAll('colgroup col')).map(
      (col) => parseFloat((col as HTMLElement).style.width || '0'),
    );

    // jsdom reports every element as zero-sized, so `useContainerWidth` never
    // measures and no column ever gets a width — the whole sizing algorithm is
    // invisible to it.
    expect(widths).toHaveLength(3);
    expect(widths.every((width) => width > 0)).toBe(true);
    expect(
      Math.round(widths.reduce((sum, width) => sum + width, 0)),
    ).toBeLessThanOrEqual(600);
  });

  it('aligns header text with the body text below it', async () => {
    renderWithRoot(<ItemTable data={ROWS} columns={COLUMNS} width="600px" />);

    await nextFrame();

    for (const key of ['name', 'region']) {
      const header = headerCell(key).querySelector('[data-element="Label"]')!;
      const cell = bodyCell(key);

      // Measured on the glyphs: the label ELEMENT sat in the right place while
      // its text was 16px further in, which is how the double-indent survived
      // several rounds of element-level checks.
      expect(
        Math.round(
          glyphLeft(header) - headerCell(key).getBoundingClientRect().left,
        ),
      ).toBe(Math.round(glyphLeft(cell) - cell.getBoundingClientRect().left));
    }
  });

  describe('header indent', () => {
    const ICON_COLUMNS: CubeItemTableColumn<Row>[] = [
      {
        key: 'name',
        title: 'Name',
        isRowHeader: true,
        minWidth: 160,
        header: { icon: <DatabaseIcon /> },
      },
      { key: 'region', title: 'Region', minWidth: 160, isSortable: true },
      { key: 'queries', title: 'Queries', minWidth: 120 },
      // Both at once. The common case in practice, and the one a test covering
      // only "icon" and only "sortable" separately misses entirely.
      {
        key: 'owner',
        title: 'Owner',
        minWidth: 160,
        isSortable: true,
        header: { icon: <DatabaseIcon /> },
      },
    ];

    it('indents text to the cell padding and an icon tighter', async () => {
      renderWithRoot(
        <ItemTable data={ROWS} columns={ICON_COLUMNS} width="700px" />,
      );

      await nextFrame();

      const iconCell = headerCell('name');
      const icon = iconCell.querySelector('[data-element="Icon"]')!;
      const plainCell = headerCell('queries');
      const plainLabel = plainCell.querySelector('[data-element="Label"]')!;

      // Optical, not geometric: the icon is small and light, so the text's
      // 16px reads as a gap beside it. 8px sits right.
      expect(
        Math.round(
          icon.getBoundingClientRect().left -
            iconCell.getBoundingClientRect().left,
        ),
      ).toBe(8);
      expect(
        Math.round(
          glyphLeft(plainLabel) - plainCell.getBoundingClientRect().left,
        ),
      ).toBe(16);
    });

    it('indents a column that has both icons from both sides', async () => {
      renderWithRoot(
        <ItemTable data={ROWS} columns={ICON_COLUMNS} width="900px" />,
      );

      await nextFrame();

      const cell = headerCell('owner');
      const icon = cell.querySelector('[data-element="Icon"]')!;
      const indicator = cell.querySelector('[data-element="SortIndicator"]')!;
      const slot = indicator.closest('[data-element="RightIcon"]')!;
      const box = cell.getBoundingClientRect();

      expect(Math.round(icon.getBoundingClientRect().left - box.left)).toBe(8);
      expect(Math.round(box.right - slot.getBoundingClientRect().right)).toBe(
        0,
      );
    });

    it('hangs a trailing icon at the column edge', async () => {
      renderWithRoot(
        <ItemTable data={ROWS} columns={ICON_COLUMNS} width="700px" />,
      );

      await nextFrame();

      const cell = headerCell('region');
      const indicator = cell.querySelector('[data-element="SortIndicator"]')!;
      const slot = indicator.closest('[data-element="RightIcon"]')!;

      // Flush: the sort arrow sits at the column edge rather than floating
      // short of it.
      expect(
        Math.round(
          cell.getBoundingClientRect().right -
            slot.getBoundingClientRect().right,
        ),
      ).toBe(0);
    });

    it("stretches the Item across the cell, so the indent is the Item's", async () => {
      renderWithRoot(
        <ItemTable data={ROWS} columns={ICON_COLUMNS} width="700px" />,
      );

      await nextFrame();

      const cell = headerCell('name');
      const item = cell.firstElementChild!;

      expect(Math.round(item.getBoundingClientRect().width)).toBe(
        Math.round(cell.getBoundingClientRect().width),
      );
    });
  });

  it('centres each resize handle on its column boundary', async () => {
    renderWithRoot(
      <ItemTable isResizable data={ROWS} columns={COLUMNS} width="600px" />,
    );

    await nextFrame();

    for (const key of ['name', 'region']) {
      const cell = headerCell(key);
      const handle = cell.querySelector('[data-element="Resizer"]')!;
      const line = cell.querySelector('[data-element="ResizerLine"]')!;
      const edge = cell.getBoundingClientRect().right;
      const handleBox = handle.getBoundingClientRect();
      const lineBox = line.getBoundingClientRect();

      // Straddles the edge, and the line sits exactly on it.
      expect(Math.round(handleBox.left - edge)).toBe(-4);
      expect(Math.round(handleBox.right - edge)).toBe(4);
      expect(Math.round((lineBox.left + lineBox.right) / 2 - edge)).toBe(0);
    }
  });

  it('gives the resize handle the pointer at the boundary', async () => {
    renderWithRoot(
      <ItemTable isResizable data={ROWS} columns={COLUMNS} width="600px" />,
    );

    await nextFrame();

    const cell = headerCell('name');
    const box = cell.getBoundingClientRect();
    const y = box.top + box.height / 2;

    // Hit-testing, which needs real paint order: the neighbouring cell must not
    // cover the half of the handle that overhangs it.
    for (const dx of [-3, -1, 1, 3]) {
      const hit = document.elementFromPoint(box.right + dx, y);

      expect(hit?.closest('[data-element="Resizer"]')).not.toBeNull();
    }

    expect(
      document
        .elementFromPoint(box.right + 20, y)
        ?.closest('[data-element="Resizer"]'),
    ).toBeNull();
  });

  it('resizes with the arrow keys', async () => {
    renderWithRoot(
      <ItemTable isResizable data={ROWS} columns={COLUMNS} width="600px" />,
    );

    await nextFrame();

    const width = () =>
      parseFloat(
        (grid().querySelector('colgroup col') as HTMLElement).style.width,
      );
    const before = width();
    const handle = headerCell('name').querySelector<HTMLElement>(
      '[data-element="Resizer"]',
    )!;

    handle.focus();
    handle.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );

    await nextFrame();

    expect(width()).toBeLessThan(before);
  });

  it('pins the header and keeps a bounded body scrollable', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        paginationMode="off"
        width="600px"
        height="240px"
      />,
    );

    await nextFrame();

    const scroller = grid()
      .closest('[data-qa]')!
      .querySelector<HTMLElement>('[data-element="Scroller"]')!;

    expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);

    const head = grid().querySelector<HTMLElement>('thead')!;
    const topBefore = head.getBoundingClientRect().top;

    scroller.scrollTop = 200;
    await nextFrame();

    // Sticky, which jsdom has no concept of.
    expect(Math.round(head.getBoundingClientRect().top)).toBe(
      Math.round(topBefore),
    );
  });

  it('locks overscroll only on an axis that can scroll', async () => {
    const { rerender } = renderWithRoot(
      <ItemTable data={ROWS.slice(0, 3)} columns={COLUMNS} width="600px" />,
    );

    await nextFrame();

    const scroller = () =>
      document.querySelector<HTMLElement>('[data-element="Scroller"]')!;

    // Nothing to scroll, so the wheel must reach the page — the bug that made a
    // short table trap scrolling.
    expect(getComputedStyle(scroller()).overscrollBehaviorY).toBe('auto');

    rerender(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        paginationMode="off"
        width="600px"
        height="200px"
      />,
    );

    await nextFrame();

    // `none`, not `contain`: `contain` still bounces, and bouncing drags the
    // rows off the sticky header and shows blank surface behind them.
    expect(getComputedStyle(scroller()).overscrollBehaviorY).toBe('none');
  });
});

describe('row move animation vs sticky columns', () => {
  it('keeps a pinned column pinned while rows are mid-slide', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS.slice(0, 8)}
        columns={[
          { ...COLUMNS[0], pin: 'start', isSortable: true },
          ...COLUMNS.slice(1),
        ]}
        height="300px"
        width="400px"
      />,
    );

    const scroller = document.querySelector<HTMLElement>(
      '[data-element="Scroller"]',
    )!;

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());

    scroller.scrollLeft = 120;

    const header = grid().querySelector<HTMLElement>('thead th')!;

    header.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    header.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // A transform on the `<tr>` makes it a containing block, which is exactly
    // the kind of thing that quietly breaks `position: sticky` on its cells.
    // Measured mid-animation, while the transform is still applied.
    const pinned = grid().querySelector<HTMLElement>(
      'tbody [data-key="name"]',
    )!;

    expect(getComputedStyle(pinned).position).toBe('sticky');
    expect(
      Math.round(
        pinned.getBoundingClientRect().left -
          scroller.getBoundingClientRect().left,
      ),
    ).toBe(0);
  });
});

describe('token namespacing', () => {
  it('does not redefine the global radius for its contents', async () => {
    renderWithRoot(
      <ItemTable
        shape="card"
        data={ROWS.slice(0, 2)}
        columns={[
          {
            key: 'name',
            title: 'Name',
            render: () => <Button qa="InCell">Act</Button>,
          },
        ]}
        height="300px"
      />,
    );

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());

    const root = grid();
    const button = document.querySelector<HTMLElement>('[data-qa="InCell"]')!;

    // A component-owned token named after a global one is emitted as a custom
    // property on the element that declares it, so it silently redefines that
    // global for EVERYTHING rendered inside. Naming the card's corner radius
    // `$radius` gave every Button, Input and Tag in a cell the card's 10px
    // instead of the 6px they have everywhere else — and took every `1r`/`2r`
    // unit in the subtree with it. The table looked fine; the Button did not.
    expect(getComputedStyle(root).getPropertyValue('--radius').trim()).not.toBe(
      '',
    );
    expect(getComputedStyle(button).borderTopLeftRadius).toBe(
      getComputedStyle(document.body).getPropertyValue('--radius').trim() ||
        '6px',
    );
  });
});

describe('refresh sweep', () => {
  it('fades the whole table, header included, and sweeps a mask across it', async () => {
    renderWithRoot(
      <ItemTable isLoading data={ROWS.slice(0, 5)} columns={COLUMNS} />,
    );

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());

    const root = grid().closest('[data-qa="ItemTable"]')!;
    const table = grid() as HTMLElement;

    expect(root).toHaveAttribute('data-stale', '');

    // The fade is on the `<table>`, so the sticky header goes with it. Dimming
    // only `<tbody>` left the header at full strength, reading as though the
    // columns were current and only the data was not.
    await vi.waitFor(() => expect(getComputedStyle(table).opacity).toBe('0.5'));

    const style = getComputedStyle(table);

    expect(style.maskImage).toContain('linear-gradient');
    expect(style.animationName).not.toBe('none');
    expect(style.animationDuration).not.toBe('0s');
  });

  it('parks nothing over the rows', async () => {
    renderWithRoot(
      <ItemTable isLoading data={ROWS.slice(0, 5)} columns={COLUMNS} />,
    );

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());

    // Keeping the previous result on screen is the entire point of this mode;
    // a spinner parked in the middle of it covered the very rows it preserves.
    expect(document.querySelector('[data-qa="LoadingAnimation"]')).toBeNull();

    // Still announced, just not drawn over the content.
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('emits a reduced-motion escape for the sweep', async () => {
    renderWithRoot(
      <ItemTable isLoading data={ROWS.slice(0, 5)} columns={COLUMNS} />,
    );

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());

    // Asserted against the emitted CSS rather than by trusting the style
    // object: a state-map key tasty does not understand compiles to nothing at
    // all, and the fix would be invisible either way.
    const rules: string[] = [];

    for (const sheet of Array.from(document.styleSheets)) {
      let list: CSSRuleList;

      try {
        list = sheet.cssRules;
      } catch {
        continue;
      }

      for (const rule of Array.from(list)) {
        if (rule.cssText.includes('prefers-reduced-motion')) {
          rules.push(rule.cssText);
        }
      }
    }

    // `mask-image` specifically, not `animation-play-state`: `Spin` already
    // emits a reduced-motion rule for the latter, so matching on it would pass
    // whether or not the table emitted anything.
    const forTheSweep = rules.filter((text) => text.includes('mask-image'));

    expect(forTheSweep.length).toBeGreaterThan(0);
  });

  it('announces the refresh through a live region that fills', async () => {
    const { rerender } = renderWithRoot(
      <ItemTable data={ROWS.slice(0, 5)} columns={COLUMNS} />,
    );

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());

    const status = screen.getByRole('status');

    // Present but empty before the refresh: a live region announces changes to
    // its content, so it has to exist first and then fill. One inserted
    // already-populated is unreliable, and an empty one carrying only an
    // `aria-label` says nothing at all.
    expect(status).toHaveTextContent('');

    rerender(<ItemTable isLoading data={ROWS.slice(0, 5)} columns={COLUMNS} />);

    await vi.waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Refreshing'),
    );
  });

  it('leaves a settled table untouched', async () => {
    renderWithRoot(<ItemTable data={ROWS.slice(0, 5)} columns={COLUMNS} />);

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());

    const style = getComputedStyle(grid() as HTMLElement);

    expect(style.opacity).toBe('1');
    expect(style.maskImage).toBe('none');
    expect(style.animationName).toBe('none');
  });
});

describe('infinite scroll prefetch distance', () => {
  const TALL = Array.from({ length: 60 }, (_, i) => ({
    id: `t${i}`,
    name: `row-${String(i).padStart(3, '0')}`,
    region: 'us-east-1',
    queries: i,
  }));

  it('fires a screen before the end, not at it', async () => {
    const onLoadMore = vi.fn();

    renderWithRoot(
      <ItemTable
        hasMore
        data={TALL}
        columns={COLUMNS}
        paginationMode="infinite"
        height="300px"
        onLoadMore={onLoadMore}
      />,
    );

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());

    const scroller = document.querySelector<HTMLElement>(
      '[data-element="Scroller"]',
    )!;

    await vi.waitFor(() =>
      expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight * 3),
    );

    // Not near the end yet: nothing should have been requested.
    expect(onLoadMore).not.toHaveBeenCalled();

    // Stop a full viewport short of the bottom. With a 200px margin this row
    // is still out of range; with a one-screen margin it is exactly in it.
    const short = scroller.scrollHeight - scroller.clientHeight * 2;

    scroller.scrollTop = short;

    await vi.waitFor(() => expect(onLoadMore).toHaveBeenCalled());

    // And the user still has a screen of rows left to read while it loads.
    expect(scroller.scrollTop + scroller.clientHeight).toBeLessThan(
      scroller.scrollHeight,
    );
  });

  it('honours an explicit loadMoreMargin', async () => {
    const onLoadMore = vi.fn();

    renderWithRoot(
      <ItemTable
        hasMore
        data={TALL}
        columns={COLUMNS}
        paginationMode="infinite"
        height="300px"
        loadMoreMargin={0}
        onLoadMore={onLoadMore}
      />,
    );

    await vi.waitFor(() => expect(grid()).toBeInTheDocument());

    const scroller = document.querySelector<HTMLElement>(
      '[data-element="Scroller"]',
    )!;

    await vi.waitFor(() =>
      expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight * 3),
    );

    scroller.scrollTop = scroller.scrollHeight - scroller.clientHeight * 2;

    // With no margin the sentinel has to be genuinely in view, so a screen
    // short of the end is not enough.
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(onLoadMore).not.toHaveBeenCalled();

    scroller.scrollTop = scroller.scrollHeight;

    await vi.waitFor(() => expect(onLoadMore).toHaveBeenCalled());
  });
});

describe('treegrid focus and virtualization', () => {
  interface TreeRow {
    id: string;
    name: string;
    children?: TreeRow[];
  }

  const treeColumns: CubeItemTableColumn<TreeRow>[] = [
    { key: 'name', title: 'Name', isRowHeader: true },
  ];
  const treeData: TreeRow[] = Array.from({ length: 60 }, (_, index) => ({
    id: `root-${index}`,
    name: `Root ${index}`,
    children:
      index === 0
        ? [
            {
              id: 'branch',
              name: 'Branch',
              children: [{ id: 'leaf', name: 'Leaf' }],
            },
          ]
        : undefined,
  }));

  const treegrid = () => screen.getByRole('treegrid');
  const treeRow = (key: string) =>
    treegrid().querySelector<HTMLTableRowElement>(`tr[data-key="${key}"]`)!;

  it('moves real focus through three visible levels', async () => {
    renderWithRoot(
      <ItemTable
        data={treeData.slice(0, 2)}
        columns={treeColumns}
        getRowChildren={(row) => row.children}
      />,
    );

    treeRow('root-0').focus();
    await act(() =>
      realInput.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}'),
    );

    await vi.waitFor(() => expect(treeRow('leaf')).toHaveFocus());
  });

  it('adds expanded children to a virtualized visible window', async () => {
    renderWithRoot(
      <ItemTable
        data={treeData}
        columns={treeColumns}
        getRowChildren={(row) => row.children}
        height="260px"
        isVirtualized
        overscan={2}
        paginationMode="off"
      />,
    );

    await vi.waitFor(() => expect(treeRow('root-0')).toBeInTheDocument());
    treeRow('root-0').focus();
    await act(() => realInput.keyboard('{ArrowRight}'));

    await vi.waitFor(() => expect(treeRow('branch')).toBeInTheDocument());
    expect(treegrid()).toHaveAttribute('aria-rowcount', '62');
    expect(
      treegrid().querySelectorAll('tbody tr[data-element="Row"]').length,
    ).toBeLessThan(61);
  });

  it('moves rapid arrow focus across virtualized windows', async () => {
    renderWithRoot(
      <ItemTable
        data={treeData}
        columns={treeColumns}
        getRowChildren={(row) => row.children}
        height="140px"
        isVirtualized
        overscan={0}
        paginationMode="off"
      />,
    );

    await vi.waitFor(() => expect(treeRow('root-0')).toBeInTheDocument());
    treeRow('root-0').focus();

    // Do not yield between presses. Once the next row is outside the mounted
    // window, the old DOM row still receives keys while logical focus advances.
    await act(() => {
      for (let index = 0; index < 12; index++) {
        document.activeElement?.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
        );
      }
    });

    await vi.waitFor(() => expect(treeRow('root-12')).toHaveFocus());

    expect(
      document.querySelector<HTMLElement>('[data-element="Scroller"]')!
        .scrollTop,
    ).toBeGreaterThan(0);
  });

  it('does not restore pending virtual focus after focus leaves the treegrid', async () => {
    renderWithRoot(
      <>
        <ItemTable
          data={treeData}
          columns={treeColumns}
          getRowChildren={(row) => row.children}
          height="140px"
          isVirtualized
          overscan={0}
          paginationMode="off"
        />
        <button type="button">Outside control</button>
      </>,
    );

    await vi.waitFor(() => expect(treeRow('root-0')).toBeInTheDocument());
    treeRow('root-0').focus();

    await act(() => {
      for (let index = 0; index < 12; index++) {
        document.activeElement?.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
        );
      }
      screen.getByRole('button', { name: 'Outside control' }).focus();
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(
      screen.getByRole('button', { name: 'Outside control' }),
    ).toHaveFocus();
  });
});
