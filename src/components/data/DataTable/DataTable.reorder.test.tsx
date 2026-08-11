import { fireEvent, renderWithRoot, screen } from '../../../test';

import { DataTable } from './DataTable';

import type { CubeDataTableColumn } from './types';

interface Row {
  id: string;
  region: string;
  channel: string;
  orders: number;
}

const ROWS: Row[] = [
  { id: 'r0', region: 'eu-west-1', channel: 'organic', orders: 30 },
  { id: 'r1', region: 'us-east-1', channel: 'paid', orders: 10 },
];

const COLUMNS: CubeDataTableColumn<Row>[] = [
  { key: 'region', title: 'Region' },
  { key: 'channel', title: 'Channel' },
  { key: 'orders', title: 'Orders', dataType: 'number' },
];

const grid = () => screen.getByRole('grid');
const headers = () =>
  Array.from(
    grid().querySelectorAll('thead th[data-element="HeaderCell"]'),
  ) as HTMLElement[];
const headerKeys = () => headers().map((cell) => cell.getAttribute('data-key'));
const draggableKeys = () =>
  headers()
    .filter((cell) => cell.hasAttribute('data-draggable'))
    .map((cell) => cell.getAttribute('data-key'));
const header = (key: string) =>
  grid().querySelector(`thead [data-key="${key}"]`) as HTMLElement;

describe('DataTable column order', () => {
  it('is not draggable by default', () => {
    renderWithRoot(<DataTable data={ROWS} columns={COLUMNS} />);

    expect(draggableKeys()).toEqual([]);
    expect(headers().some((cell) => cell.getAttribute('draggable'))).toBe(
      false,
    );
  });

  it('makes every ordinary column a drag source', () => {
    renderWithRoot(
      <DataTable data={ROWS} columns={COLUMNS} isColumnReorderable />,
    );

    expect(draggableKeys()).toEqual(['region', 'channel', 'orders']);
    expect(header('region')).toHaveAttribute('draggable', 'true');
  });

  it('excludes pinned, opted-out and structural columns', () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={[
          { ...COLUMNS[0], pin: 'start' },
          { ...COLUMNS[1], isReorderable: false },
          COLUMNS[2],
          { key: 'extra', title: 'Extra' },
        ]}
        isColumnReorderable
        showRowNumbers
      />,
    );

    // `pin` is already the ordering authority for a pinned column, and the row
    // number ruler is structural.
    expect(draggableKeys()).toEqual(['orders', 'extra']);
  });

  it('does not mount the machinery for a single draggable column', () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={[COLUMNS[0], { ...COLUMNS[1], isReorderable: false }]}
        isColumnReorderable
      />,
    );

    // Nothing to reorder it with, so the header keeps its exact DOM.
    expect(draggableKeys()).toEqual([]);
  });

  it('gives a draggable column a tab stop', () => {
    renderWithRoot(
      <DataTable data={ROWS} columns={COLUMNS} isColumnReorderable />,
    );

    // Not sortable and no menu, but Alt+Arrow needs somewhere to land.
    expect(header('region')).toHaveAttribute('tabindex', '0');
  });

  /* ── order resolution ─────────────────────────────────────────────────── */

  it('follows a controlled order, with or without dragging', () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={COLUMNS}
        columnOrder={['orders', 'region', 'channel']}
      />,
    );

    expect(headerKeys()).toEqual(['orders', 'region', 'channel']);
    // Renumbered, so a screen reader reads the columns as displayed.
    expect(headers().map((cell) => cell.getAttribute('aria-colindex'))).toEqual(
      ['1', '2', '3'],
    );
  });

  it('still hoists pinned columns to the edges', () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={[COLUMNS[0], COLUMNS[1], { ...COLUMNS[2], pin: 'start' }]}
        columnOrder={['channel', 'region', 'orders']}
      />,
    );

    // `columnOrder` sequences within a band; `pin` decides the band.
    expect(headerKeys()).toEqual(['orders', 'channel', 'region']);
  });

  it('ignores a key whose column is gone', () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={COLUMNS}
        columnOrder={['orders', 'removed', 'region', 'channel']}
      />,
    );

    expect(headerKeys()).toEqual(['orders', 'region', 'channel']);
  });

  it('lands an unlisted column after the neighbour it had', () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={COLUMNS}
        // `channel` is new since this order was saved.
        columnOrder={['orders', 'region']}
      />,
    );

    // After `region`, which is where the developer put it — not swept to the end.
    expect(headerKeys()).toEqual(['orders', 'region', 'channel']);
  });

  /* ── keyboard ─────────────────────────────────────────────────────────── */

  it('moves the focused column with Alt+Arrow', () => {
    const onColumnOrderChange = vi.fn();

    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={COLUMNS}
        isColumnReorderable
        onColumnOrderChange={onColumnOrderChange}
      />,
    );

    header('channel').focus();
    fireEvent.keyDown(header('channel'), { key: 'ArrowLeft', altKey: true });

    expect(onColumnOrderChange).toHaveBeenCalledWith([
      'channel',
      'region',
      'orders',
    ]);
  });

  it('emits the full order, including columns that cannot move', () => {
    const onColumnOrderChange = vi.fn();

    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={[
          { ...COLUMNS[0], pin: 'start' },
          COLUMNS[1],
          COLUMNS[2],
          { key: 'extra', title: 'Extra' },
        ]}
        isColumnReorderable
        onColumnOrderChange={onColumnOrderChange}
      />,
    );

    header('extra').focus();
    fireEvent.keyDown(header('extra'), { key: 'ArrowLeft', altKey: true });

    // `region` is pinned and took no part, but it is still in the emitted list —
    // otherwise it would drop out of persisted state.
    expect(onColumnOrderChange).toHaveBeenCalledWith([
      'region',
      'channel',
      'extra',
      'orders',
    ]);
  });

  it('does nothing at the end of the run', () => {
    const onColumnOrderChange = vi.fn();

    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={COLUMNS}
        isColumnReorderable
        onColumnOrderChange={onColumnOrderChange}
      />,
    );

    header('region').focus();
    fireEvent.keyDown(header('region'), { key: 'ArrowLeft', altKey: true });

    expect(onColumnOrderChange).not.toHaveBeenCalled();
  });

  it('leaves a plain arrow alone', () => {
    const onColumnOrderChange = vi.fn();

    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={COLUMNS}
        isColumnReorderable
        onColumnOrderChange={onColumnOrderChange}
      />,
    );

    header('channel').focus();
    fireEvent.keyDown(header('channel'), { key: 'ArrowLeft' });

    expect(onColumnOrderChange).not.toHaveBeenCalled();
  });

  it('still sorts on Enter while reordering is on', () => {
    const onSortsChange = vi.fn();

    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={COLUMNS.map((column) => ({ ...column, isSortable: true }))}
        isColumnReorderable
        onSortsChange={onSortsChange}
      />,
    );

    header('region').focus();
    fireEvent.keyDown(header('region'), { key: 'Enter' });

    // React Aria captures Enter for its keyboard drag session; `hasAction` is
    // what re-gates that behind Alt so the sort still gets it.
    expect(onSortsChange).toHaveBeenCalledWith([
      { columnKey: 'region', direction: 'asc' },
    ]);
  });

  it('does not reorder from the resize handle', () => {
    const onColumnOrderChange = vi.fn();

    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={COLUMNS}
        isColumnReorderable
        onColumnOrderChange={onColumnOrderChange}
      />,
    );

    const resizer = header('channel').querySelector(
      '[data-element="Resizer"]',
    ) as HTMLElement;

    expect(resizer).toBeTruthy();
    // Focusing the handle focuses its column too — `focusin` bubbles, so the
    // `<th>`'s `onFocus` fires and `focusedKey` becomes `channel`. That is the
    // real path, and without it the assertion below passes for the wrong reason:
    // no focused key means nothing to move regardless of the guard.
    resizer.focus();
    fireEvent.keyDown(resizer, { key: 'ArrowLeft', altKey: true });

    // Alt+Arrow on the handle is a resize step. The collection's own capture
    // handler sits on the `<tr>` and would otherwise beat it.
    expect(onColumnOrderChange).not.toHaveBeenCalled();
  });

  /* ── wiring ───────────────────────────────────────────────────────────── */

  it('attaches drop handling to the header row', () => {
    renderWithRoot(
      <DataTable data={ROWS} columns={COLUMNS} isColumnReorderable />,
    );

    const headRow = grid().querySelector(
      'tr[data-element="HeadRow"]',
    ) as HTMLElement;
    const propsKey = Object.keys(headRow).find((key) =>
      key.startsWith('__reactProps$'),
    )!;
    const props = (headRow as any)[propsKey];

    // The drop delegate measures `[data-key]` descendants of whatever element
    // holds these. Pointed anywhere else, a column lifts but never lands.
    expect(props.onDrop).toBeTypeOf('function');
    expect(props.onDragOver).toBeTypeOf('function');
  });

  /**
   * The pointer drag itself is not covered here, or anywhere.
   *
   * React Aria's drag-and-drop ignores events that did not come from a real user
   * gesture — `src/components/data/AGENTS.md` records this, and `ItemTable`'s row
   * reorder has the same gap for the same reason. Dispatching genuine
   * `DragEvent`s with a real `DataTransfer` in headless Chromium gets as far as
   * React Aria writing the drag payload and no further: `isDragging` never
   * flips, so no drop target is ever resolved.
   *
   * What is covered instead: the drop handlers land on the right element (above),
   * the keyboard path end to end, and the order maths. The pointer path is
   * verified by hand against the `ColumnReordering` story.
   */
  it('renders no drop indicator at rest', () => {
    renderWithRoot(
      <DataTable data={ROWS} columns={COLUMNS} isColumnReorderable />,
    );

    expect(
      grid().querySelectorAll('[data-element="ColumnDropIndicator"]'),
    ).toHaveLength(0);
  });

  /* ── persistence ──────────────────────────────────────────────────────── */

  it('persists an uncontrolled order under storageKey', () => {
    const key = 'reorder-test';

    window.localStorage.removeItem(`cube-ui-kit:table:${key}`);

    const { unmount } = renderWithRoot(
      <DataTable
        data={ROWS}
        columns={COLUMNS}
        isColumnReorderable
        storageKey={key}
      />,
    );

    header('channel').focus();
    fireEvent.keyDown(header('channel'), { key: 'ArrowLeft', altKey: true });
    unmount();

    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={COLUMNS}
        isColumnReorderable
        storageKey={key}
      />,
    );

    expect(headerKeys()).toEqual(['channel', 'region', 'orders']);
    window.localStorage.removeItem(`cube-ui-kit:table:${key}`);
  });

  it('never persists a controlled order', () => {
    const key = 'reorder-controlled';

    window.localStorage.removeItem(`cube-ui-kit:table:${key}`);

    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={COLUMNS}
        isColumnReorderable
        storageKey={key}
        columnOrder={['orders', 'region', 'channel']}
        onColumnOrderChange={() => {}}
      />,
    );

    header('region').focus();
    fireEvent.keyDown(header('region'), { key: 'ArrowLeft', altKey: true });

    // A controlled order belongs to the page; storing it would fight the page on
    // the next mount.
    const stored = window.localStorage.getItem(`cube-ui-kit:table:${key}`);

    expect(stored == null || !stored.includes('columnOrder')).toBe(true);
  });
});
