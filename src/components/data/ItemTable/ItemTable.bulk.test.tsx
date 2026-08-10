import {
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
  within,
} from '../../../test';

import { ItemTable } from './ItemTable';

import type { CubeItemTableColumn, CubeTableBulkAction } from './types';

interface Row {
  id: string;
  name: string;
  status: 'running' | 'stopped';
}

const COLUMNS: CubeItemTableColumn<Row>[] = [
  { key: 'name', title: 'Name', isRowHeader: true },
];

const ROWS: Row[] = [
  { id: 'r0', name: 'row-0', status: 'running' },
  { id: 'r1', name: 'row-1', status: 'stopped' },
  { id: 'r2', name: 'row-2', status: 'stopped' },
];

const bar = () => screen.queryByTestId('ItemTableBulkBar');
const rowBoxes = () =>
  Array.from(
    screen.getByRole('grid').querySelectorAll('tbody input[type=checkbox]'),
  ) as HTMLInputElement[];

function actions(
  overrides: Partial<CubeTableBulkAction<Row>> = {},
): CubeTableBulkAction<Row>[] {
  return [{ key: 'go', label: 'Go', onAction: vi.fn(), ...overrides }];
}

describe('ItemTable bulk actions', () => {
  it('implies multiple selection', () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} bulkActions={actions()} />,
    );

    // A bulk action with no way to select rows is a contradiction.
    expect(rowBoxes()).toHaveLength(3);
    expect(screen.getByRole('grid')).toHaveAttribute(
      'aria-multiselectable',
      'true',
    );
  });

  it('yields to an explicit selectionMode', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        bulkActions={actions()}
        selectionMode="none"
      />,
    );

    expect(rowBoxes()).toHaveLength(0);
  });

  it('stays hidden until something is selected', async () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} bulkActions={actions()} />,
    );

    expect(bar()).toBeNull();

    await userEvent.click(rowBoxes()[0]);

    await waitFor(() => expect(bar()).not.toBeNull());
    expect(within(bar()!).getByText('1 selected')).toBeInTheDocument();
  });

  it('hands the action the selected rows', async () => {
    const onAction = vi.fn();

    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        bulkActions={actions({ onAction })}
      />,
    );

    await userEvent.click(rowBoxes()[0]);
    await userEvent.click(rowBoxes()[2]);
    await userEvent.click(await screen.findByRole('button', { name: 'Go' }));

    await waitFor(() =>
      expect(onAction).toHaveBeenCalledWith(
        [
          expect.objectContaining({ id: 'r0' }),
          expect.objectContaining({ id: 'r2' }),
        ],
        expect.objectContaining({ setLoading: expect.any(Function) }),
      ),
    );
  });

  it('clears the selection once the action resolves', async () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} bulkActions={actions()} />,
    );

    await userEvent.click(rowBoxes()[0]);
    await userEvent.click(await screen.findByRole('button', { name: 'Go' }));

    // The rows an action just deleted or moved are usually gone.
    await waitFor(() => expect(bar()).toBeNull());
  });

  it('keeps the selection with deselectAfter: false', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        bulkActions={actions({ deselectAfter: false })}
      />,
    );

    await userEvent.click(rowBoxes()[0]);
    await userEvent.click(await screen.findByRole('button', { name: 'Go' }));

    // An action that only reads does not consume the selection.
    await waitFor(() =>
      expect(within(bar()!).getByText('1 selected')).toBeInTheDocument(),
    );
  });

  it('disables an action that cannot apply', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        bulkActions={actions({
          isDisabled: (rows) => rows.some((row) => row.status === 'running'),
          disabledTooltip: 'A running deployment cannot be deleted',
        })}
      />,
    );

    await userEvent.click(rowBoxes()[0]);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Go' })).toBeDisabled(),
    );

    await userEvent.click(rowBoxes()[0]);
    await userEvent.click(rowBoxes()[1]);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Go' })).not.toBeDisabled(),
    );
  });

  it('clears from the bar', async () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} bulkActions={actions()} />,
    );

    await userEvent.click(rowBoxes()[0]);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Clear selection' }),
    );

    await waitFor(() => expect(bar()).toBeNull());
  });

  it('clears on Escape', async () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} bulkActions={actions()} />,
    );

    await userEvent.click(rowBoxes()[0]);
    await waitFor(() => expect(bar()).not.toBeNull());

    rowBoxes()[0].focus();
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(bar()).toBeNull());
  });

  describe('placement', () => {
    it('floats outside the toolbar by default', async () => {
      renderWithRoot(
        <ItemTable
          data={ROWS}
          columns={COLUMNS}
          bulkActions={actions()}
          isSearchable
        />,
      );

      await userEvent.click(rowBoxes()[0]);

      await waitFor(() => expect(bar()).not.toBeNull());
      expect(bar()!.closest('[data-qa="ItemTableToolbar"]')).toBeNull();
      expect(bar()).toHaveAttribute('data-floating');
    });

    it('takes the actions group with placement="toolbar"', async () => {
      renderWithRoot(
        <ItemTable
          data={ROWS}
          columns={COLUMNS}
          bulkActions={actions()}
          bulkBarPlacement="toolbar"
          actions={<button type="button">Create</button>}
        />,
      );

      expect(
        screen.getByRole('button', { name: 'Create' }),
      ).toBeInTheDocument();

      await userEvent.click(rowBoxes()[0]);

      await waitFor(() =>
        expect(bar()!.closest('[data-qa="ItemTableToolbar"]')).not.toBeNull(),
      );
      // The two compete for the same space, so the bar replaces the group
      // rather than sitting beside it.
      expect(screen.queryByRole('button', { name: 'Create' })).toBeNull();
      expect(bar()).not.toHaveAttribute('data-floating');
    });

    it('brings the toolbar into existence when there is none', async () => {
      renderWithRoot(
        <ItemTable
          data={ROWS}
          columns={COLUMNS}
          bulkActions={actions()}
          bulkBarPlacement="toolbar"
        />,
      );

      expect(screen.queryByTestId('ItemTableToolbar')).toBeNull();

      await userEvent.click(rowBoxes()[0]);

      await waitFor(() =>
        expect(screen.getByTestId('ItemTableToolbar')).toBeInTheDocument(),
      );
    });
  });
});
