import { renderWithRoot, screen, within } from '../../../test';
import { getColumnText, readPath } from '../TableBase/use-table-columns';

import { ItemTable } from './ItemTable';

import type { CubeItemTableColumn } from './types';

interface Row {
  id: string;
  name: string;
  owner: { name: string };
  count: number;
}

const ROWS: Row[] = [
  { id: 'a', name: 'Alpha', owner: { name: 'Ada' }, count: 1204 },
  { id: 'b', name: 'Beta', owner: { name: 'Grace' }, count: 7 },
  { id: 'c', name: 'Gamma', owner: { name: 'Alan' }, count: 91 },
];

const COLUMNS: CubeItemTableColumn<Row>[] = [
  { key: 'name', title: 'Name', isRowHeader: true },
  { key: 'owner.name', title: 'Owner' },
  { key: 'count', title: 'Count', align: 'end' },
];

describe('readPath', () => {
  it('reads a plain key', () => {
    expect(readPath({ a: 1 }, 'a')).toBe(1);
  });

  it('walks a dotted path', () => {
    expect(readPath({ a: { b: { c: 3 } } }, 'a.b.c')).toBe(3);
  });

  it('stops at a nullish segment instead of throwing', () => {
    expect(readPath({ a: null }, 'a.b.c')).toBeUndefined();
    expect(readPath(null, 'a')).toBeUndefined();
  });
});

describe('getColumnText', () => {
  it('applies format', () => {
    const column = {
      key: 'count',
      format: (v: number) => v.toLocaleString('en-US'),
    };

    expect(getColumnText(column, { count: 1204 }, 0)).toBe('1,204');
  });

  it('stringifies primitives', () => {
    expect(getColumnText({ key: 'a' }, { a: 5 }, 0)).toBe('5');
    expect(getColumnText({ key: 'a' }, { a: true }, 0)).toBe('true');
    expect(getColumnText({ key: 'a' }, { a: null }, 0)).toBe('');
  });

  it('returns null for a non-primitive with no format, never "[object Object]"', () => {
    // This is the cloud bug being designed out: stringifying an object made the
    // query "object" match every row with a nested value.
    expect(getColumnText({ key: 'a' }, { a: { b: 1 } }, 0)).toBeNull();
    expect(getColumnText({ key: 'a' }, { a: [1, 2] }, 0)).toBeNull();
  });
});

describe('<ItemTable />', () => {
  it('renders a grid with document-absolute ARIA indices', () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} ariaLabel="Rows" />,
    );

    const grid = screen.getByRole('grid', { name: 'Rows' });

    // 1 header row + 3 body rows.
    expect(grid).toHaveAttribute('aria-rowcount', '4');
    expect(grid).toHaveAttribute('aria-colcount', '3');

    const rows = within(grid).getAllByRole('row');

    expect(rows[0]).toHaveAttribute('aria-rowindex', '1');
    expect(rows[1]).toHaveAttribute('aria-rowindex', '2');
    expect(rows[3]).toHaveAttribute('aria-rowindex', '4');
  });

  it('renders column headers with 1-based colindex', () => {
    renderWithRoot(<ItemTable data={ROWS} columns={COLUMNS} />);

    const headers = screen.getAllByRole('columnheader');

    expect(headers).toHaveLength(3);
    expect(headers[0]).toHaveAttribute('aria-colindex', '1');
    expect(headers[2]).toHaveAttribute('aria-colindex', '3');
    expect(headers[0]).toHaveTextContent('Name');
  });

  it('resolves dotted column keys against the row', () => {
    renderWithRoot(<ItemTable data={ROWS} columns={COLUMNS} />);

    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Grace')).toBeInTheDocument();
  });

  it('applies column.format to the displayed value', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={[
          {
            key: 'count',
            title: 'Count',
            format: (v: number) => v.toLocaleString('en-US'),
          },
        ]}
      />,
    );

    expect(screen.getByText('1,204')).toBeInTheDocument();
  });

  it('prefers column.render over the formatted text', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={[
          {
            key: 'name',
            title: 'Name',
            render: (value: string) => <b>{value.toUpperCase()}</b>,
          },
        ]}
      />,
    );

    expect(screen.getByText('ALPHA')).toBeInTheDocument();
  });

  it('marks the row-header column as th scope="row"', () => {
    renderWithRoot(<ItemTable data={ROWS} columns={COLUMNS} />);

    const rowHeader = screen.getByRole('rowheader', { name: 'Alpha' });

    expect(rowHeader.tagName).toBe('TH');
    expect(rowHeader).toHaveAttribute('scope', 'row');
  });

  it('uses the row key for React identity', () => {
    const { rerender } = renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} />,
    );

    expect(screen.getByText('Alpha').closest('tr')).toHaveAttribute(
      'data-key',
      'a',
    );

    rerender(<ItemTable data={ROWS} columns={COLUMNS} rowKey="name" />);

    expect(screen.getByText('Alpha').closest('tr')).toHaveAttribute(
      'data-key',
      'Alpha',
    );
  });

  it('prefers getRowKey over rowKey', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        getRowKey={(row) => `row-${row.id}`}
      />,
    );

    expect(screen.getByText('Alpha').closest('tr')).toHaveAttribute(
      'data-key',
      'row-a',
    );
  });

  it('shows the empty label when there is nothing', () => {
    renderWithRoot(<ItemTable data={[]} columns={COLUMNS} />);

    expect(screen.getByText('No items')).toBeInTheDocument();
  });

  it('shows the no-results label instead when filtered', () => {
    renderWithRoot(<ItemTable data={[]} columns={COLUMNS} isFiltered />);

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.queryByText('No items')).toBeNull();
  });

  it('lets both labels be overridden', () => {
    const { rerender } = renderWithRoot(
      <ItemTable data={[]} columns={COLUMNS} emptyLabel="Nothing here" />,
    );

    expect(screen.getByText('Nothing here')).toBeInTheDocument();

    rerender(
      <ItemTable
        data={[]}
        columns={COLUMNS}
        isFiltered
        noResultsLabel="No matches"
      />,
    );

    expect(screen.getByText('No matches')).toBeInTheDocument();
  });

  it('shows the error over both labels', () => {
    renderWithRoot(
      <ItemTable data={[]} columns={COLUMNS} isFiltered error="Boom" />,
    );

    expect(screen.getByText('Boom')).toBeInTheDocument();
    expect(screen.queryByText('No results found')).toBeNull();
  });

  it('renders skeleton rows while loading with no data', () => {
    renderWithRoot(
      <ItemTable
        data={[]}
        columns={COLUMNS}
        isLoading
        skeletonRowCount={4}
        ariaLabel="Rows"
      />,
    );

    const grid = screen.getByRole('grid', { name: 'Rows' });

    expect(grid).toHaveAttribute('aria-busy', 'true');
    // 1 header row + 4 skeleton rows.
    expect(within(grid).getAllByRole('row')).toHaveLength(5);
  });

  it('keeps existing rows visible while loading more', () => {
    renderWithRoot(<ItemTable data={ROWS} columns={COLUMNS} isLoading />);

    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('hides the header row when asked, and drops it from aria-rowcount', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        isHeaderHidden
        ariaLabel="Rows"
      />,
    );

    expect(screen.queryAllByRole('columnheader')).toHaveLength(0);
    expect(screen.getByRole('grid', { name: 'Rows' })).toHaveAttribute(
      'aria-rowcount',
      '3',
    );
  });

  it('skips hidden columns entirely', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={[COLUMNS[0], { ...COLUMNS[1], isHidden: true }, COLUMNS[2]]}
        ariaLabel="Rows"
      />,
    );

    expect(screen.queryByText('Ada')).toBeNull();
    expect(screen.getByRole('grid', { name: 'Rows' })).toHaveAttribute(
      'aria-colcount',
      '2',
    );
  });

  it('orders pinned columns to the edges regardless of source order', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={[
          { key: 'name', title: 'Name' },
          { key: 'count', title: 'Count', pin: 'end' },
          { key: 'owner.name', title: 'Owner', pin: 'start' },
        ]}
      />,
    );

    const headers = screen.getAllByRole('columnheader');

    // DOM order must match the visual order so `aria-colindex` stays truthful
    // without any CSS `order:` reshuffling.
    expect(headers.map((h) => h.textContent)).toEqual([
      'Owner',
      'Name',
      'Count',
    ]);
    expect(headers[0]).toHaveAttribute('data-pin', 'start');
    expect(headers[2]).toHaveAttribute('data-pin', 'end');
  });

  it('applies getRowProps output to the row', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        getRowProps={({ row }) =>
          row.id === 'b'
            ? { isDimmed: true, qa: 'DimmedRow', mods: { custom: true } }
            : undefined
        }
      />,
    );

    const row = screen.getByText('Beta').closest('tr')!;

    expect(row).toHaveAttribute('data-dimmed');
    expect(row).toHaveAttribute('data-custom');
    expect(row).toHaveAttribute('data-qa', 'DimmedRow');
    expect(screen.getByText('Alpha').closest('tr')).not.toHaveAttribute(
      'data-dimmed',
    );
  });

  it('marks the last row, but only drops its divider in card shape', () => {
    const { rerender } = renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} shape="card" />,
    );

    const cellsOf = (text: string) =>
      Array.from(
        screen
          .getByText(text)
          .closest('tr')!
          .querySelectorAll('[data-element="Cell"]'),
      );
    const lastCells = () => cellsOf('Gamma');
    const firstCells = () => cellsOf('Alpha');

    // Every cell of the final row is marked; nothing else is. The flag is
    // stamped here rather than derived with `@parent(:last-child)`, whose
    // negation would strip the divider from every row.
    for (const cell of lastCells()) {
      expect(cell).toHaveAttribute('data-last-row');
    }
    for (const cell of firstCells()) {
      expect(cell).not.toHaveAttribute('data-last-row');
    }

    // The marker is shape-independent; only the styling reacts to it.
    rerender(<ItemTable data={ROWS} columns={COLUMNS} />);

    for (const cell of lastCells()) {
      expect(cell).toHaveAttribute('data-last-row');
    }
  });

  it('marks odd rows only when striped', () => {
    const { rerender } = renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} />,
    );

    expect(screen.getByText('Beta').closest('tr')).not.toHaveAttribute(
      'data-odd',
    );

    rerender(<ItemTable data={ROWS} columns={COLUMNS} isStriped />);

    expect(screen.getByText('Beta').closest('tr')).toHaveAttribute('data-odd');
    expect(screen.getByText('Alpha').closest('tr')).not.toHaveAttribute(
      'data-odd',
    );
  });

  it('survives columns arriving after the loading skeleton', () => {
    const { rerender } = renderWithRoot(
      <ItemTable isLoading data={[]} columns={[]} />,
    );

    // Mounting with no columns while loading and filling them in from the
    // response is the ordinary shape. It used to throw "Rendered more hooks
    // than during the previous render": the skeleton path returned before
    // sixteen hooks, so the first render with columns called more of them than
    // the render without.
    rerender(
      <ItemTable
        data={[{ id: '1', name: 'alpha' }]}
        columns={[{ key: 'name', title: 'Name' }]}
      />,
    );

    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByText('alpha')).toBeInTheDocument();
  });
});
