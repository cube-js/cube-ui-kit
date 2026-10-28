import { act, renderWithRoot, screen, userEvent, waitFor } from '../../../test';

import { ItemTable } from './ItemTable';

import type { CubeItemTableColumn, CubeItemTableSection } from './types';

vi.mock('../../../_internal/hooks/use-warn');

interface Row {
  id: string;
  name: string;
  favorite: boolean;
}
const ROWS: Row[] = [
  { id: 'o1', name: 'Zulu', favorite: false },
  { id: 'f1', name: 'Beta', favorite: true },
  { id: 'o2', name: 'Alpha', favorite: false },
  { id: 'f2', name: 'Delta', favorite: true },
];
const COLUMNS: CubeItemTableColumn<Row>[] = [
  { key: 'name', title: 'Name', isRowHeader: true, isSortable: true },
];
const SECTIONS: CubeItemTableSection[] = [
  { key: 'favorite', title: 'Favorites' },
  { key: 'other', title: 'Other items' },
  { key: 'empty', title: 'Empty section' },
];
const getSectionKey = (row: Row) => (row.favorite ? 'favorite' : 'other');
const options = {
  columns: COLUMNS,
  sections: SECTIONS,
  getSectionKey,
  isRowMoveAnimated: false,
  isVirtualized: false,
} as const;
const grid = () => screen.getByRole('grid');
const records = () =>
  Array.from(
    grid().querySelectorAll<HTMLTableRowElement>(
      'tbody tr[data-element="Row"]',
    ),
  );
const captions = () =>
  Array.from(
    grid().querySelectorAll<HTMLTableRowElement>(
      'tbody tr[data-element="SectionRow"]',
    ),
  );
const keys = () => records().map((row) => row.dataset.key);

describe('ItemTable sections', () => {
  it('orders sections and sorts only their real records, including clearing the sort', async () => {
    renderWithRoot(<ItemTable {...options} data={ROWS} paginationMode="off" />);
    expect(keys()).toEqual(['f1', 'f2', 'o1', 'o2']);
    expect(captions().map((row) => row.textContent)).toEqual([
      'Favorites',
      'Other items',
    ]);
    expect(screen.queryByText('Empty section')).toBeNull();
    const header = screen.getByRole('columnheader', { name: /Name/ });
    await userEvent.click(header);
    expect(keys()).toEqual(['f1', 'f2', 'o2', 'o1']);
    await userEvent.click(header);
    expect(keys()).toEqual(['f2', 'f1', 'o1', 'o2']);
    await userEvent.click(header);
    expect(keys()).toEqual(['f1', 'f2', 'o1', 'o2']);
  });

  it('omits sections removed by search and retains the no-results state', async () => {
    const { rerender } = renderWithRoot(
      <ItemTable
        {...options}
        data={ROWS}
        searchValue="Zulu"
        searchDelay={0}
        paginationMode="off"
      />,
    );
    await waitFor(() => expect(keys()).toEqual(['o1']));
    expect(captions().map((row) => row.textContent)).toEqual(['Other items']);
    expect(grid()).toHaveAttribute('aria-rowcount', '3');
    rerender(
      <ItemTable
        {...options}
        data={ROWS}
        searchValue="missing"
        searchDelay={0}
        paginationMode="off"
      />,
    );
    await screen.findByText('No results found');
    expect(captions()).toHaveLength(0);
  });

  it('repeats the current section on page boundaries without consuming page slots or changing totals', async () => {
    const rows = Array.from({ length: 6 }, (_, i) => ({
      id: String(i),
      name: String(i),
      favorite: i < 3,
    }));
    renderWithRoot(
      <ItemTable
        {...options}
        data={rows}
        defaultPageSize={2}
        pageSizeOptions={[2]}
      />,
    );
    expect(keys()).toEqual(['0', '1']);
    expect(screen.getByText('1–2 of 6')).toBeInTheDocument();
    expect(grid()).toHaveAttribute('aria-rowcount', '9');
    await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(keys()).toEqual(['2', '3']);
    expect(screen.getByText('3–4 of 6')).toBeInTheDocument();
    const visibleRows = Array.from(
      grid().querySelectorAll('tbody tr[aria-rowindex]'),
    );
    expect(visibleRows.map((row) => row.getAttribute('aria-rowindex'))).toEqual(
      ['2', '5', '6', '7'],
    );
    await userEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(keys()).toEqual(['4', '5']);
    expect(captions().map((row) => row.textContent)).toEqual(['Other items']);
    expect(records().map((row) => row.getAttribute('aria-rowindex'))).toEqual([
      '8',
      '9',
    ]);
  });

  it.each(['page', 'filtered'] as const)(
    'select-all %s contains records and their source keys only',
    async (scope) => {
      const onSelectionChange = vi.fn();
      renderWithRoot(
        <ItemTable
          {...options}
          data={ROWS}
          getRowKey={(_, index) => `source-${index}`}
          selectionMode="multiple"
          selectAllMode={scope}
          onSelectionChange={onSelectionChange}
          defaultPageSize={2}
          pageSizeOptions={[2]}
        />,
      );
      expect(keys()).toEqual(['source-1', 'source-3']);
      await userEvent.click(
        screen.getByRole('checkbox', { name: 'Select all' }),
      );
      const [selectedKeys, selectedRows] = onSelectionChange.mock.calls.at(-1)!;
      expect(new Set(selectedKeys)).toEqual(
        new Set(
          scope === 'page'
            ? ['source-1', 'source-3']
            : ['source-0', 'source-1', 'source-2', 'source-3'],
        ),
      );
      expect(selectedRows).toHaveLength(scope === 'page' ? 2 : 4);
      expect(selectedRows.every((row: Row) => ROWS.includes(row))).toBe(true);
      for (const caption of captions()) {
        expect(caption).not.toHaveAttribute('data-key');
        expect(caption).not.toHaveAttribute('aria-selected');
        expect(caption.querySelector('input,button,a')).toBeNull();
        expect(caption.firstElementChild).toHaveAttribute('colspan', '2');
      }
    },
  );

  it('keeps selection and an uncontrolled cell when a record changes section', async () => {
    const columns: CubeItemTableColumn<Row>[] = [
      {
        ...COLUMNS[0],
        render: (_, row) => (
          <input aria-label={row.id} defaultValue={row.name} />
        ),
      },
    ];
    const render = (data: Row[]) => (
      <ItemTable
        {...options}
        data={data}
        columns={columns}
        selectionMode="multiple"
        paginationMode="off"
      />
    );
    const { rerender } = renderWithRoot(render(ROWS));
    await userEvent.click(
      screen.getAllByRole('checkbox', { name: 'Select row' })[0],
    );
    const input = screen.getByRole('textbox', { name: 'f1' });
    await userEvent.clear(input);
    await userEvent.type(input, 'draft');
    rerender(
      render(
        ROWS.map((row) =>
          row.id === 'f1' ? { ...row, favorite: false } : row,
        ),
      ),
    );
    expect(screen.getByRole('textbox', { name: 'f1' })).toBe(input);
    expect(input).toHaveValue('draft');
    expect(records().find((row) => row.dataset.key === 'f1')).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('keeps captions out of keyboard navigation, links and row actions', async () => {
    const onRowAction = vi.fn();
    renderWithRoot(
      <ItemTable
        {...options}
        data={ROWS}
        onRowAction={onRowAction}
        paginationMode="off"
      />,
    );
    const [first, second, third] = records();
    await userEvent.click(first);
    onRowAction.mockClear();
    act(() => first.focus());
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(third).toHaveFocus();
    expect(second).not.toHaveFocus();
    expect(onRowAction).toHaveBeenLastCalledWith(ROWS[0], 'o1');
    await userEvent.click(screen.getByText('Other items'));
    expect(onRowAction).toHaveBeenCalledTimes(1);
  });

  it('counts and measures presentation rows separately on the virtualized path', () => {
    const rows = Array.from({ length: 120 }, (_, i) => ({
      id: String(i),
      name: String(i),
      favorite: i < 4,
    }));
    renderWithRoot(
      <ItemTable {...options} data={rows} paginationMode="off" isVirtualized />,
    );
    expect(grid()).toHaveAttribute('aria-rowcount', '123');
    expect(captions().map((row) => row.dataset.index)).toEqual(['0', '5']);
    expect(records()[4]).toHaveAttribute('data-index', '6');
    expect(records()[4]).toHaveAttribute('data-row-index', '4');
    expect(records()[4]).toHaveAttribute('aria-rowindex', '8');
  });

  it('falls back without dropping records for unknown or duplicate section keys', () => {
    const { rerender } = renderWithRoot(
      <ItemTable
        {...options}
        data={ROWS}
        getSectionKey={() => 'unknown'}
        paginationMode="off"
      />,
    );
    expect(keys()).toEqual(ROWS.map((row) => row.id));
    expect(captions()).toHaveLength(0);
    rerender(
      <ItemTable
        {...options}
        data={ROWS}
        sections={[SECTIONS[0], SECTIONS[0]]}
        paginationMode="off"
      />,
    );
    expect(keys()).toEqual(ROWS.map((row) => row.id));
    expect(captions()).toHaveLength(0);
  });

  it('preserves server paging when section metadata cannot describe unseen records', () => {
    renderWithRoot(
      <ItemTable
        {...options}
        data={ROWS}
        paginationMode="server"
        page={2}
        pageSize={4}
        total={20}
      />,
    );
    expect(captions()).toHaveLength(0);
    expect(keys()).toEqual(ROWS.map((row) => row.id));
    expect(records()[0]).toHaveAttribute('aria-rowindex', '6');
    expect(grid()).toHaveAttribute('aria-rowcount', '21');
  });
});
