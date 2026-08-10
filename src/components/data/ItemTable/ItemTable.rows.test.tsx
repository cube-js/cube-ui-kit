import { fireEvent } from '@testing-library/react';

import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';
import { Menu } from '../../actions';

import { ItemTable } from './ItemTable';

import type { CubeItemTableColumn } from './types';

interface Row {
  id: string;
  name: string;
}

const COLUMNS: CubeItemTableColumn<Row>[] = [
  { key: 'name', title: 'Name', isRowHeader: true },
  { key: 'id', title: 'ID' },
];

const ROWS: Row[] = [
  { id: 'r0', name: 'row-0' },
  { id: 'r1', name: 'row-1' },
  { id: 'r2', name: 'row-2' },
];

const MENU = (
  <>
    <Menu.Item key="open">Open</Menu.Item>
    <Menu.Item key="delete">Delete</Menu.Item>
  </>
);

const rows = () =>
  Array.from(
    screen.getByRole('grid').querySelectorAll('tr[data-element="Row"]'),
  );
const links = () =>
  Array.from(
    screen.getByRole('grid').querySelectorAll('[data-element="RowLink"]'),
  );

describe('ItemTable rowLink', () => {
  it('renders a real anchor named after the row header', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        rowLink={(row) => `!https://example.com/${row.id}`}
      />,
    );

    expect(links()).toHaveLength(3);
    expect(links()[0].tagName).toBe('A');
    // A real href is what makes ⌘-click, middle-click and "Open in new tab"
    // work; an onClick handler cannot provide any of them.
    expect(links()[0]).toHaveAttribute('href', 'https://example.com/r0');
    expect(links()[0]).toHaveAttribute('aria-label', 'row-0');
  });

  it('lives in the row-header cell, not every cell', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        rowLink={(row) => `!https://example.com/${row.id}`}
      />,
    );

    expect(links()[0].closest('th')).not.toBeNull();
    expect(links()[0].closest('[data-key="name"]')).not.toBeNull();
  });

  it('marks the linked cell so it can be styled as a link', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        rowLink={(row) => `!https://example.com/${row.id}`}
      />,
    );

    const cells = screen.getByRole('grid').querySelectorAll('[data-link]');

    // The stretched anchor is invisible, so without this the row gives no sign
    // that it navigates.
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveAttribute('data-key', 'name');
    // Only the row-header cell carries it, not every cell in the row.
    expect(
      screen.getByRole('grid').querySelectorAll('[data-key="id"][data-link]'),
    ).toHaveLength(0);
  });

  it('skips a row that returns undefined', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        rowLink={(row) =>
          row.id === 'r1' ? undefined : `!https://example.com/${row.id}`
        }
      />,
    );

    expect(links()).toHaveLength(2);
  });
});

describe('ItemTable onRowAction', () => {
  it('fires on a click anywhere in the row', async () => {
    const onRowAction = vi.fn();

    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} onRowAction={onRowAction} />,
    );

    await userEvent.click(screen.getByText('row-1'));

    expect(onRowAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'r1' }),
      'r1',
    );
  });

  it('ignores a click that belongs to a control in the cell', async () => {
    const onRowAction = vi.fn();
    const onPress = vi.fn();

    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={[
          COLUMNS[0],
          {
            key: 'id',
            title: 'ID',
            render: () => (
              <button type="button" onClick={onPress}>
                Act
              </button>
            ),
          },
        ]}
        onRowAction={onRowAction}
      />,
    );

    await userEvent.click(screen.getAllByRole('button', { name: 'Act' })[0]);

    expect(onPress).toHaveBeenCalled();
    // The row must not also act on a click the button already handled.
    expect(onRowAction).not.toHaveBeenCalled();
  });

  it('fires on Enter', async () => {
    const onRowAction = vi.fn();

    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} onRowAction={onRowAction} />,
    );

    fireEvent.keyDown(screen.getByText('row-2'), { key: 'Enter' });

    expect(onRowAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'r2' }),
      'r2',
    );
  });

  it('marks actionable rows for styling', () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} onRowAction={() => {}} />,
    );

    expect(rows()[0]).toHaveAttribute('data-clickable');
  });
});

describe('ItemTable rowMenu', () => {
  it('renders no trigger column without rowContextMenu', () => {
    renderWithRoot(<ItemTable data={ROWS} columns={COLUMNS} rowMenu={MENU} />);

    // `rowMenu` alone is inert — exposing it is an explicit opt-in, so a row
    // never grows a `⋮` the consumer did not ask for.
    expect(
      screen.queryAllByRole('button', { name: 'Row actions' }),
    ).toHaveLength(0);
    expect(screen.getByRole('grid')).toHaveAttribute('aria-colcount', '2');
  });

  it('adds a trigger column with rowContextMenu', () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} rowMenu={MENU} rowContextMenu />,
    );

    expect(screen.getAllByRole('button', { name: 'Row actions' })).toHaveLength(
      3,
    );
    expect(screen.getByRole('grid')).toHaveAttribute('aria-colcount', '3');
  });

  it('keeps the column out with context-only', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        rowMenu={MENU}
        rowContextMenu="context-only"
      />,
    );

    expect(
      screen.queryAllByRole('button', { name: 'Row actions' }),
    ).toHaveLength(0);
    expect(screen.getByRole('grid')).toHaveAttribute('aria-colcount', '2');
  });

  it('gives a row with no items no trigger', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        rowContextMenu
        rowMenu={(row) => (row.id === 'r1' ? null : MENU)}
      />,
    );

    // An empty popover is worse than no trigger at all.
    expect(screen.getAllByRole('button', { name: 'Row actions' })).toHaveLength(
      2,
    );
  });

  it('opens on right-click with that row’s items', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        rowContextMenu="context-only"
        rowMenu={(row) => <Menu.Item key="open">Open {row.name}</Menu.Item>}
      />,
    );

    fireEvent.contextMenu(rows()[2]);

    await waitFor(() =>
      expect(
        screen.getByRole('menuitem', { name: 'Open row-2' }),
      ).toBeVisible(),
    );
  });

  it('reports the action key without React’s key prefix', async () => {
    const onRowMenuAction = vi.fn();

    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        rowContextMenu="context-only"
        rowMenu={MENU}
        onRowMenuAction={onRowMenuAction}
      />,
    );

    fireEvent.contextMenu(rows()[1]);
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Delete' }),
    );

    // `Children.toArray` prefixes keys with `.$`; the consumer wrote `delete`.
    await waitFor(() =>
      expect(onRowMenuAction).toHaveBeenCalledWith(
        'delete',
        expect.objectContaining({ id: 'r1' }),
        'r1',
      ),
    );
  });

  it('opens on Shift+F10', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        rowContextMenu="context-only"
        rowMenu={(row) => <Menu.Item key="open">Open {row.name}</Menu.Item>}
      />,
    );

    fireEvent.keyDown(screen.getByText('row-0'), {
      key: 'F10',
      shiftKey: true,
    });

    // The only way to reach the menu from the keyboard when there is no
    // trigger column.
    await waitFor(() =>
      expect(
        screen.getByRole('menuitem', { name: 'Open row-0' }),
      ).toBeVisible(),
    );
  });

  it('falls through to the native menu when a row has no items', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        rowContextMenu="context-only"
        rowMenu={() => null}
      />,
    );

    const event = fireEvent.contextMenu(rows()[0]);

    // Not prevented, so the browser's own context menu still appears.
    expect(event).toBe(true);
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
