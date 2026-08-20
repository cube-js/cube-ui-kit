import { fireEvent } from '@testing-library/react';

import {
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
  within,
} from '../../../test';

import { ItemTable } from './ItemTable';

import type { CubeItemTableColumn } from './types';

interface Row {
  id: string;
  name: string;
  children?: Row[];
}

const DATA: Row[] = [
  {
    id: 'root',
    name: 'Root',
    children: [
      {
        id: 'branch',
        name: 'Branch',
        children: [{ id: 'leaf', name: 'Needle leaf' }],
      },
      { id: 'sibling', name: 'Sibling' },
    ],
  },
  { id: 'other', name: 'Other' },
];

const COLUMNS: CubeItemTableColumn<Row>[] = [
  { key: 'name', title: 'Name', isRowHeader: true, isSortable: true },
];

const treeProps = {
  data: DATA,
  columns: COLUMNS,
  getRowChildren: (row: Row) => row.children,
  ariaLabel: 'Hierarchy',
};

const grid = () => screen.getByRole('treegrid', { name: 'Hierarchy' });
const bodyRows = () =>
  Array.from(
    grid().querySelectorAll<HTMLTableRowElement>(
      'tbody tr[data-element="Row"]',
    ),
  );
const row = (key: string) =>
  grid().querySelector<HTMLTableRowElement>(`tbody tr[data-key="${key}"]`)!;
const rowBox = (key: string) =>
  row(key).querySelector<HTMLInputElement>('input[type="checkbox"]')!;

describe('ItemTable tree rows', () => {
  it('uses treegrid semantics and exposes hierarchy metadata', () => {
    const contexts: unknown[] = [];

    renderWithRoot(
      <ItemTable
        {...treeProps}
        defaultExpandedKeys={['root', 'branch']}
        getRowProps={(ctx) => {
          contexts.push(ctx.tree);
          return {};
        }}
      />,
    );

    expect(screen.queryByRole('grid')).toBeNull();
    expect(grid()).toHaveAttribute('aria-rowcount', '6');
    expect(row('root')).toHaveAttribute('aria-level', '1');
    expect(row('root')).toHaveAttribute('aria-expanded', 'true');
    expect(row('root')).toHaveAttribute('aria-posinset', '1');
    expect(row('branch')).toHaveAttribute('aria-level', '2');
    expect(row('branch')).toHaveAttribute('aria-posinset', '1');
    expect(row('branch')).toHaveAttribute('aria-setsize', '2');
    expect(row('leaf')).toHaveAttribute('aria-level', '3');
    expect(contexts).toContainEqual({
      level: 2,
      parentKey: 'branch',
      hasChildren: false,
      isExpanded: false,
    });
  });

  it('expands and collapses without activating the row', async () => {
    const onExpand = vi.fn();
    const onRowAction = vi.fn();

    renderWithRoot(
      <ItemTable
        {...treeProps}
        onExpand={onExpand}
        onRowAction={onRowAction}
      />,
    );

    await userEvent.click(
      within(row('root')).getByRole('button', { name: /^Expand/ }),
    );

    expect(row('branch')).toBeInTheDocument();
    expect(onRowAction).not.toHaveBeenCalled();
    expect(onExpand).toHaveBeenLastCalledWith(
      ['root'],
      expect.objectContaining({
        rowKey: 'root',
        level: 0,
        parentKey: null,
        expanded: true,
      }),
    );

    await userEvent.click(
      within(row('root')).getByRole('button', { name: /^Collapse/ }),
    );
    expect(row('branch')).not.toBeInTheDocument();
  });

  it('reports controlled expansion but waits for the prop to change', async () => {
    const onExpand = vi.fn();

    renderWithRoot(
      <ItemTable {...treeProps} expandedKeys={[]} onExpand={onExpand} />,
    );

    await userEvent.click(
      within(row('root')).getByRole('button', { name: /^Expand/ }),
    );

    expect(onExpand).toHaveBeenCalled();
    expect(row('branch')).not.toBeInTheDocument();
  });

  it('navigates three levels with arrow keys', async () => {
    renderWithRoot(<ItemTable {...treeProps} />);
    row('root').focus();

    await userEvent.keyboard('{ArrowRight}');
    expect(row('root')).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{ArrowRight}');
    expect(row('branch')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{ArrowRight}');
    expect(row('leaf')).toHaveFocus();

    await userEvent.keyboard('{ArrowLeft}');
    expect(row('branch')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(row('branch')).toHaveAttribute('aria-expanded', 'false');
  });

  it('searches recursively, keeps ancestor paths, and restores expansion', async () => {
    const { rerender } = renderWithRoot(
      <ItemTable
        {...treeProps}
        searchValue="needle"
        searchDelay={0}
        searchMode="client"
      />,
    );

    await waitFor(() =>
      expect(bodyRows().map((item) => item.dataset.key)).toEqual([
        'root',
        'branch',
        'leaf',
      ]),
    );

    rerender(
      <ItemTable
        {...treeProps}
        searchValue=""
        searchDelay={0}
        searchMode="client"
      />,
    );

    await waitFor(() =>
      expect(bodyRows().map((item) => item.dataset.key)).toEqual([
        'root',
        'other',
      ]),
    );
  });

  it('cascades multiple selection and derives an indeterminate parent', async () => {
    const onSelectionChange = vi.fn();

    renderWithRoot(
      <ItemTable
        {...treeProps}
        selectionMode="multiple"
        defaultExpandedKeys={['root', 'branch']}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(rowBox('root'));
    await waitFor(() =>
      expect(onSelectionChange).toHaveBeenLastCalledWith(
        ['root', 'branch', 'leaf', 'sibling'],
        expect.arrayContaining([
          expect.objectContaining({ id: 'root' }),
          expect.objectContaining({ id: 'leaf' }),
        ]),
      ),
    );
    expect(rowBox('leaf')).toBeChecked();

    await userEvent.click(rowBox('leaf'));
    expect(rowBox('root').indeterminate).toBe(true);
    expect(rowBox('branch').indeterminate).toBe(false);
    expect(rowBox('leaf')).not.toBeChecked();
  });

  it('cascades only through rows retained by client search', async () => {
    const onSelectionChange = vi.fn();

    const { rerender } = renderWithRoot(
      <ItemTable
        {...treeProps}
        selectionMode="multiple"
        defaultExpandedKeys={['root']}
        searchValue="needle"
        searchDelay={0}
        searchMode="client"
        onSelectionChange={onSelectionChange}
      />,
    );

    await waitFor(() => expect(row('leaf')).toBeInTheDocument());
    await userEvent.click(rowBox('root'));

    await waitFor(() => {
      const keys = onSelectionChange.mock.lastCall?.[0] as string[];
      expect(keys).toEqual(['root', 'branch', 'leaf']);
      expect(keys).not.toContain('sibling');
      expect(keys).not.toContain('other');
    });

    rerender(
      <ItemTable
        {...treeProps}
        selectionMode="multiple"
        defaultExpandedKeys={['root']}
        searchValue=""
        searchDelay={0}
        searchMode="client"
        onSelectionChange={onSelectionChange}
      />,
    );

    await waitFor(() => expect(row('sibling')).toBeInTheDocument());
    expect(rowBox('sibling')).not.toBeChecked();
    expect(rowBox('root').indeterminate).toBe(true);
  });

  it('excludes disabled descendants from cascade and collapsed select-all', async () => {
    const onSelectionChange = vi.fn();

    renderWithRoot(
      <ItemTable
        {...treeProps}
        selectionMode="multiple"
        disabledKeys={['leaf']}
        onSelectionChange={onSelectionChange}
      />,
    );

    await userEvent.click(within(grid()).getAllByRole('checkbox')[0]);

    await waitFor(() => {
      const keys = onSelectionChange.mock.lastCall?.[0] as string[];
      expect(keys).toEqual(['root', 'branch', 'sibling', 'other']);
      expect(keys).not.toContain('leaf');
    });
  });

  it('keeps single and independent multiple selection non-cascading', async () => {
    const { rerender } = renderWithRoot(
      <ItemTable
        {...treeProps}
        selectionMode="single"
        defaultExpandedKeys={['root']}
      />,
    );

    await userEvent.click(rowBox('root'));
    expect(rowBox('root')).toBeChecked();
    expect(rowBox('branch')).not.toBeChecked();

    rerender(
      <ItemTable
        key="independent"
        {...treeProps}
        selectionMode="multiple"
        treeSelectionBehavior="independent"
        defaultExpandedKeys={['root']}
      />,
    );
    await userEvent.click(rowBox('root'));
    expect(rowBox('root')).toBeChecked();
    expect(rowBox('branch')).not.toBeChecked();
  });

  it('warns and ignores flat reordering in tree mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderWithRoot(
      <ItemTable
        {...treeProps}
        isReorderable
        onReorder={() => {}}
        treeColumnKey="missing"
      />,
    );

    expect(warn).toHaveBeenCalledWith(
      'CubeUIKit:',
      'ItemTable:',
      '`isReorderable` is ignored in tree mode. Use `dropOnRow` for folder-style moves.',
    );
    expect(warn).toHaveBeenCalledWith(
      'CubeUIKit:',
      'ItemTable:',
      '`treeColumnKey` must identify a visible data column. Falling back to the first visible column.',
    );
    expect(row('root')).not.toHaveAttribute('draggable');
    warn.mockRestore();
  });
});
