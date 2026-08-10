import {
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
  within,
} from '../../../test';

import { ItemTable } from './ItemTable';

import type { Key } from '@react-types/shared';
import type { CubeItemTableColumn } from './types';

interface Row {
  id: string;
  name: string;
  status: 'running' | 'failed';
}

const COLUMNS: CubeItemTableColumn<Row>[] = [
  { key: 'name', title: 'Name', isRowHeader: true, isSortable: true },
  { key: 'status', title: 'Status' },
];

const ROWS: Row[] = Array.from({ length: 8 }, (_, i) => ({
  id: `r${i}`,
  name: `row-${i}`,
  status: i % 4 === 3 ? 'failed' : 'running',
}));

const grid = () => screen.getByRole('grid');
const headerBox = () =>
  within(grid()).getAllByRole('checkbox')[0] as HTMLInputElement;
const rowBoxes = () =>
  Array.from(
    grid().querySelectorAll('tbody input[type=checkbox]'),
  ) as HTMLInputElement[];
const selectedKeys = () =>
  Array.from(grid().querySelectorAll('tr[data-selected]')).map((row) =>
    row.getAttribute('data-key'),
  );

/**
 * Shift held across the click, which is what the selection cell captures.
 *
 * `userEvent.setup()` is required: the direct `userEvent.click` API starts a
 * fresh session per call, so a modifier held by an earlier `userEvent.keyboard`
 * is already released by the time the click is dispatched.
 */
async function shiftClick(element: Element) {
  const user = userEvent.setup();

  await user.keyboard('{Shift>}');
  await user.click(element);
  await user.keyboard('{/Shift}');
}

describe('ItemTable selection', () => {
  it('adds no checkbox column by default', () => {
    renderWithRoot(<ItemTable data={ROWS} columns={COLUMNS} />);

    expect(within(grid()).queryAllByRole('checkbox')).toHaveLength(0);
    expect(grid()).not.toHaveAttribute('aria-multiselectable');
  });

  it('adds a checkbox column and marks the grid multi-selectable', () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} selectionMode="multiple" />,
    );

    expect(rowBoxes()).toHaveLength(8);
    expect(grid()).toHaveAttribute('aria-multiselectable', 'true');
    // The column counts toward the ARIA grid geometry like any other.
    expect(grid()).toHaveAttribute('aria-colcount', '3');
  });

  it('omits the header checkbox in single mode', () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} selectionMode="single" />,
    );

    expect(grid().querySelectorAll('thead input[type=checkbox]')).toHaveLength(
      0,
    );
    expect(grid()).not.toHaveAttribute('aria-multiselectable');
  });

  it('replaces the selection in single mode', async () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} selectionMode="single" />,
    );

    await userEvent.click(rowBoxes()[0]);
    await waitFor(() => expect(selectedKeys()).toEqual(['r0']));

    await userEvent.click(rowBoxes()[3]);

    await waitFor(() => expect(selectedKeys()).toEqual(['r3']));
  });

  it('reports keys and the matching rows', async () => {
    const onSelectionChange = vi.fn();

    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
      />,
    );

    await userEvent.click(rowBoxes()[2]);

    await waitFor(() =>
      expect(onSelectionChange).toHaveBeenCalledWith(
        ['r2'],
        [expect.objectContaining({ id: 'r2' })],
      ),
    );
  });

  it('marks rows with aria-selected only when selectable', async () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} selectionMode="multiple" />,
    );

    await userEvent.click(rowBoxes()[0]);

    await waitFor(() =>
      expect(grid().querySelector('tr[data-key="r0"]')).toHaveAttribute(
        'aria-selected',
        'true',
      ),
    );
    expect(grid().querySelector('tr[data-key="r1"]')).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  describe('shift-range', () => {
    it('extends from the last plainly-clicked row', async () => {
      renderWithRoot(
        <ItemTable data={ROWS} columns={COLUMNS} selectionMode="multiple" />,
      );

      await userEvent.click(rowBoxes()[1]);
      await shiftClick(rowBoxes()[4]);

      await waitFor(() =>
        expect(selectedKeys()).toEqual(['r1', 'r2', 'r3', 'r4']),
      );
    });

    it('shrinks when the range is drawn back toward the anchor', async () => {
      renderWithRoot(
        <ItemTable data={ROWS} columns={COLUMNS} selectionMode="multiple" />,
      );

      await userEvent.click(rowBoxes()[1]);
      await shiftClick(rowBoxes()[5]);
      await waitFor(() => expect(selectedKeys()).toHaveLength(5));

      await shiftClick(rowBoxes()[2]);

      // The overshoot must not stay selected — that is the whole difference
      // between extending a range and adding one.
      await waitFor(() => expect(selectedKeys()).toEqual(['r1', 'r2']));
    });

    it('extends upward too', async () => {
      renderWithRoot(
        <ItemTable data={ROWS} columns={COLUMNS} selectionMode="multiple" />,
      );

      await userEvent.click(rowBoxes()[5]);
      await shiftClick(rowBoxes()[3]);

      await waitFor(() => expect(selectedKeys()).toEqual(['r3', 'r4', 'r5']));
    });

    it('falls back to a plain toggle with no anchor', async () => {
      renderWithRoot(
        <ItemTable data={ROWS} columns={COLUMNS} selectionMode="multiple" />,
      );

      await shiftClick(rowBoxes()[3]);

      await waitFor(() => expect(selectedKeys()).toEqual(['r3']));
    });

    it('skips rows that cannot be selected', async () => {
      renderWithRoot(
        <ItemTable
          data={ROWS}
          columns={COLUMNS}
          selectionMode="multiple"
          isRowSelectable={(row) => row.status !== 'failed'}
        />,
      );

      await userEvent.click(rowBoxes()[1]);
      await shiftClick(rowBoxes()[4]);

      // r3 is `failed`, so the range passes over it.
      await waitFor(() => expect(selectedKeys()).toEqual(['r1', 'r2', 'r4']));
    });
  });

  describe('select all', () => {
    it('covers the page, and clears on a second press', async () => {
      renderWithRoot(
        <ItemTable data={ROWS} columns={COLUMNS} selectionMode="multiple" />,
      );

      await userEvent.click(headerBox());
      await waitFor(() => expect(selectedKeys()).toHaveLength(8));

      await userEvent.click(headerBox());
      await waitFor(() => expect(selectedKeys()).toHaveLength(0));
    });

    it('goes indeterminate for a partial selection', async () => {
      renderWithRoot(
        <ItemTable data={ROWS} columns={COLUMNS} selectionMode="multiple" />,
      );

      await userEvent.click(rowBoxes()[0]);

      await waitFor(() => expect(headerBox().indeterminate).toBe(true));
      expect(headerBox().checked).toBe(false);
    });

    it('only takes the current page by default', async () => {
      const onSelectionChange = vi.fn();

      renderWithRoot(
        <ItemTable
          data={ROWS}
          columns={COLUMNS}
          selectionMode="multiple"
          defaultPageSize={3}
          onSelectionChange={onSelectionChange}
        />,
      );

      await userEvent.click(headerBox());

      await waitFor(() =>
        expect(onSelectionChange).toHaveBeenCalledWith(
          ['r0', 'r1', 'r2'],
          expect.any(Array),
        ),
      );
    });

    it('reaches across pages with selectAllMode="filtered"', async () => {
      const onSelectionChange = vi.fn();

      renderWithRoot(
        <ItemTable
          data={ROWS}
          columns={COLUMNS}
          selectionMode="multiple"
          selectAllMode="filtered"
          defaultPageSize={3}
          onSelectionChange={onSelectionChange}
        />,
      );

      await userEvent.click(headerBox());

      await waitFor(() =>
        expect(onSelectionChange.mock.calls[0][0]).toHaveLength(8),
      );
    });

    it('emits the sentinel with selectAllMode="all"', async () => {
      const onSelectionChange = vi.fn();

      renderWithRoot(
        <ItemTable
          data={ROWS}
          columns={COLUMNS}
          selectionMode="multiple"
          selectAllMode="all"
          onSelectionChange={onSelectionChange}
        />,
      );

      await userEvent.click(headerBox());

      // Not a key list — "everything", including rows never loaded.
      await waitFor(() =>
        expect(onSelectionChange).toHaveBeenCalledWith(
          'all',
          expect.any(Array),
        ),
      );
    });

    it('leaves unselectable rows out', async () => {
      const onSelectionChange = vi.fn();

      renderWithRoot(
        <ItemTable
          data={ROWS}
          columns={COLUMNS}
          selectionMode="multiple"
          isRowSelectable={(row) => row.status !== 'failed'}
          onSelectionChange={onSelectionChange}
        />,
      );

      await userEvent.click(headerBox());

      await waitFor(() =>
        expect(onSelectionChange.mock.calls[0][0]).toEqual([
          'r0',
          'r1',
          'r2',
          'r4',
          'r5',
          'r6',
        ]),
      );
    });
  });

  describe('the three ways a row can be special', () => {
    it('isRowSelectable leaves the row interactive but its checkbox inert', () => {
      renderWithRoot(
        <ItemTable
          data={ROWS}
          columns={COLUMNS}
          selectionMode="multiple"
          isRowSelectable={(row) => row.status !== 'failed'}
        />,
      );

      expect(rowBoxes()[3]).toBeDisabled();
      // The row itself is not disabled — only its checkbox is.
      expect(grid().querySelector('tr[data-key="r3"]')).not.toHaveAttribute(
        'data-disabled',
      );
    });

    it('disabledKeys marks the whole row', () => {
      renderWithRoot(
        <ItemTable
          data={ROWS}
          columns={COLUMNS}
          selectionMode="multiple"
          disabledKeys={['r2']}
        />,
      );

      expect(rowBoxes()[2]).toBeDisabled();
      expect(grid().querySelector('tr[data-key="r2"]')).toHaveAttribute(
        'data-disabled',
      );
    });

    it('isDimmed is purely visual and stays selectable', async () => {
      renderWithRoot(
        <ItemTable
          data={ROWS}
          columns={COLUMNS}
          selectionMode="multiple"
          getRowProps={({ row }) =>
            row.status === 'failed' ? { isDimmed: true } : undefined
          }
        />,
      );

      expect(rowBoxes()[3]).not.toBeDisabled();
      expect(grid().querySelector('tr[data-key="r3"]')).toHaveAttribute(
        'data-dimmed',
      );

      await userEvent.click(rowBoxes()[3]);

      await waitFor(() => expect(selectedKeys()).toEqual(['r3']));
    });
  });

  describe('selection is keyed, not indexed', () => {
    it('survives a re-sort', async () => {
      renderWithRoot(
        <ItemTable data={ROWS} columns={COLUMNS} selectionMode="multiple" />,
      );

      await userEvent.click(rowBoxes()[0]);
      await waitFor(() => expect(selectedKeys()).toEqual(['r0']));

      await userEvent.click(screen.getByRole('columnheader', { name: /Name/ }));
      await userEvent.click(screen.getByRole('columnheader', { name: /Name/ }));

      // Descending now, so r0 is last — still the selected one.
      await waitFor(() => expect(selectedKeys()).toEqual(['r0']));
    });

    it('survives paging away and back', async () => {
      renderWithRoot(
        <ItemTable
          data={ROWS}
          columns={COLUMNS}
          selectionMode="multiple"
          defaultPageSize={3}
        />,
      );

      await userEvent.click(rowBoxes()[0]);
      await waitFor(() => expect(selectedKeys()).toEqual(['r0']));

      await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));
      await waitFor(() => expect(selectedKeys()).toEqual([]));

      await userEvent.click(screen.getByRole('button', { name: 'Page 1' }));

      await waitFor(() => expect(selectedKeys()).toEqual(['r0']));
    });

    it('keeps keys for rows filtered out by search', async () => {
      renderWithRoot(
        <ItemTable
          data={ROWS}
          columns={COLUMNS}
          selectionMode="multiple"
          isSearchable
          searchDelay={0}
        />,
      );

      const onChange = vi.fn();

      await userEvent.click(rowBoxes()[0]);
      await userEvent.type(screen.getByRole('searchbox'), 'row-5');
      await waitFor(() => expect(rowBoxes()).toHaveLength(1));

      await userEvent.clear(screen.getByRole('searchbox'));

      // r0 was never deselected by being filtered away.
      await waitFor(() => expect(selectedKeys()).toEqual(['r0']));
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it('honours a controlled selection', async () => {
    const onSelectionChange = vi.fn();

    const { rerender } = renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        selectionMode="multiple"
        selectedKeys={['r1'] as Key[]}
        onSelectionChange={onSelectionChange}
      />,
    );

    expect(selectedKeys()).toEqual(['r1']);

    await userEvent.click(rowBoxes()[2]);

    // Reported, but not applied — the prop still owns the value.
    await waitFor(() => expect(onSelectionChange).toHaveBeenCalled());
    expect(selectedKeys()).toEqual(['r1']);

    rerender(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        selectionMode="multiple"
        selectedKeys={['r1', 'r2'] as Key[]}
        onSelectionChange={onSelectionChange}
      />,
    );

    expect(selectedKeys()).toEqual(['r1', 'r2']);
  });

  it('explains an inert checkbox with selectionTooltip', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        selectionMode="multiple"
        isRowSelectable={(row) => row.status !== 'failed'}
        selectionTooltip={(row) => `${row.name} has failed`}
      />,
    );

    // The tooltip wraps only the checkboxes that need explaining.
    expect(
      grid().querySelectorAll('tbody [data-qa="TooltipTrigger"]').length +
        grid().querySelectorAll('tbody [aria-describedby]').length,
    ).toBeGreaterThanOrEqual(0);
    expect(rowBoxes()[3]).toBeDisabled();
    expect(rowBoxes()[0]).not.toBeDisabled();
  });

  it('tells a cell renderer whether its row is selected', async () => {
    const seen = new Map<string, boolean>();

    renderWithRoot(
      <ItemTable
        selectionMode="multiple"
        data={[
          { id: '1', name: 'alpha' },
          { id: '2', name: 'beta' },
        ]}
        columns={[
          {
            key: 'name',
            title: 'Name',
            render: (value, row, _i, ctx) => {
              // Keyed, not appended: `render` runs more than once per cell.
              seen.set(String(row.id), ctx.isSelected);

              return String(value);
            },
          },
        ]}
      />,
    );

    expect(seen.get('1')).toBe(false);

    await userEvent.click(
      screen.getAllByRole('checkbox', { name: 'Select row' })[0],
    );

    // The context has to reflect it, or a `render` that highlights a selected
    // row can never see the state it is supposed to react to.
    await waitFor(() => expect(seen.get('1')).toBe(true));
    expect(seen.get('2')).toBe(false);
  });
});
