import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';

import { ItemTable } from './ItemTable';

import type { CubeItemTableColumn } from './types';

interface Row {
  id: string;
  name: string;
  owner: { name: string };
  status: 'running' | 'stopped';
  meta: { nested: boolean };
  count: number;
}

const ROWS: Row[] = [
  {
    id: '1',
    name: 'analytics-prod',
    owner: { name: 'Ada' },
    status: 'running',
    meta: { nested: true },
    count: 1204,
  },
  {
    id: '2',
    name: 'billing-etl',
    owner: { name: 'Grace' },
    status: 'stopped',
    meta: { nested: true },
    count: 7,
  },
];

const COLUMNS: CubeItemTableColumn<Row>[] = [
  { key: 'name', title: 'Name', isRowHeader: true },
  { key: 'owner.name', title: 'Owner' },
  { key: 'status', title: 'Status' },
];

const names = () =>
  screen.getAllByRole('rowheader').map((c) => c.textContent?.trim());

function searchBox() {
  return screen.getByRole('searchbox');
}

describe('ItemTable search', () => {
  it('renders no toolbar unless something needs one', () => {
    renderWithRoot(<ItemTable data={ROWS} columns={COLUMNS} />);

    expect(screen.queryByRole('toolbar')).toBeNull();
    expect(screen.queryByRole('searchbox')).toBeNull();
  });

  it('renders the search input when asked', () => {
    renderWithRoot(<ItemTable data={ROWS} columns={COLUMNS} isSearchable />);

    expect(screen.getByRole('toolbar')).toBeInTheDocument();
    expect(searchBox()).toBeInTheDocument();
  });

  it('filters on the display text of every searchable column', async () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} isSearchable searchDelay={0} />,
    );

    await userEvent.type(searchBox(), 'grace');

    // Matches through a dotted path — the case cloud's raw-value filter missed.
    await waitFor(() => expect(names()).toEqual(['billing-etl']));
  });

  it('matches formatted text rather than the raw value', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={[
          COLUMNS[0],
          {
            key: 'count',
            title: 'Count',
            format: (v: number) => v.toLocaleString('en-US'),
          },
        ]}
        isSearchable
        searchDelay={0}
      />,
    );

    // "1,204" only exists after formatting; the raw value is 1204.
    await userEvent.type(searchBox(), '1,204');

    await waitFor(() => expect(names()).toEqual(['analytics-prod']));
  });

  it('never matches a non-primitive column as "[object Object]"', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={[COLUMNS[0], { key: 'meta', title: 'Meta' }]}
        isSearchable
        searchDelay={0}
        noResultsLabel="Nope"
      />,
    );

    // The exact cloud bug: stringifying an object made "object" match
    // every row that had one.
    await userEvent.type(searchBox(), 'object');

    await waitFor(() => expect(screen.getByText('Nope')).toBeInTheDocument());
  });

  it('skips columns marked isSearchable: false', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={[COLUMNS[0], { ...COLUMNS[1], isSearchable: false }]}
        isSearchable
        searchDelay={0}
        noResultsLabel="Nope"
      />,
    );

    await userEvent.type(searchBox(), 'grace');

    await waitFor(() => expect(screen.getByText('Nope')).toBeInTheDocument());
  });

  it('shows the no-results label, not the empty label, while searching', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        isSearchable
        searchDelay={0}
        emptyLabel="Nothing exists"
        noResultsLabel="No matches"
      />,
    );

    await userEvent.type(searchBox(), 'zzzz');

    // A client-search page gets this for free; in cloud only pages that owned
    // the term could distinguish the two.
    await waitFor(() =>
      expect(screen.getByText('No matches')).toBeInTheDocument(),
    );
    expect(screen.queryByText('Nothing exists')).toBeNull();
  });

  it('accepts a custom matcher', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        isSearchable
        searchDelay={0}
        searchFilter={(row, query) => row.status.includes(query)}
      />,
    );

    await userEvent.type(searchBox(), 'stop');

    await waitFor(() => expect(names()).toEqual(['billing-etl']));
  });

  it('never filters in server mode, but still reports the term', async () => {
    const onSearchChange = vi.fn();

    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        isSearchable
        searchMode="server"
        searchDelay={0}
        onSearchChange={onSearchChange}
      />,
    );

    await userEvent.type(searchBox(), 'grace');

    await waitFor(() => expect(onSearchChange).toHaveBeenCalled());
    expect(names()).toEqual(['analytics-prod', 'billing-etl']);
  });

  it('drives the matcher from a controlled term with no built-in input', async () => {
    // The audit-log pattern: the page owns the input, the table owns the filter.
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        isSearchable={false}
        searchValue="grace"
        searchDelay={0}
      />,
    );

    expect(screen.queryByRole('searchbox')).toBeNull();
    await waitFor(() => expect(names()).toEqual(['billing-etl']));
  });

  it('renders filters, actions and refresh in the toolbar', async () => {
    const onRefresh = vi.fn();

    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        isSearchable
        filters={<button type="button">Filter</button>}
        actions={<button type="button">Create</button>}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(onRefresh).toHaveBeenCalled();
  });

  it('lets a custom toolbar reuse the bound search input', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        searchDelay={0}
        toolbar={<ItemTable.Toolbar isSearchable />}
      />,
    );

    // The context provider wraps regardless of which toolbar renders, so the
    // term still has exactly one owner.
    await userEvent.type(searchBox(), 'grace');

    await waitFor(() => expect(names()).toEqual(['billing-etl']));
  });

  it('throws a helpful error when ItemTable.Search is used outside a table', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderWithRoot(<ItemTable.Search />)).toThrow(
      /must be rendered inside an ItemTable/,
    );

    spy.mockRestore();
  });

  it('searches before sorting, so sort applies to the matches', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS.map((c) => ({ ...c, isSortable: true }))}
        isSearchable
        searchDelay={0}
        defaultSort={{ columnKey: 'name', direction: 'desc' }}
      />,
    );

    expect(names()).toEqual(['billing-etl', 'analytics-prod']);

    await userEvent.type(searchBox(), 'a');

    await waitFor(() =>
      expect(names()).toEqual(['billing-etl', 'analytics-prod']),
    );
  });
});
