import { renderWithRoot, screen } from '../../../test';
import { touchHold, useTouchEmulation } from '../../../test/touch';
import { Menu } from '../../actions/Menu/Menu';

import { ItemTable } from './ItemTable';

import type { CubeItemTableColumn } from './types';

/**
 * iOS fires no `contextmenu` on a long press, and Chromium's touch emulation
 * fires none either, so these specs see only the one the table fires itself.
 */

interface Row {
  id: string;
  name: string;
}

const ROWS: Row[] = [
  { id: 'r0', name: 'Record 0' },
  { id: 'r1', name: 'Record 1' },
];
const COLUMNS: CubeItemTableColumn<Row>[] = [
  {
    key: 'name',
    title: 'Name',
    isRowHeader: true,
    width: 240,
    isSortable: true,
    header: { menu: <Menu.Item key="pin">Pin</Menu.Item> },
  },
];

const row = (key: string) =>
  screen
    .getByRole('grid')
    .querySelector<HTMLTableRowElement>(
      `tbody tr[data-element="Row"][data-key="${key}"]`,
    )!;

function pointIn(element: Element) {
  const rect = element.getBoundingClientRect();

  return { x: rect.left + 40, y: rect.top + rect.height / 2 };
}

async function expectMenuAt(point: { x: number; y: number }) {
  const menu = await screen.findByRole('menu', {}, { timeout: 2000 });

  await vi.waitFor(() => {
    const rect = screen.getByTestId('Popover').getBoundingClientRect();

    expect(Math.abs(rect.left - point.x)).toBeLessThan(2);
    expect(Math.abs(rect.top - point.y)).toBeLessThan(2);
  });

  return menu;
}

describe('ItemTable on a touch screen', () => {
  useTouchEmulation();

  it('opens a row’s menu at the touch point on a long press, without its action', async () => {
    const onRowAction = vi.fn();

    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        paginationMode="off"
        rowMenu={<Menu.Item key="open">Open</Menu.Item>}
        rowContextMenu
        onRowAction={onRowAction}
      />,
    );
    const point = pointIn(row('r1'));

    await touchHold(point, 700);

    const menu = await expectMenuAt(point);

    expect(menu).toHaveTextContent('Open');
    // Chromium still sends a click after the lift; the long press swallows it.
    expect(onRowAction).not.toHaveBeenCalled();
  });

  it('opens a column’s menu on a long press on its header, without sorting', async () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} paginationMode="off" />,
    );
    const header = screen.getByRole('columnheader', { name: /Name/ });
    const point = pointIn(header);

    await touchHold(point, 700);

    const menu = await expectMenuAt(point);

    expect(menu).toHaveTextContent('Pin');
    expect(header).not.toHaveAttribute('aria-sort', 'ascending');
    expect(header).not.toHaveAttribute('aria-sort', 'descending');
  });

  it('leaves a row without a menu to its own press', async () => {
    const onRowAction = vi.fn();

    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        paginationMode="off"
        onRowAction={onRowAction}
      />,
    );

    await touchHold(pointIn(row('r1')), 700);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    // The click Chromium sends after the lift still reaches the row.
    await vi.waitFor(() =>
      expect(onRowAction).toHaveBeenCalledExactlyOnceWith(ROWS[1], 'r1'),
    );
  });
});
