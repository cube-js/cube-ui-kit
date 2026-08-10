import { DatabaseIcon } from '../../../icons';
import { renderWithRoot, screen } from '../../../test';

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
