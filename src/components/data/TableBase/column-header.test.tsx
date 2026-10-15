import { renderWithRoot, screen, userEvent } from '../../../test';

import { renderColumnHeaderContent } from './column-header';

import type { ReactNode } from 'react';
import type { ColumnSortState } from './column-header';
import type { CubeResolvedColumn, CubeTableHeaderContext } from './types';

const COLUMN: CubeResolvedColumn = {
  key: 'name',
  title: 'Name',
  index: 0,
  ariaColIndex: 1,
  width: 160,
  minWidth: 40,
  maxWidth: null,
  flex: null,
  align: 'start',
  pinOffset: null,
  isPinEdge: false,
  isStructural: false,
};
const UNSORTED: ColumnSortState = {
  isSortable: true,
  isSorted: false,
  activeSort: null,
  rank: null,
};

function headerContent(
  column: CubeResolvedColumn,
  sort: ColumnSortState,
  menuTrigger: ReactNode,
) {
  return <>{renderColumnHeaderContent(column, sort, menuTrigger)}</>;
}

describe('column header content', () => {
  it('updates the direction and multi-sort rank with fresh sort entries', () => {
    const { container, rerender } = renderWithRoot(
      headerContent(COLUMN, UNSORTED, null),
    );
    const indicator = () =>
      container.querySelector('[data-element="SortIndicator"]')!;
    expect(indicator()).not.toHaveAttribute('data-sorted');

    for (const [direction, rank] of [
      ['asc', 2],
      ['desc', 1],
    ] as const) {
      rerender(
        headerContent(
          COLUMN,
          {
            isSortable: true,
            isSorted: true,
            activeSort: { columnKey: 'name', direction },
            rank,
          },
          null,
        ),
      );
      expect(indicator()).toHaveAttribute('data-sorted', '');
      expect(indicator()).toHaveAttribute('data-dir', direction);
      expect(indicator()).toHaveAttribute('data-rank', String(rank));
    }

    rerender(headerContent(COLUMN, UNSORTED, null));
    expect(indicator()).not.toHaveAttribute('data-dir');
    expect(indicator()).not.toHaveAttribute('data-rank');
    rerender(headerContent(COLUMN, { ...UNSORTED, isSortable: false }, null));
    expect(indicator()).toBeNull();
  });

  it('keeps rich slots and action handlers current', async () => {
    const first = vi.fn();
    const next = vi.fn();
    const renderHeader = (updated: boolean) =>
      headerContent(
        {
          ...COLUMN,
          title: updated ? 'Updated name' : 'Name',
          header: {
            rightIcon: <span>{updated ? 'New icon' : 'Icon'}</span>,
            prefix: updated ? 'New prefix' : 'Prefix',
            suffix: updated ? 'New suffix' : 'Suffix',
            description: updated ? 'New description' : 'Description',
            actions: (
              <button onClick={updated ? next : first}>
                {updated ? 'New action' : 'Action'}
              </button>
            ),
          },
        },
        UNSORTED,
        <button>{updated ? 'New menu' : 'Menu'}</button>,
      );
    const { rerender } = renderWithRoot(renderHeader(false));
    await userEvent.click(screen.getByRole('button', { name: 'Action' }));
    expect(first).toHaveBeenCalledOnce();

    rerender(renderHeader(true));
    for (const text of [
      'Updated name',
      'New icon',
      'New prefix',
      'New suffix',
      'New description',
    ]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual([
      'New action',
      'New menu',
    ]);
    await userEvent.click(buttons[0]);
    expect(next).toHaveBeenCalledOnce();
    expect(first).toHaveBeenCalledOnce();
  });

  it('calls a custom renderer with current layout and sort context', () => {
    const render = vi.fn(
      ({ width, sort }: CubeTableHeaderContext) => `${width}:${sort}`,
    );
    const column = { ...COLUMN, header: { render } };
    const { rerender } = renderWithRoot(headerContent(column, UNSORTED, null));
    expect(screen.getByText('160:null')).toBeInTheDocument();

    rerender(
      headerContent(
        { ...column, index: 2, width: 240 },
        {
          ...UNSORTED,
          isSorted: true,
          activeSort: { columnKey: 'name', direction: 'desc' },
        },
        <button>Ignored menu</button>,
      ),
    );
    expect(screen.getByText('240:desc')).toBeInTheDocument();
    expect(render).toHaveBeenLastCalledWith({
      columnKey: 'name',
      columnIndex: 2,
      width: 240,
      sort: 'desc',
      isSortable: true,
      isResizing: false,
    });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
