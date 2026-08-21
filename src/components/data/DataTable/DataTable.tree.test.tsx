import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';

import { DataTable } from './DataTable';

import type { CubeDataTableColumn } from './types';

interface Row {
  id: string;
  name: string;
  value: number;
  children?: Row[];
}

const DATA: Row[] = [
  {
    id: 'z-root',
    name: 'Zulu',
    value: 2,
    children: [
      { id: 'z-b', name: 'Zulu B', value: 3 },
      { id: 'z-a', name: 'Zulu A', value: 1 },
    ],
  },
  {
    id: 'a-root',
    name: 'Alpha',
    value: 1,
    children: [{ id: 'a-child', name: 'Alpha child', value: 4 }],
  },
];

const COLUMNS: CubeDataTableColumn<Row>[] = [
  { key: 'name', title: 'Name', isSortable: true },
  { key: 'value', title: 'Value', dataType: 'number', isSortable: true },
];

const treeProps = {
  data: DATA,
  columns: COLUMNS,
  getRowChildren: (row: Row) => row.children,
  ariaLabel: 'Results tree',
};

const grid = () => screen.getByRole('treegrid', { name: 'Results tree' });
const rows = () =>
  Array.from(
    grid().querySelectorAll<HTMLTableRowElement>(
      'tbody tr[data-element="Row"]',
    ),
  );
const keys = () => rows().map((item) => item.dataset.key);
const row = (key: string) =>
  grid().querySelector<HTMLTableRowElement>(`tbody tr[data-key="${key}"]`)!;
const cell = (rowKey: string, columnKey: string) =>
  row(rowKey).querySelector<HTMLElement>(`[data-key="${columnKey}"]`)!;

describe('DataTable tree rows', () => {
  it('applies multi-sort recursively to every sibling collection', () => {
    renderWithRoot(
      <DataTable
        {...treeProps}
        defaultExpandedKeys={['z-root', 'a-root']}
        defaultSorts={[
          { columnKey: 'value', direction: 'asc' },
          { columnKey: 'name', direction: 'asc' },
        ]}
      />,
    );

    expect(keys()).toEqual(['a-root', 'a-child', 'z-root', 'z-a', 'z-b']);
  });

  it('paginates roots and keeps a complete expanded subtree on its page', async () => {
    renderWithRoot(
      <DataTable
        {...treeProps}
        defaultExpandedKeys={['z-root']}
        defaultPageSize={1}
        pageSizeOptions={[1]}
        autoHidePagination={false}
      />,
    );

    expect(keys()).toEqual(['z-root', 'z-b', 'z-a']);
    expect(row('z-root')).toHaveAttribute('aria-posinset', '1');
    expect(row('z-root')).toHaveAttribute('aria-setsize', '1');

    await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    await waitFor(() => expect(keys()).toEqual(['a-root']));
  });

  it('keeps pinned rows outside the hierarchy', () => {
    const total: Row = { id: 'total', name: 'Total', value: 11 };

    renderWithRoot(
      <DataTable
        {...treeProps}
        defaultExpandedKeys={['z-root']}
        pinnedTopRows={[total]}
      />,
    );

    const pinned = grid().querySelector<HTMLTableRowElement>(
      'tr[data-pinned="top"]',
    )!;
    expect(pinned).not.toHaveAttribute('aria-level');
    expect(pinned.querySelector('[data-element="TreeContent"]')).toBeNull();
    expect(row('z-root')).toHaveAttribute('aria-level', '1');
  });

  it('deactivates a controlled cell range while an endpoint is collapsed and restores it', async () => {
    const range = {
      fromRowKey: 'z-b',
      toRowKey: 'z-a',
      fromColumnKey: 'name',
      toColumnKey: 'value',
    };
    const { rerender } = renderWithRoot(
      <DataTable
        {...treeProps}
        expandedKeys={['z-root']}
        selectedCellRange={range}
      />,
    );

    expect(grid().querySelectorAll('[data-cell-selected]')).toHaveLength(4);

    rerender(
      <DataTable {...treeProps} expandedKeys={[]} selectedCellRange={range} />,
    );
    expect(grid().querySelectorAll('[data-cell-selected]')).toHaveLength(0);

    rerender(
      <DataTable
        {...treeProps}
        expandedKeys={['z-root']}
        selectedCellRange={range}
      />,
    );
    expect(grid().querySelectorAll('[data-cell-selected]')).toHaveLength(4);
  });

  it('numbers client root pages continuously and server tree pages from one', async () => {
    const { rerender } = renderWithRoot(
      <DataTable
        {...treeProps}
        defaultExpandedKeys={['z-root']}
        defaultPageSize={1}
        pageSizeOptions={[1]}
        autoHidePagination={false}
        showRowNumbers
      />,
    );

    expect(cell('z-root', '__cube-row-number__')).toHaveTextContent('1');
    await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    await waitFor(() =>
      expect(cell('a-root', '__cube-row-number__')).toHaveTextContent('4'),
    );

    rerender(
      <DataTable
        {...treeProps}
        data={[DATA[1]]}
        paginationMode="server"
        page={2}
        pageSize={1}
        total={2}
        showRowNumbers
      />,
    );
    expect(cell('a-root', '__cube-row-number__')).toHaveTextContent('1');
  });
});
