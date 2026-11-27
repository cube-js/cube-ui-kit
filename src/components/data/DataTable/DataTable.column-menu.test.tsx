import { fireEvent, renderWithRoot, screen, userEvent } from '../../../test';
import { Menu } from '../../actions/Menu';
import { columnSortMenu } from '../TableBase/column-menu';

import { DataTable } from './DataTable';

import type { ReactNode } from 'react';
import type { CubeTableSort } from '../TableBase/types';
import type { CubeDataTableColumn } from './types';

interface Row {
  id: string;
  region: string;
  orders: number;
}

const ROWS: Row[] = [
  { id: 'r0', region: 'eu-west-1', orders: 30 },
  { id: 'r1', region: 'us-east-1', orders: 10 },
];

const MENU = (
  <>
    <Menu.Item key="pin">Pin column</Menu.Item>
    <Menu.Item key="hide">Hide column</Menu.Item>
  </>
);

/** `region` carries the menu; `orders` never does, so the two are separable. */
function columns(
  menu: ReactNode = MENU,
  extra: Partial<CubeDataTableColumn<Row>> = {},
): CubeDataTableColumn<Row>[] {
  return [
    {
      key: 'region',
      title: 'Region',
      isSortable: true,
      header: { menu },
      ...extra,
    },
    { key: 'orders', title: 'Orders', dataType: 'number', isSortable: true },
  ];
}

const grid = () => screen.getByRole('grid');
const header = (key: string) =>
  grid().querySelector(`thead [data-key="${key}"]`) as HTMLElement;
const triggers = () => screen.queryAllByRole('button', { name: 'Column menu' });

describe('DataTable column menu', () => {
  it('renders a trigger only on the column that has a menu', () => {
    renderWithRoot(<DataTable data={ROWS} columns={columns()} />);

    expect(triggers()).toHaveLength(1);
    expect(header('region')).toHaveAttribute('aria-haspopup', 'menu');
    expect(header('orders')).not.toHaveAttribute('aria-haspopup');
  });

  it('renders no trigger for an absent, null or empty menu', () => {
    const { unmount } = renderWithRoot(
      <DataTable data={ROWS} columns={columns(null)} />,
    );

    expect(triggers()).toHaveLength(0);
    unmount();

    // An empty fragment is the shape a consumer's own conditional produces, and
    // an empty popover is worse than no trigger at all.
    renderWithRoot(<DataTable data={ROWS} columns={columns(<></>)} />);

    expect(triggers()).toHaveLength(0);
  });

  it('suppresses the menu entirely with columnContextMenu={false}', () => {
    renderWithRoot(
      <DataTable data={ROWS} columns={columns()} columnContextMenu={false} />,
    );

    expect(triggers()).toHaveLength(0);
    expect(header('region')).not.toHaveAttribute('aria-haspopup');
  });

  it('drops the trigger but keeps right-click with context-only', async () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={columns()}
        columnContextMenu="context-only"
      />,
    );

    expect(triggers()).toHaveLength(0);

    fireEvent.contextMenu(header('region'));

    await screen.findByRole('menuitem', { name: 'Pin column' });
  });

  it('gives a non-sortable column with a menu a tab stop', () => {
    renderWithRoot(
      <DataTable data={ROWS} columns={columns(MENU, { isSortable: false })} />,
    );

    // Shift+F10 has to have somewhere to land, and the trigger is not a tab stop.
    expect(header('region')).toHaveAttribute('tabindex', '0');
  });

  /* ── the whole point: the trigger must never sort ─────────────────────── */

  it('does not sort when the trigger is pressed', async () => {
    const onSortsChange = vi.fn();

    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={columns()}
        onSortsChange={onSortsChange}
      />,
    );

    await userEvent.click(triggers()[0]);

    await screen.findByRole('menuitem', { name: 'Pin column' });
    // `Item`'s Actions slot stops click/pointer/Enter/Space propagation — this
    // is the guarantee `src/components/data/AGENTS.md` promises and the reason
    // the header `Item` sits inside the `<th>` rather than being it.
    expect(onSortsChange).not.toHaveBeenCalled();
    expect(header('region')).not.toHaveAttribute('aria-sort');
  });

  it.each(['{Enter}', ' '])(
    'does not sort when the trigger is activated with %s',
    async (key) => {
      const onSortsChange = vi.fn();

      renderWithRoot(
        <DataTable
          data={ROWS}
          columns={columns()}
          onSortsChange={onSortsChange}
        />,
      );

      triggers()[0].focus();
      await userEvent.keyboard(key);

      expect(onSortsChange).not.toHaveBeenCalled();
      expect(header('region')).not.toHaveAttribute('aria-sort');
    },
  );

  it('still sorts on a click and on Enter in the header itself', async () => {
    const onSortsChange = vi.fn();

    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={columns()}
        onSortsChange={onSortsChange}
      />,
    );

    await userEvent.click(header('region'));

    expect(onSortsChange).toHaveBeenCalledWith([
      { columnKey: 'region', direction: 'asc' },
    ]);
  });

  /* ── dispatch ─────────────────────────────────────────────────────────── */

  it('reports the key as written, column-level handler first', async () => {
    const calls: string[] = [];
    const onColumnMenuAction = vi.fn(() => calls.push('table'));
    const onMenuAction = vi.fn(() => calls.push('column'));

    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={[
          {
            key: 'region',
            title: 'Region',
            isSortable: true,
            header: { menu: MENU, onMenuAction },
          },
        ]}
        onColumnMenuAction={onColumnMenuAction}
      />,
    );

    await userEvent.click(triggers()[0]);
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Pin column' }),
    );

    // No `.$` prefix — React adds one when children pass through
    // `Children.toArray`, and the consumer wrote `key="pin"`.
    expect(onMenuAction).toHaveBeenCalledWith('pin');
    expect(onColumnMenuAction).toHaveBeenCalledWith('pin', 'region');
    expect(calls).toEqual(['column', 'table']);
  });

  it('opens on Shift+F10 from the header cell', async () => {
    renderWithRoot(<DataTable data={ROWS} columns={columns()} />);

    header('region').focus();
    await userEvent.keyboard('{Shift>}{F10}{/Shift}');

    await screen.findByRole('menuitem', { name: 'Pin column' });
  });

  it('coexists with header.actions, custom actions first', () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={columns(MENU, {
          header: {
            menu: MENU,
            actions: <button type="button">Info</button>,
          },
        })}
      />,
    );

    const actions = header('region').querySelector(
      '[data-element="Actions"]',
    ) as HTMLElement;
    const buttons = Array.from(actions.querySelectorAll('button'));

    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('Info');
    expect(buttons[1]).toHaveAttribute('aria-label', 'Column menu');
  });

  it('drops the menu when header.render takes the cell over', () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={columns(MENU, {
          header: { menu: MENU, render: () => <span>Custom</span> },
        })}
      />,
    );

    // A takeover owns the whole cell, so it owns the trigger too.
    expect(triggers()).toHaveLength(0);
    expect(header('region')).toHaveTextContent('Custom');
  });

  /* ── reserved sort keys ───────────────────────────────────────────────── */

  const SORT_MENU = (
    <>
      {columnSortMenu()}
      <Menu.Item key="pin">Pin column</Menu.Item>
    </>
  );

  const sortColumns: CubeDataTableColumn<Row>[] = [
    {
      key: 'region',
      title: 'Region',
      isSortable: true,
      header: { menu: SORT_MENU },
    },
    { key: 'orders', title: 'Orders', dataType: 'number', isSortable: true },
  ];

  it('labels the reserved sort keys', async () => {
    renderWithRoot(<DataTable data={ROWS} columns={sortColumns} />);

    await userEvent.click(triggers()[0]);

    // Written as `<Menu.Item key="sort-asc" />` with no children at all.
    await screen.findByRole('menuitem', { name: 'Sort ascending' });
    screen.getByRole('menuitem', { name: 'Sort descending' });
    screen.getByRole('menuitem', { name: 'Clear sort' });
  });

  it('keeps a label the consumer wrote', async () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={columns(<Menu.Item key="sort-asc">Oldest first</Menu.Item>)}
      />,
    );

    await userEvent.click(triggers()[0]);

    await screen.findByRole('menuitem', { name: 'Oldest first' });
  });

  it('reaches desc in one step, without disturbing the precedence', async () => {
    const onSortsChange = vi.fn();

    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={sortColumns}
        sorts={[{ columnKey: 'orders', direction: 'asc' }]}
        onSortsChange={onSortsChange}
      />,
    );

    await userEvent.click(triggers()[0]);
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Sort descending' }),
    );

    // One call, landing on `desc` directly. Toggling twice to get here would
    // have emitted `asc` first, and `orders` keeps its leading precedence.
    expect(onSortsChange).toHaveBeenCalledTimes(1);
    expect(onSortsChange).toHaveBeenCalledWith([
      { columnKey: 'orders', direction: 'asc' },
      { columnKey: 'region', direction: 'desc' },
    ]);
  });

  it('clears just that column', async () => {
    const onSortsChange = vi.fn();

    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={sortColumns}
        sorts={[
          { columnKey: 'orders', direction: 'asc' },
          { columnKey: 'region', direction: 'desc' },
        ]}
        onSortsChange={onSortsChange}
      />,
    );

    await userEvent.click(triggers()[0]);
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Clear sort' }),
    );

    expect(onSortsChange).toHaveBeenCalledWith([
      { columnKey: 'orders', direction: 'asc' },
    ]);
  });

  it('disables the reserved key that would do nothing', async () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={sortColumns}
        sorts={[{ columnKey: 'region', direction: 'asc' }]}
      />,
    );

    await userEvent.click(triggers()[0]);

    // Redundancy is shown by disabling rather than by ticking the active one:
    // a tick means `isSelected`, which `MenuItem` only honours when the whole
    // `Menu` runs at `selectionMode !== 'none'` — which would turn the
    // consumer's own items into radios too.
    expect(
      await screen.findByRole('menuitem', { name: 'Sort ascending' }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getByRole('menuitem', { name: 'Sort descending' }),
    ).not.toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getByRole('menuitem', { name: 'Clear sort' }),
    ).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('disables clear-sort while the column is unsorted', async () => {
    renderWithRoot(<DataTable data={ROWS} columns={sortColumns} sorts={[]} />);

    await userEvent.click(triggers()[0]);

    expect(
      await screen.findByRole('menuitem', { name: 'Clear sort' }),
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('disables every sort key on a non-sortable column', async () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={[
          {
            key: 'region',
            title: 'Region',
            isSortable: false,
            header: { menu: SORT_MENU },
          },
          { key: 'orders', title: 'Orders', isSortable: true },
        ]}
      />,
    );

    await userEvent.click(triggers()[0]);

    for (const name of ['Sort ascending', 'Sort descending', 'Clear sort']) {
      expect(await screen.findByRole('menuitem', { name })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    }
    // A consumer key is untouched — the column is still theirs to act on.
    expect(
      screen.getByRole('menuitem', { name: 'Pin column' }),
    ).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('refuses to clear a column with disallowSortRemoval', async () => {
    const onSortsChange = vi.fn();
    const sorts: CubeTableSort[] = [{ columnKey: 'region', direction: 'asc' }];

    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={[
          {
            key: 'region',
            title: 'Region',
            isSortable: true,
            disallowSortRemoval: true,
            header: { menu: SORT_MENU },
          },
        ]}
        sorts={sorts}
        onSortsChange={onSortsChange}
      />,
    );

    await userEvent.click(triggers()[0]);

    // The column is never *left* unsorted, so the item is disabled rather than
    // silently re-sorting.
    expect(
      await screen.findByRole('menuitem', { name: 'Clear sort' }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(onSortsChange).not.toHaveBeenCalled();
  });

  it('resolves a reserved key inside a Menu.Section', async () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={columns(
          <Menu.Section title="Sorting">
            {columnSortMenu(['sort-asc'])}
          </Menu.Section>,
        )}
      />,
    );

    await userEvent.click(triggers()[0]);

    await screen.findByRole('menuitem', { name: 'Sort ascending' });
  });

  it('reports a reserved key to the consumer as well', async () => {
    const onColumnMenuAction = vi.fn();

    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={sortColumns}
        onColumnMenuAction={onColumnMenuAction}
      />,
    );

    await userEvent.click(triggers()[0]);
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Sort ascending' }),
    );

    // Understood here AND observed there — a consumer syncing sort to a URL
    // needs to hear about it.
    expect(onColumnMenuAction).toHaveBeenCalledWith('sort-asc', 'region');
  });
});
