import { useState } from 'react';

import {
  act,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
  within,
} from '../../../test';
import { Menu } from '../../actions/Menu/Menu';

import { ItemTable } from './ItemTable';

import type { CubeItemTableColumn, CubeItemTableProps } from './types';

interface Row {
  id: string;
  name: string;
}
const ROWS: Row[] = Array.from({ length: 4 }, (_, index) => ({
  id: `r${index}`,
  name: `Row ${index}`,
}));
const COLUMNS: CubeItemTableColumn<Row>[] = [{ key: 'name', title: 'Name' }];
const row = (key: string) =>
  screen
    .getByRole('grid')
    .querySelector<HTMLTableRowElement>(`tbody tr[data-key="${key}"]`)!;
const MENU = <Menu.Item key="open">Open details</Menu.Item>;

function Fixture(props: Partial<CubeItemTableProps<Row>>) {
  return (
    <>
      <button type="button">Before</button>
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        paginationMode="off"
        {...props}
      />
      <button type="button">After</button>
    </>
  );
}

describe('ItemTable flat row keyboard interaction', () => {
  it('enters actionable rows with Tab and traverses enabled logical rows', async () => {
    renderWithRoot(<Fixture onRowAction={() => {}} disabledKeys={['r1']} />);
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
    await userEvent.tab();
    expect(row('r0')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(row('r2')).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(row('r3')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(row('r0')).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('enters the body from a sortable header without sorting it', async () => {
    const onSortChange = vi.fn();
    renderWithRoot(
      <Fixture
        onRowAction={() => {}}
        columns={[{ ...COLUMNS[0], isSortable: true }]}
        onSortChange={onSortChange}
      />,
    );
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('columnheader')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(row('r0')).toHaveFocus();
    expect(onSortChange).not.toHaveBeenCalled();
  });

  it('activates the latest row action and leaves in-cell keys with their control', async () => {
    const previous = vi.fn();
    const latest = vi.fn();
    const buttonAction = vi.fn();
    const columns: CubeItemTableColumn<Row>[] = [
      ...COLUMNS,
      {
        key: 'edit',
        title: 'Edit',
        render: () => (
          <>
            <input aria-label="Draft" />
            <button type="button" onClick={buttonAction}>
              Edit
            </button>
          </>
        ),
      },
    ];
    const { rerender } = renderWithRoot(
      <Fixture onRowAction={previous} columns={columns} />,
    );
    await act(() => row('r0').focus());
    rerender(<Fixture onRowAction={latest} columns={columns} />);
    await userEvent.keyboard('{Enter}');
    expect(latest).toHaveBeenCalledWith(ROWS[0], 'r0');
    expect(previous).not.toHaveBeenCalled();
    const input = within(row('r0')).getByRole('textbox');
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowDown}{Home}{Enter}');
    expect(input).toHaveFocus();
    expect(latest).toHaveBeenCalledTimes(1);
    await userEvent.click(
      within(row('r0')).getByRole('button', { name: 'Edit' }),
    );
    await userEvent.keyboard('{Enter}');
    expect(buttonAction).toHaveBeenCalledTimes(2);
    expect(latest).toHaveBeenCalledTimes(1);
  });

  it('keeps the header focused when a server-sort response replaces the previous row', async () => {
    const columns: CubeItemTableColumn<Row>[] = [
      { ...COLUMNS[0], isSortable: true },
    ];
    const onSortChange = vi.fn();
    const table = (data: Row[]) => (
      <Fixture
        data={data}
        columns={columns}
        sortMode="server"
        onSortChange={onSortChange}
        onRowAction={() => {}}
      />
    );
    const { rerender } = renderWithRoot(table(ROWS));
    await userEvent.tab();
    await userEvent.tab();
    const header = screen.getByRole('columnheader');
    await userEvent.keyboard('{ArrowDown}');
    expect(row('r0')).toHaveFocus();
    await userEvent.click(header);
    expect(header).toHaveFocus();
    expect(onSortChange).toHaveBeenCalledTimes(1);
    rerender(table(ROWS.slice(1)));
    expect(header).toHaveFocus();
  });

  it('retains an uncontrolled cell and its focus when the same row link becomes inert and returns', async () => {
    const columns: CubeItemTableColumn<Row>[] = [
      ...COLUMNS,
      {
        key: 'draft',
        title: 'Draft',
        render: () => <input aria-label="Draft" defaultValue="Saved" />,
      },
    ];
    const link = (enabled: boolean) => (item: Row) =>
      enabled ? `/records/${item.id}` : undefined;
    const { rerender } = renderWithRoot(
      <Fixture columns={columns} rowLink={link(true)} />,
    );
    const input = within(row('r0')).getByRole('textbox');
    await userEvent.type(input, ' draft');
    for (const enabled of [false, true]) {
      rerender(<Fixture columns={columns} rowLink={link(enabled)} />);
      expect(within(row('r0')).getByRole('textbox')).toBe(input);
      expect(input).toHaveValue('Saved draft');
      expect(input).toHaveFocus();
    }
  });

  it('keeps unselectable rows interactive while hard-disabled rows remain inert', async () => {
    const onRowAction = vi.fn();
    renderWithRoot(
      <Fixture
        onRowAction={onRowAction}
        selectionMode="multiple"
        isRowSelectable={(item) => item.id !== 'r1'}
        disabledKeys={['r2']}
      />,
    );
    await act(() => row('r0').focus());
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(row('r1')).toHaveFocus();
    expect(onRowAction).toHaveBeenCalledWith(ROWS[1], 'r1');
    await userEvent.keyboard('{ArrowDown}');
    expect(row('r3')).toHaveFocus();
    await userEvent.click(within(row('r2')).getByText('Row 2'));
    expect(onRowAction).toHaveBeenCalledTimes(1);
    expect(row('r2').tabIndex).toBe(-1);
  });

  it('keeps focus by key when rows move and chooses a neighbor when that row disappears', async () => {
    const action = () => {};
    const { rerender } = renderWithRoot(<Fixture onRowAction={action} />);
    await act(() => row('r1').focus());
    rerender(
      <Fixture
        onRowAction={action}
        data={[ROWS[3], ROWS[0], ROWS[1], ROWS[2]]}
      />,
    );
    expect(row('r1')).toHaveFocus();
    expect(row('r1').tabIndex).toBe(0);
    rerender(
      <Fixture onRowAction={action} data={[ROWS[3], ROWS[0], ROWS[2]]} />,
    );
    await waitFor(() => expect(row('r2')).toHaveFocus());
    expect(row('r2').tabIndex).toBe(0);
  });

  it('repairs the page tab stop without taking focus from a paging or outside control', async () => {
    const action = () => {};
    const { rerender } = renderWithRoot(<Fixture onRowAction={action} />);
    await act(() => row('r3').focus());
    await userEvent.click(screen.getByRole('button', { name: 'After' }));
    rerender(<Fixture onRowAction={action} data={ROWS.slice(0, 2)} />);
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    expect(
      [row('r0'), row('r1')].filter((element) => element.tabIndex === 0),
    ).toHaveLength(1);
    await userEvent.tab({ shift: true });
    expect(row('r1')).toHaveFocus();
  });

  it('leaves an inert table outside the Tab order', async () => {
    renderWithRoot(<Fixture />);
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('skips rows whose link and menu resolvers expose no row interaction', async () => {
    renderWithRoot(
      <Fixture
        rowLink={(item) => (item.id === 'r1' ? '/records/r1' : undefined)}
        rowContextMenu
        rowMenu={(item) => (item.id === 'r3' ? MENU : null)}
      />,
    );
    await userEvent.tab();
    await userEvent.tab();
    expect(row('r1')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(row('r3')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(row('r1')).toHaveFocus();
  });

  it('reaches the resting row menu trigger with Tab and restores it on Escape', async () => {
    renderWithRoot(<Fixture rowMenu={MENU} rowContextMenu />);
    await userEvent.tab();
    await userEvent.tab();
    expect(row('r0')).toHaveFocus();
    await userEvent.tab();
    const trigger = within(row('r0')).getByRole('button', {
      name: 'Row actions',
    });
    expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('menuitem', { name: 'Open details' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('opens the row context menu from the keyboard and restores its row', async () => {
    renderWithRoot(<Fixture rowMenu={MENU} rowContextMenu="context-only" />);
    await userEvent.tab();
    await userEvent.tab();
    expect(row('r0')).toHaveFocus();
    await userEvent.keyboard('{Shift>}{F10}{/Shift}');
    await screen.findByRole('menuitem', { name: 'Open details' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(row('r0')).toHaveFocus());
    await userEvent.keyboard('{Shift>}{F10}{/Shift}');
    await waitFor(() =>
      expect(
        screen.getByRole('menuitem', { name: 'Open details' }),
      ).toHaveFocus(),
    );
  });

  it('uses the latest callback and record while a context menu is already open', async () => {
    const previous = vi.fn();
    const latest = vi.fn();
    const { rerender } = renderWithRoot(
      <Fixture
        rowMenu={MENU}
        rowContextMenu="context-only"
        onRowMenuAction={previous}
      />,
    );
    await act(() => row('r0').focus());
    await userEvent.keyboard('{Shift>}{F10}{/Shift}');
    await screen.findByRole('menuitem', { name: 'Open details' });
    const updated = { ...ROWS[0], name: 'Updated row' };
    rerender(
      <Fixture
        data={[updated, ...ROWS.slice(1)]}
        rowMenu={MENU}
        rowContextMenu="context-only"
        onRowMenuAction={latest}
      />,
    );
    await userEvent.keyboard('{Enter}');
    expect(latest).toHaveBeenCalledWith('open', updated, 'r0');
    expect(previous).not.toHaveBeenCalled();
  });

  it('respects focus handed to another control by a closing menu action', async () => {
    renderWithRoot(
      <Fixture
        rowMenu={MENU}
        rowContextMenu="context-only"
        onRowMenuAction={() =>
          screen.getByRole('button', { name: 'After' }).focus()
        }
      />,
    );
    await act(() => row('r0').focus());
    await userEvent.keyboard('{Shift>}{F10}{/Shift}');
    await screen.findByRole('menuitem', { name: 'Open details' });
    await userEvent.keyboard('{Enter}');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus(),
    );
  });

  it.each([true, 'context-only'] as const)(
    'restores a surviving neighbor after a %s menu action removes its row',
    async (rowContextMenu) => {
      function Removable() {
        const [data, setData] = useState(ROWS);
        return (
          <Fixture
            data={data}
            rowContextMenu={rowContextMenu}
            rowMenu={<Menu.Item key="delete">Delete row</Menu.Item>}
            onRowMenuAction={(_, item) =>
              setData((current) =>
                current.filter((candidate) => candidate.id !== item.id),
              )
            }
          />
        );
      }
      renderWithRoot(<Removable />);
      await act(() => row('r1').focus());
      await userEvent.keyboard('{Shift>}{F10}{/Shift}');
      await userEvent.click(
        await screen.findByRole('menuitem', { name: 'Delete row' }),
      );
      await waitFor(() => expect(row('r2')).toHaveFocus());
    },
  );
});

describe('ItemTable implicit row header', () => {
  it('uses the first data column for row links even with a structural selection column', () => {
    renderWithRoot(
      <Fixture
        rowLink={(item) => `/records/${item.id}`}
        selectionMode="multiple"
      />,
    );
    expect(within(row('r0')).getByRole('rowheader')).toHaveTextContent('Row 0');
    expect(
      within(row('r0')).getByRole('link', { name: 'Row 0' }),
    ).toHaveAttribute('href', '/records/r0');
  });

  it('keeps an explicit later row header and leaves the supplied columns unchanged', () => {
    const columns: CubeItemTableColumn<Row>[] = [
      { key: 'id', title: 'ID' },
      { ...COLUMNS[0], isRowHeader: true },
    ];
    renderWithRoot(
      <Fixture rowLink={(item) => `/records/${item.id}`} columns={columns} />,
    );
    expect(within(row('r0')).getAllByRole('rowheader')).toHaveLength(1);
    expect(within(row('r0')).getByRole('rowheader')).toHaveAttribute(
      'data-key',
      'name',
    );
    expect(columns[0].isRowHeader).toBeUndefined();
  });

  it('excludes an explicitly false first column from the implicit default', () => {
    const columns = [
      { key: 'id', title: 'ID', isRowHeader: false },
      COLUMNS[0],
    ];
    renderWithRoot(
      <Fixture columns={columns} rowLink={(item) => `/records/${item.id}`} />,
    );
    expect(within(row('r0')).getByRole('rowheader')).toHaveAttribute(
      'data-key',
      'name',
    );
    expect(columns[0].isRowHeader).toBe(false);
  });

  it('chooses a visible header when the explicit header is hidden', () => {
    renderWithRoot(
      <Fixture
        columns={[
          { key: 'id', title: 'ID', isHidden: true, isRowHeader: true },
          COLUMNS[0],
        ]}
        rowLink={(item) => `/records/${item.id}`}
      />,
    );
    expect(within(row('r0')).getByRole('rowheader')).toHaveAttribute(
      'data-key',
      'name',
    );
    expect(
      within(row('r0')).getByRole('link', { name: 'Row 0' }),
    ).toHaveAttribute('href', '/records/r0');
  });

  it.each<{ columns: CubeItemTableColumn<Row>[] }>([
    { columns: [] },
    { columns: [{ ...COLUMNS[0], isRowHeader: false }] },
  ])(
    'renders no orphan row link when no data column is eligible (%j)',
    ({ columns }) => {
      renderWithRoot(
        <Fixture
          columns={columns}
          selectionMode="multiple"
          rowLink={(item) => `/records/${item.id}`}
        />,
      );
      expect(within(row('r0')).queryByRole('rowheader')).toBeNull();
      expect(within(row('r0')).queryByRole('link')).toBeNull();
      expect(
        row('r0').querySelectorAll('a, [data-element="NativeLink"]'),
      ).toHaveLength(0);
      expect(row('r0')).not.toHaveAttribute('tabindex', '0');
    },
  );
});
