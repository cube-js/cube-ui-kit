import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';

import { ItemTable } from './ItemTable';

import type { CubeItemTableColumn } from './types';

interface Row {
  id: string;
  name: string;
}

const COLUMNS: CubeItemTableColumn<Row>[] = [
  { key: 'name', title: 'Name', isRowHeader: true, isSortable: true },
];

const ROWS: Row[] = Array.from({ length: 37 }, (_, i) => ({
  id: `row-${i}`,
  name: `row-${String(i).padStart(2, '0')}`,
}));

const KEY = 'cube-ui-kit:table:deployments';

const names = () =>
  screen.getAllByRole('rowheader').map((cell) => cell.textContent?.trim());

const stored = () => JSON.parse(localStorage.getItem(KEY) ?? '{}');

describe('ItemTable persistence', () => {
  beforeEach(() => localStorage.clear());

  it('stores nothing without a storageKey', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        defaultPageSize={10}
        pageSizeOptions={[10, 20]}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Items per page/ }),
    );
    await userEvent.click(screen.getByRole('option', { name: '20 / page' }));

    expect(localStorage.length).toBe(0);
  });

  it('persists the page size and restores it on the next mount', async () => {
    const { unmount } = renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        storageKey="deployments"
        defaultPageSize={10}
        pageSizeOptions={[10, 20]}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Items per page/ }),
    );
    await userEvent.click(screen.getByRole('option', { name: '20 / page' }));

    await waitFor(() => expect(stored().pageSize).toBe(20));

    unmount();

    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        storageKey="deployments"
        defaultPageSize={10}
        pageSizeOptions={[10, 20]}
      />,
    );

    expect(names()).toHaveLength(20);
  });

  it('does not persist sort unless asked', async () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} storageKey="deployments" />,
    );

    await userEvent.click(screen.getByRole('columnheader', { name: /Name/ }));

    // `sort` is not in the default `persist` list.
    await waitFor(() => expect(stored().sort).toBeUndefined());
  });

  it('persists sort when listed', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        storageKey="deployments"
        persist={['sort']}
      />,
    );

    await userEvent.click(screen.getByRole('columnheader', { name: /Name/ }));

    await waitFor(() =>
      expect(stored().sort).toEqual({ columnKey: 'name', direction: 'asc' }),
    );
  });

  it('never stores controlled state', async () => {
    const onPageSizeChange = vi.fn();

    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        storageKey="deployments"
        pageSize={10}
        pageSizeOptions={[10, 20]}
        onPageSizeChange={onPageSizeChange}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Items per page/ }),
    );
    await userEvent.click(screen.getByRole('option', { name: '20 / page' }));

    // The page owns a controlled `pageSize`; storing it here would give the
    // table a second, competing source of truth.
    expect(onPageSizeChange).toHaveBeenCalledWith(20);
    expect(stored().pageSize).toBeUndefined();
  });

  it('ignores a corrupt stored value', () => {
    localStorage.setItem(KEY, 'not json');

    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        storageKey="deployments"
        defaultPageSize={10}
      />,
    );

    expect(names()).toHaveLength(10);
  });
});
