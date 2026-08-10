import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';

import { ItemTable } from './ItemTable';

import type { CubeItemTableColumn } from './types';

interface Row {
  id: string;
  name: string;
}

const COLUMNS: CubeItemTableColumn<Row>[] = [
  { key: 'name', title: 'Name', isRowHeader: true },
];

const ROWS: Row[] = Array.from({ length: 37 }, (_, i) => ({
  id: `row-${i}`,
  name: `row-${String(i).padStart(2, '0')}`,
}));

const names = () =>
  screen.getAllByRole('rowheader').map((cell) => cell.textContent?.trim());

describe('ItemTable pagination', () => {
  it('slices the data in client mode', () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} defaultPageSize={10} />,
    );

    expect(names()).toHaveLength(10);
    expect(names()[0]).toBe('row-00');
  });

  it('moves between pages', async () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} defaultPageSize={10} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));

    await waitFor(() => expect(names()[0]).toBe('row-10'));
  });

  it('renders the localized summary', () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} defaultPageSize={10} />,
    );

    expect(screen.getByText('1–10 of 37')).toBeInTheDocument();
  });

  it('renders no footer at all when pagination is off and no slot is used', () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} paginationMode="off" />,
    );

    expect(screen.queryByTestId('ItemTableFooter')).toBeNull();
    expect(names()).toHaveLength(37);
  });

  it('renders the footer for slots even with pagination off', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        paginationMode="off"
        footerStart={<button type="button">Load all results</button>}
      />,
    );

    // This is the slot that replaces Cloud's `MutationObserver` injection into
    // ag-grid's paging panel.
    expect(
      screen.getByRole('button', { name: 'Load all results' }),
    ).toBeInTheDocument();
  });

  it('places content in all three footer slots', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        paginationMode="off"
        footerStart={<span>start</span>}
        footerCenter={<span>center</span>}
        footerEnd={<span>end</span>}
      />,
    );

    const footer = screen.getByTestId('ItemTableFooter');

    expect(
      footer.querySelector('[data-element="Start"]')?.textContent,
    ).toContain('start');
    expect(
      footer.querySelector('[data-element="Center"]')?.textContent,
    ).toContain('center');
    expect(footer.querySelector('[data-element="End"]')?.textContent).toContain(
      'end',
    );
  });

  it('never slices in server mode, but reports page changes', async () => {
    const onPageChange = vi.fn();

    renderWithRoot(
      <ItemTable
        data={ROWS.slice(0, 10)}
        columns={COLUMNS}
        paginationMode="server"
        page={1}
        pageSize={10}
        total={37}
        onPageChange={onPageChange}
      />,
    );

    // The query returned exactly one page; the table must not slice it again.
    expect(names()).toHaveLength(10);
    expect(screen.getByText('1–10 of 37')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('resets to the first page when the page size changes', async () => {
    const onPageSizeChange = vi.fn();

    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        defaultPageSize={10}
        pageSizeOptions={[10, 20]}
        onPageSizeChange={onPageSizeChange}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    await waitFor(() => expect(names()[0]).toBe('row-20'));

    await userEvent.click(
      screen.getByRole('button', { name: /Items per page/ }),
    );
    await userEvent.click(
      await screen.findByRole('option', { name: '20 / page' }),
    );

    // Page 3 of a 20-per-page list is a different set of rows, so staying on it
    // would silently move the user.
    await waitFor(() => expect(names()[0]).toBe('row-00'));
    expect(onPageSizeChange).toHaveBeenCalledWith(20);
  });

  it('paginates the search results, not the raw data', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        isSearchable
        searchDelay={0}
        defaultPageSize={10}
        // 10 matches on one page would auto-hide the control; this test is
        // about the summary counting filtered rows, so keep it on.
        autoHidePagination={false}
      />,
    );

    await userEvent.type(screen.getByRole('searchbox'), 'row-1');

    // `row-1` matches row-10 … row-19 — 10 of 37. The summary must count the
    // filtered rows, not the raw array.
    await waitFor(() =>
      expect(screen.getByText('1–10 of 10')).toBeInTheDocument(),
    );
  });

  it('can be turned off entirely', () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} paginationMode="off" />,
    );

    expect(screen.queryByRole('navigation', { name: 'Pagination' })).toBeNull();
  });
});

describe('ItemTable loading behaviour', () => {
  const rows = ROWS.slice(0, 3);

  it('keeps the previous rows and shows an overlay by default', () => {
    renderWithRoot(
      <ItemTable
        data={rows}
        columns={COLUMNS}
        paginationMode="off"
        isLoading
      />,
    );

    // The point of `overlay`: a refresh must not blank a table that already has
    // an answer on screen.
    expect(names()).toEqual(['row-00', 'row-01', 'row-02']);
    expect(screen.getByRole('grid')).toHaveAttribute('aria-busy', 'true');
    expect(document.querySelector('[data-element="Overlay"]')).not.toBeNull();
  });

  it('discards the previous rows with loadingIndicator="skeleton"', () => {
    renderWithRoot(
      <ItemTable
        data={rows}
        columns={COLUMNS}
        paginationMode="off"
        isLoading
        loadingIndicator="skeleton"
        skeletonRowCount={4}
      />,
    );

    expect(screen.queryByText('row-00')).toBeNull();
    expect(document.querySelectorAll('tr[data-placeholder]')).toHaveLength(4);
  });

  it('paints nothing with loadingIndicator="none"', () => {
    renderWithRoot(
      <ItemTable
        data={rows}
        columns={COLUMNS}
        paginationMode="off"
        isLoading
        loadingIndicator="none"
      />,
    );

    expect(names()).toEqual(['row-00', 'row-01', 'row-02']);
    expect(document.querySelector('[data-element="Overlay"]')).toBeNull();
    expect(document.querySelectorAll('tr[data-placeholder]')).toHaveLength(0);
    // Only the ARIA signal remains — the page owns the indicator.
    expect(screen.getByRole('grid')).toHaveAttribute('aria-busy', 'true');
  });

  it('falls back to skeletons when there are no previous rows to keep', () => {
    renderWithRoot(
      <ItemTable data={[]} columns={COLUMNS} isLoading skeletonRowCount={3} />,
    );

    expect(document.querySelectorAll('tr[data-placeholder]')).toHaveLength(3);
    expect(document.querySelector('[data-element="Overlay"]')).toBeNull();
  });

  it('does not flash the empty state before the first response', () => {
    renderWithRoot(
      <ItemTable
        data={[]}
        columns={COLUMNS}
        isLoading
        loadingIndicator="none"
        emptyLabel="No items"
      />,
    );

    expect(screen.queryByText('No items')).toBeNull();
  });
});

describe('ItemTable footer border', () => {
  const table = () => screen.getByRole('grid').closest('[data-qa]')!;

  it('marks the table when a footer renders, so the last row drops its border', () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} defaultPageSize={10} />,
    );

    // Without this the row separator and the footer's top border stack into one
    // 2px line.
    expect(table()).toHaveAttribute('data-has-footer');
  });

  it('leaves the last row its border when nothing follows', () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} paginationMode="off" />,
    );

    expect(table()).not.toHaveAttribute('data-has-footer');
  });

  it('marks it for a bare footer slot too', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        paginationMode="off"
        footerStart={<span>slot</span>}
      />,
    );

    expect(table()).toHaveAttribute('data-has-footer');
  });
});

describe('ItemTable auto-hidden pagination', () => {
  const FEW = ROWS.slice(0, 5);

  it('hides a control that cannot do anything', () => {
    renderWithRoot(<ItemTable data={FEW} columns={COLUMNS} />);

    // One page, and 5 rows would not split even at the smallest option.
    expect(screen.queryByRole('button', { name: 'Page 1' })).toBeNull();
    expect(screen.queryByTestId('ItemTableFooter')).toBeNull();
  });

  it('keeps it when a smaller page size would paginate', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS.slice(0, 15)}
        columns={COLUMNS}
        pageSizeOptions={[10, 20]}
      />,
    );

    // A single page of 15, but "10 / page" would make it two.
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
  });

  it('keeps it when there is more than one page', () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} defaultPageSize={10} />,
    );

    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
  });

  it('keeps it when a server page claims more to come', () => {
    renderWithRoot(
      <ItemTable
        data={FEW}
        columns={COLUMNS}
        paginationMode="server"
        page={1}
        pageSize={50}
        hasNextPage
      />,
    );

    // No total, but the query says there is another page.
    expect(
      screen.getByRole('button', { name: 'Next page' }),
    ).toBeInTheDocument();
  });

  it('can be turned off', () => {
    renderWithRoot(
      <ItemTable data={FEW} columns={COLUMNS} autoHidePagination={false} />,
    );

    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
  });

  it('still renders the footer for slots', () => {
    renderWithRoot(
      <ItemTable
        data={FEW}
        columns={COLUMNS}
        footerStart={<span>slot</span>}
      />,
    );

    // The control is gone, but the slot is the page's content and stays.
    expect(screen.getByText('slot')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Page 1' })).toBeNull();
  });
});
