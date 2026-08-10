import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';

import { DataTable } from './DataTable';

import type { CubeDataTableColumn } from './types';

interface Row {
  id: string;
  region: string;
  orders: number;
}

const COLUMNS: CubeDataTableColumn<Row>[] = [
  { key: 'region', title: 'Region', isSortable: true },
  { key: 'orders', title: 'Orders', dataType: 'number', isSortable: true },
];

const ROWS: Row[] = [
  { id: 'r0', region: 'eu-west-1', orders: 30 },
  { id: 'r1', region: 'us-east-1', orders: 10 },
  { id: 'r2', region: 'eu-west-1', orders: 20 },
  { id: 'r3', region: 'us-east-1', orders: 40 },
];

const grid = () => screen.getByRole('grid');
const bodyRows = () =>
  Array.from(grid().querySelectorAll('tbody tr[data-element="Row"]'));
const cellText = (key: string) =>
  Array.from(grid().querySelectorAll(`tbody [data-key="${key}"]`)).map((cell) =>
    cell.textContent?.trim(),
  );

describe('DataTable', () => {
  it('renders the rows', () => {
    renderWithRoot(<DataTable data={ROWS} columns={COLUMNS} />);

    expect(bodyRows()).toHaveLength(4);
    expect(grid()).toHaveAttribute('aria-colcount', '2');
  });

  it('bands rows by default', () => {
    renderWithRoot(<DataTable data={ROWS} columns={COLUMNS} />);

    // A wide analytical row is hard to read across without banding, so unlike
    // `ItemTable` this is on unless asked otherwise.
    expect(grid().querySelectorAll('tr[data-odd]').length).toBeGreaterThan(0);
  });

  it('right-aligns a number column without being told to', () => {
    renderWithRoot(<DataTable data={ROWS} columns={COLUMNS} />);

    expect(grid().querySelector('tbody [data-key="orders"]')).toHaveAttribute(
      'data-align',
      'end',
    );
    expect(grid().querySelector('tbody [data-key="region"]')).toHaveAttribute(
      'data-align',
      'start',
    );
  });

  describe('multi-column sorting', () => {
    it('adds a column to the sort rather than replacing it', async () => {
      const onSortsChange = vi.fn();

      renderWithRoot(
        <DataTable
          data={ROWS}
          columns={COLUMNS}
          onSortsChange={onSortsChange}
        />,
      );

      await userEvent.click(
        screen.getByRole('columnheader', { name: /Region/ }),
      );
      await userEvent.click(
        screen.getByRole('columnheader', { name: /Orders/ }),
      );

      // Both, in the order they were clicked — that order is the precedence.
      await waitFor(() =>
        expect(onSortsChange).toHaveBeenLastCalledWith([
          { columnKey: 'region', direction: 'asc' },
          { columnKey: 'orders', direction: 'asc' },
        ]),
      );
    });

    it('sorts by the second column within the first', async () => {
      renderWithRoot(
        <DataTable
          data={ROWS}
          columns={COLUMNS}
          defaultSorts={[
            { columnKey: 'region', direction: 'asc' },
            { columnKey: 'orders', direction: 'desc' },
          ]}
        />,
      );

      expect(cellText('region')).toEqual([
        'eu-west-1',
        'eu-west-1',
        'us-east-1',
        'us-east-1',
      ]);
      // Descending orders inside each region.
      expect(cellText('orders')).toEqual(['30', '20', '40', '10']);
    });

    it('cycles a column asc → desc → off without disturbing the others', async () => {
      const onSortsChange = vi.fn();

      renderWithRoot(
        <DataTable
          data={ROWS}
          columns={COLUMNS}
          defaultSorts={[{ columnKey: 'region', direction: 'asc' }]}
          onSortsChange={onSortsChange}
        />,
      );

      const orders = screen.getByRole('columnheader', { name: /Orders/ });

      await userEvent.click(orders);
      await userEvent.click(orders);
      await userEvent.click(orders);

      // Region survives all three clicks on Orders.
      await waitFor(() =>
        expect(onSortsChange).toHaveBeenLastCalledWith([
          { columnKey: 'region', direction: 'asc' },
        ]),
      );
    });

    it('marks every sorted column for assistive tech', () => {
      renderWithRoot(
        <DataTable
          data={ROWS}
          columns={COLUMNS}
          defaultSorts={[
            { columnKey: 'region', direction: 'asc' },
            { columnKey: 'orders', direction: 'desc' },
          ]}
        />,
      );

      expect(
        screen.getByRole('columnheader', { name: /Region/ }),
      ).toHaveAttribute('aria-sort', 'ascending');
      expect(
        screen.getByRole('columnheader', { name: /Orders/ }),
      ).toHaveAttribute('aria-sort', 'descending');
    });

    it('never reorders in server mode', async () => {
      const onSortsChange = vi.fn();

      renderWithRoot(
        <DataTable
          data={ROWS}
          columns={COLUMNS}
          sortMode="server"
          onSortsChange={onSortsChange}
        />,
      );

      await userEvent.click(
        screen.getByRole('columnheader', { name: /Region/ }),
      );

      expect(onSortsChange).toHaveBeenCalled();
      expect(cellText('region')[0]).toBe('eu-west-1');
    });
  });

  describe('pinned rows', () => {
    const TOTAL: Row = { id: 'total', region: 'Total', orders: 100 };

    it('renders them outside the scrolling rows', () => {
      renderWithRoot(
        <DataTable data={ROWS} columns={COLUMNS} pinnedBottomRows={[TOTAL]} />,
      );

      const pinned = grid().querySelectorAll('tr[data-pinned="bottom"]');

      expect(pinned).toHaveLength(1);
      expect(pinned[0].textContent).toContain('Total');
    });

    it('counts them as rows for assistive tech', () => {
      renderWithRoot(
        <DataTable
          data={ROWS}
          columns={COLUMNS}
          pinnedTopRows={[TOTAL]}
          pinnedBottomRows={[TOTAL]}
        />,
      );

      // 1 header + 4 body + 2 pinned.
      expect(grid()).toHaveAttribute('aria-rowcount', '7');
    });

    it('leaves them out of the sort', () => {
      renderWithRoot(
        <DataTable
          data={ROWS}
          columns={COLUMNS}
          pinnedBottomRows={[TOTAL]}
          defaultSorts={[{ columnKey: 'orders', direction: 'asc' }]}
        />,
      );

      // A total is not a row of data competing for a position.
      expect(cellText('orders')).toEqual(['10', '20', '30', '40', '100']);
    });
  });

  describe('row numbers', () => {
    it('are off unless asked for', () => {
      renderWithRoot(<DataTable data={ROWS} columns={COLUMNS} />);

      expect(grid().querySelectorAll('[data-kind="row-number"]')).toHaveLength(
        0,
      );
    });

    it('number the rows from one', () => {
      renderWithRoot(
        <DataTable showRowNumbers data={ROWS} columns={COLUMNS} />,
      );

      const numbers = Array.from(
        grid().querySelectorAll('tbody [data-kind="row-number"]'),
      ).map((cell) => cell.textContent?.trim());

      expect(numbers).toEqual(['1', '2', '3', '4']);
      expect(grid()).toHaveAttribute('aria-colcount', '3');
    });

    it('stay continuous across SERVER pages too', () => {
      renderWithRoot(
        <DataTable
          showRowNumbers
          data={ROWS.slice(0, 2)}
          columns={COLUMNS}
          paginationMode="server"
          page={3}
          pageSize={10}
          total={100}
        />,
      );

      // The server handed us page 3 of 10, so these are rows 21 and 22 — the
      // page and its size are just as known here as in client mode.
      expect(
        Array.from(
          grid().querySelectorAll('tbody [data-kind="row-number"]'),
        ).map((cell) => cell.textContent?.trim()),
      ).toEqual(['21', '22']);
    });

    it('stay continuous across pages', async () => {
      renderWithRoot(
        <DataTable
          showRowNumbers
          data={ROWS}
          columns={COLUMNS}
          defaultPageSize={2}
          autoHidePagination={false}
        />,
      );

      await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));

      // Row 3 is row 3, not row 1 of page two.
      await waitFor(() =>
        expect(
          Array.from(
            grid().querySelectorAll('tbody [data-kind="row-number"]'),
          ).map((cell) => cell.textContent?.trim()),
        ).toEqual(['3', '4']),
      );
    });
  });

  it('paginates like ItemTable', async () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={COLUMNS}
        defaultPageSize={2}
        autoHidePagination={false}
      />,
    );

    expect(bodyRows()).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));

    await waitFor(() => expect(cellText('region')[0]).toBe('eu-west-1'));
  });

  describe('cell selection', () => {
    const cell = (rowIndex: number, key: string) =>
      Array.from(grid().querySelectorAll(`tbody tr[data-element="Row"]`))[
        rowIndex
      ].querySelector<HTMLElement>(`[data-key="${key}"]`)!;
    const selected = () =>
      Array.from(grid().querySelectorAll('[data-cell-selected]')).map(
        (el) => el.getAttribute('data-key') + '@' + el.textContent?.trim(),
      );

    it('selects the pressed cell', async () => {
      renderWithRoot(<DataTable data={ROWS} columns={COLUMNS} />);

      await userEvent.pointer({
        target: cell(1, 'orders'),
        keys: '[MouseLeft]',
      });

      expect(selected()).toEqual(['orders@10']);
    });

    it('grows a rectangle on shift-click', async () => {
      const user = userEvent.setup();

      renderWithRoot(<DataTable data={ROWS} columns={COLUMNS} />);

      await user.pointer({ target: cell(0, 'region'), keys: '[MouseLeft]' });
      await user.keyboard('{Shift>}');
      await user.pointer({ target: cell(1, 'orders'), keys: '[MouseLeft]' });
      await user.keyboard('{/Shift}');

      // Both columns of both rows — the block between the two corners, not the
      // two cells that were clicked.
      await waitFor(() =>
        expect(selected()).toEqual([
          'region@eu-west-1',
          'orders@30',
          'region@us-east-1',
          'orders@10',
        ]),
      );
    });

    it('reaches a pinned total on shift-click', async () => {
      const user = userEvent.setup();
      const TOTAL: Row = { id: 'total', region: 'Total', orders: 100 };

      renderWithRoot(
        <DataTable data={ROWS} columns={COLUMNS} pinnedBottomRows={[TOTAL]} />,
      );

      const total = grid().querySelector<HTMLElement>(
        'tr[data-pinned="bottom"] [data-key="orders"]',
      )!;

      await user.pointer({ target: cell(0, 'orders'), keys: '[MouseLeft]' });
      await user.keyboard('{Shift>}');
      await user.pointer({ target: total, keys: '[MouseLeft]' });
      await user.keyboard('{/Shift}');

      // A total is a figure like any other. Selecting the column it sums and
      // then having to copy it separately is the wrong trade.
      await waitFor(() =>
        expect(
          grid().querySelectorAll('tr[data-pinned] [data-cell-selected]'),
        ).toHaveLength(1),
      );
      expect(selected()).toEqual([
        'orders@30',
        'orders@10',
        'orders@20',
        'orders@40',
        'orders@100',
      ]);
    });

    it('makes a vetoed cell inert', async () => {
      const user = userEvent.setup();
      const TOTAL: Row = { id: 'total', region: 'Total', orders: 100 };

      renderWithRoot(
        <DataTable
          data={ROWS}
          columns={COLUMNS}
          pinnedBottomRows={[TOTAL]}
          isCellSelectable={({ section, columnKey }) =>
            !(section === 'pinnedBottom' && columnKey === 'region')
          }
        />,
      );

      const label = grid().querySelector<HTMLElement>(
        'tr[data-pinned="bottom"] [data-key="region"]',
      )!;

      await user.pointer({ target: cell(1, 'region'), keys: '[MouseLeft]' });
      expect(selected()).toEqual(['region@us-east-1']);

      // Pressing it neither selects it nor disturbs the standing selection.
      await user.pointer({ target: label, keys: '[MouseLeft]' });
      expect(selected()).toEqual(['region@us-east-1']);

      // Nor can a range be extended onto it.
      await user.keyboard('{Shift>}');
      await user.pointer({ target: label, keys: '[MouseLeft]' });
      await user.keyboard('{/Shift}');
      expect(selected()).toEqual(['region@us-east-1']);
    });

    it('skips a vetoed cell inside the block but keeps its shape', async () => {
      const user = userEvent.setup();
      const TOTAL: Row = { id: 'total', region: 'Total', orders: 100 };

      renderWithRoot(
        <DataTable
          data={ROWS}
          columns={COLUMNS}
          pinnedBottomRows={[TOTAL]}
          isCellSelectable={({ section, columnKey }) =>
            !(section === 'pinnedBottom' && columnKey === 'region')
          }
        />,
      );

      const totalOrders = grid().querySelector<HTMLElement>(
        'tr[data-pinned="bottom"] [data-key="orders"]',
      )!;

      await user.pointer({ target: cell(3, 'region'), keys: '[MouseLeft]' });
      await user.keyboard('{Shift>}');
      await user.pointer({ target: totalOrders, keys: '[MouseLeft]' });
      await user.keyboard('{/Shift}');

      // The block spans both columns of both rows; the vetoed label is the one
      // cell inside it that stays dark.
      await waitFor(() =>
        expect(selected()).toEqual([
          'region@us-east-1',
          'orders@40',
          'orders@100',
        ]),
      );

      const written: Record<string, string> = {};
      const event = new Event('copy', { bubbles: true, cancelable: true });

      Object.defineProperty(event, 'clipboardData', {
        value: {
          setData: (type: string, value: string) => {
            written[type] = value;
          },
        },
      });
      totalOrders.dispatchEvent(event);

      // An empty field rather than a missing one, so the paste is still a grid.
      expect(written['text/plain']).toBe('us-east-1\t40\n\t100');
    });

    it('clears on Escape', async () => {
      const user = userEvent.setup();

      renderWithRoot(<DataTable data={ROWS} columns={COLUMNS} />);

      await user.pointer({ target: cell(1, 'orders'), keys: '[MouseLeft]' });
      expect(selected()).toHaveLength(1);

      // The press moves focus to the scroller, which is where the range's
      // shortcuts are handled — a `<td>` cannot hold focus itself.
      await user.keyboard('{Escape}');

      await waitFor(() => expect(selected()).toHaveLength(0));
    });

    it('is off when asked', async () => {
      renderWithRoot(
        <DataTable data={ROWS} columns={COLUMNS} cellSelectionMode="none" />,
      );

      await userEvent.pointer({
        target: cell(1, 'orders'),
        keys: '[MouseLeft]',
      });

      expect(selected()).toHaveLength(0);
    });

    it('copies the range as TSV', async () => {
      const user = userEvent.setup();

      renderWithRoot(<DataTable data={ROWS} columns={COLUMNS} />);

      await user.pointer({ target: cell(0, 'region'), keys: '[MouseLeft]' });
      await user.keyboard('{Shift>}');
      await user.pointer({ target: cell(1, 'orders'), keys: '[MouseLeft]' });
      await user.keyboard('{/Shift}');

      const written: Record<string, string> = {};
      const event = new Event('copy', { bubbles: true, cancelable: true });

      Object.defineProperty(event, 'clipboardData', {
        value: {
          setData: (type: string, value: string) => {
            written[type] = value;
          },
        },
      });
      cell(0, 'region').dispatchEvent(event);

      // Rows by newline, cells by tab — what a spreadsheet pastes as a grid.
      expect(written['text/plain']).toBe('eu-west-1\t30\nus-east-1\t10');
      expect(written['text/html']).toContain('<td>eu-west-1</td>');

      // Nothing on screen changes when a copy succeeds, so the count is the
      // only confirmation the right block went.
      expect(
        await screen.findByText('Copied to clipboard'),
      ).toBeInTheDocument();
      expect(await screen.findByText('4 cells copied')).toBeInTheDocument();
    });
  });

  it('numbers rows for assistive tech across the whole result', () => {
    const TOTAL: Row = { id: 'total', region: 'Total', orders: 100 };

    renderWithRoot(
      <DataTable
        data={ROWS.slice(0, 2)}
        columns={COLUMNS}
        pinnedTopRows={[TOTAL]}
        pinnedBottomRows={[TOTAL]}
        paginationMode="server"
        page={3}
        pageSize={10}
        total={100}
      />,
    );

    // 1 header + 1 pinned top + 100 body + 1 pinned bottom.
    expect(grid()).toHaveAttribute('aria-rowcount', '103');

    const indexOf = (selector: string) =>
      grid().querySelector(selector)?.getAttribute('aria-rowindex');

    // Header 1, pinned top 2, body starts after the 20 rows of pages 1–2, and
    // the pinned bottom sits past the whole body — not past this page.
    expect(indexOf('thead tr')).toBe('1');
    expect(indexOf('tr[data-pinned="top"]')).toBe('2');
    expect(indexOf('tbody tr:not([data-pinned])')).toBe('23');
    expect(indexOf('tr[data-pinned="bottom"]')).toBe('103');
  });

  it('names the section a cell was rendered in', () => {
    const TOTAL: Row = { id: 'total', region: 'Total', orders: 100 };
    const seen = new Map<string, string>();

    renderWithRoot(
      <DataTable
        data={ROWS.slice(0, 1)}
        columns={[
          {
            key: 'orders',
            title: 'Orders',
            render: (value, row, _i, ctx) => {
              // Keyed, not appended: `render` runs more than once per cell.
              seen.set(String(row.id) + ':' + ctx.section, ctx.section);

              return String(value);
            },
          },
        ]}
        pinnedTopRows={[TOTAL]}
        pinnedBottomRows={[TOTAL]}
      />,
    );

    // A `render` / `cellStyles` callback has to be able to tell a total from a
    // row of data.
    expect(new Set(seen.values())).toEqual(
      new Set(['pinnedTop', 'body', 'pinnedBottom']),
    );
  });

  it('adds resize handles by default', () => {
    renderWithRoot(<DataTable data={ROWS} columns={COLUMNS} />);

    // Unlike `ItemTable`, where resizing is opt-in: a result grid is the case
    // it exists for.
    expect(
      grid().querySelectorAll('[data-element="Resizer"]').length,
    ).toBeGreaterThan(0);
  });
});
