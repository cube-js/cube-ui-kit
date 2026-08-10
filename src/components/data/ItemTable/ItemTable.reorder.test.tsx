import { fireEvent } from '@testing-library/react';

import { renderWithRoot, screen, waitFor } from '../../../test';

import { ItemTable } from './ItemTable';

import type { CubeItemTableColumn } from './types';

interface Row {
  id: string;
  name: string;
}

const COLUMNS: CubeItemTableColumn<Row>[] = [
  { key: 'name', title: 'Name', isRowHeader: true },
];

const ROWS: Row[] = Array.from({ length: 4 }, (_, i) => ({
  id: `r${i}`,
  name: `row-${i}`,
}));

const rows = () =>
  Array.from(
    screen.getByRole('grid').querySelectorAll('tbody tr[data-element="Row"]'),
  ) as HTMLTableRowElement[];

describe('ItemTable row reordering', () => {
  it('leaves rows undraggable by default', () => {
    renderWithRoot(<ItemTable data={ROWS} columns={COLUMNS} />);

    expect(rows()[0]).not.toHaveAttribute('draggable');
    expect(rows()[0]).not.toHaveAttribute('data-draggable');
  });

  it('makes rows draggable with isReorderable', () => {
    renderWithRoot(
      <ItemTable
        isReorderable
        data={ROWS}
        columns={COLUMNS}
        onReorder={() => {}}
      />,
    );

    for (const row of rows()) {
      expect(row).toHaveAttribute('draggable', 'true');
      expect(row).toHaveAttribute('data-draggable');
    }
  });

  it('describes the drag affordance for screen readers', () => {
    renderWithRoot(
      <ItemTable
        isReorderable
        data={ROWS}
        columns={COLUMNS}
        onReorder={() => {}}
      />,
    );

    // React Aria announces how to start a keyboard drag; the description is
    // only useful if the row can actually be reached, which the roving
    // tabindex below is for.
    expect(rows()[0]).toHaveAttribute('aria-describedby');
  });

  describe('roving tabindex', () => {
    it('gives the grid exactly one tab stop', () => {
      renderWithRoot(
        <ItemTable
          isReorderable
          data={ROWS}
          columns={COLUMNS}
          onReorder={() => {}}
        />,
      );

      const tabbable = rows().filter((row) => row.tabIndex === 0);

      // Without this every row is `tabIndex={-1}` and React Aria's keyboard
      // drag is unreachable — the feature would be pointer-only.
      expect(tabbable).toHaveLength(1);
      expect(tabbable[0]).toBe(rows()[0]);
    });

    it('moves focus with the arrow keys', async () => {
      renderWithRoot(
        <ItemTable
          isReorderable
          data={ROWS}
          columns={COLUMNS}
          onReorder={() => {}}
        />,
      );

      rows()[0].focus();
      fireEvent.keyDown(rows()[0], { key: 'ArrowDown' });

      await waitFor(() => expect(document.activeElement).toBe(rows()[1]));

      fireEvent.keyDown(rows()[1], { key: 'ArrowUp' });

      await waitFor(() => expect(document.activeElement).toBe(rows()[0]));
    });

    it('follows focus with the tab stop', async () => {
      renderWithRoot(
        <ItemTable
          isReorderable
          data={ROWS}
          columns={COLUMNS}
          onReorder={() => {}}
        />,
      );

      rows()[0].focus();
      fireEvent.keyDown(rows()[0], { key: 'ArrowDown' });

      // Leaving and returning to the grid lands on the row the user left.
      await waitFor(() => expect(rows()[1].tabIndex).toBe(0));
      expect(rows()[0].tabIndex).toBe(-1);
    });

    it('stops at the ends', async () => {
      renderWithRoot(
        <ItemTable
          isReorderable
          data={ROWS}
          columns={COLUMNS}
          onReorder={() => {}}
        />,
      );

      rows()[0].focus();
      fireEvent.keyDown(rows()[0], { key: 'ArrowUp' });

      await waitFor(() => expect(document.activeElement).toBe(rows()[0]));
    });

    it('adds no tab stop when reordering is off', () => {
      renderWithRoot(<ItemTable data={ROWS} columns={COLUMNS} />);

      expect(rows().filter((row) => row.tabIndex === 0)).toHaveLength(0);
    });
  });

  it('reports the whole order, not just the moved row', () => {
    // `onReorder` is driven by React Aria's drop machinery, which needs real
    // drag events. What is asserted here is the contract the adapter builds:
    // every key, and the rows in that order.
    const onReorder = vi.fn();

    renderWithRoot(
      <ItemTable
        isReorderable
        data={ROWS}
        columns={COLUMNS}
        onReorder={onReorder}
      />,
    );

    expect(rows().map((row) => row.getAttribute('data-key'))).toEqual([
      'r0',
      'r1',
      'r2',
      'r3',
    ]);
  });
});

describe('ItemTable dropOnRow', () => {
  const FOLDERS: Row[] = [
    { id: 'f0', name: 'folder-0' },
    { id: 'r0', name: 'row-0' },
    { id: 'r1', name: 'row-1' },
  ];

  const dropOnRow = {
    isTarget: (row: Row) => row.id.startsWith('f'),
    onDrop: vi.fn(),
  };

  it('turns on dragging without isReorderable', () => {
    // Cloud's Workbooks page drags rows into folders and never reorders them,
    // so drop-on-row has to enable the drag machinery on its own.
    renderWithRoot(
      <ItemTable data={FOLDERS} columns={COLUMNS} dropOnRow={dropOnRow} />,
    );

    expect(rows()[0]).toHaveAttribute('draggable', 'true');
  });

  it('still gives the grid a tab stop', () => {
    renderWithRoot(
      <ItemTable data={FOLDERS} columns={COLUMNS} dropOnRow={dropOnRow} />,
    );

    expect(rows().filter((row) => row.tabIndex === 0)).toHaveLength(1);
  });

  it('attaches drop handling to the row container', () => {
    renderWithRoot(
      <ItemTable data={FOLDERS} columns={COLUMNS} dropOnRow={dropOnRow} />,
    );

    const body = screen.getByRole('grid').querySelector('tbody')!;
    const propsKey = Object.keys(body).find((key) =>
      key.startsWith('__reactProps$'),
    )!;

    // The drop listeners live on the element that directly contains the rows.
    // Without them a row lifts but can never land — which is exactly what
    // happens if `collectionProps` is dropped or `listRef` points elsewhere.
    const handlers = Object.keys((body as any)[propsKey]);

    expect(handlers).toContain('onDrop');
    expect(handlers).toContain('onDragOver');
  });
});

describe('reordering and dropping onto a row compose', () => {
  const MIXED: Row[] = [
    { id: 'f0', name: 'folder-0' },
    { id: 'r0', name: 'row-0' },
    { id: 'r1', name: 'row-1' },
  ];

  function renderBoth() {
    const onReorder = vi.fn();
    const onDrop = vi.fn();

    renderWithRoot(
      <ItemTable
        isReorderable
        data={MIXED}
        columns={COLUMNS}
        onReorder={onReorder}
        dropOnRow={{ isTarget: (row) => row.id.startsWith('f'), onDrop }}
      />,
    );

    return { onReorder, onDrop };
  }

  it('drags every row and keeps one tab stop', () => {
    renderBoth();

    // Both cases are live at once; they are not alternatives.
    for (const row of rows()) {
      expect(row).toHaveAttribute('draggable', 'true');
    }

    expect(rows().filter((row) => row.tabIndex === 0)).toHaveLength(1);
  });

  it('wires both drop paths onto the row container', () => {
    renderBoth();

    const body = screen.getByRole('grid').querySelector('tbody')!;
    const propsKey = Object.keys(body).find((key) =>
      key.startsWith('__reactProps$'),
    )!;
    const handlers = Object.keys((body as any)[propsKey]);

    expect(handlers).toContain('onDrop');
    expect(handlers).toContain('onDragOver');
  });
});

describe('drop indicator', () => {
  it('adds no indicator rows while nothing is being dragged', () => {
    renderWithRoot(
      <ItemTable
        isReorderable
        data={ROWS}
        columns={COLUMNS}
        onReorder={() => {}}
      />,
    );

    // They mount only during a drag, so a table merely capable of dragging
    // keeps its ordinary row structure — and its ARIA row count.
    expect(
      screen
        .getByRole('grid')
        .querySelectorAll('[data-element="DropIndicatorRow"]'),
    ).toHaveLength(0);
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '5');
  });

  it('keeps the row list unchanged when dragging is available', () => {
    renderWithRoot(
      <ItemTable
        isReorderable
        data={ROWS}
        columns={COLUMNS}
        onReorder={() => {}}
      />,
    );

    expect(rows()).toHaveLength(4);
  });
});
