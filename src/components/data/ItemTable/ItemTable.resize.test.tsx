import { fireEvent } from '@testing-library/react';
import { useState } from 'react';

import { renderWithRoot, screen, waitFor } from '../../../test';

import { ItemTable } from './ItemTable';

import type { CubeItemTableColumn } from './types';

interface Row {
  id: string;
  name: string;
  region: string;
}

const COLUMNS: CubeItemTableColumn<Row>[] = [
  { key: 'name', title: 'Name', isRowHeader: true, minWidth: 100 },
  { key: 'region', title: 'Region', minWidth: 100, maxWidth: 300 },
];

const ROWS: Row[] = [{ id: 'r0', name: 'row-0', region: 'us-east-1' }];

/**
 * Widths only resolve once the scroller has been measured, and jsdom reports
 * every element as zero-sized. Nothing about the resize maths is layout
 * dependent beyond that one number, so it is supplied directly.
 */
let clientWidthSpy: ReturnType<typeof vi.spyOn> | undefined;

beforeEach(() => {
  clientWidthSpy = vi
    .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
    .mockReturnValue(600);
});

afterEach(() => clientWidthSpy?.mockRestore());

const resizers = () =>
  Array.from(
    screen.getByRole('grid').querySelectorAll('[data-element="Resizer"]'),
  ) as HTMLElement[];
const colWidths = () =>
  Array.from(screen.getByRole('grid').querySelectorAll('colgroup col')).map(
    (col) => Math.round(parseFloat((col as HTMLElement).style.width || '0')),
  );

/** `useMove` turns each arrow press into a start/move/end cycle. */
function pressArrow(element: HTMLElement, key: 'ArrowLeft' | 'ArrowRight') {
  fireEvent.keyDown(element, { key });
}

describe('ItemTable column resize', () => {
  it('adds no handle unless asked', () => {
    renderWithRoot(<ItemTable data={ROWS} columns={COLUMNS} />);

    expect(resizers()).toHaveLength(0);
  });

  it('adds a handle per resizable column', () => {
    renderWithRoot(<ItemTable isResizable data={ROWS} columns={COLUMNS} />);

    expect(resizers()).toHaveLength(2);
    expect(resizers()[0]).toHaveAttribute('role', 'separator');
    expect(resizers()[0]).toHaveAttribute('aria-orientation', 'vertical');
    // Focusable, because the whole point is that it works from the keyboard.
    expect(resizers()[0]).toHaveAttribute('tabindex', '0');
  });

  it('lets a column opt out', () => {
    renderWithRoot(
      <ItemTable
        isResizable
        data={ROWS}
        columns={[COLUMNS[0], { ...COLUMNS[1], isResizable: false }]}
      />,
    );

    expect(resizers()).toHaveLength(1);
    expect(resizers()[0].closest('th')).toHaveAttribute('data-key', 'name');
  });

  it('lets a resizable header cell show its straddling handle', () => {
    renderWithRoot(
      <ItemTable
        isResizable
        data={ROWS}
        columns={[COLUMNS[0], { ...COLUMNS[1], isResizable: false }]}
      />,
    );

    const cells = screen.getByRole('grid').querySelectorAll('thead th');

    // The handle is centred on the boundary, so the half outside the cell
    // would be clipped by the default `overflow: hidden`. Only cells that have
    // one opt out of clipping.
    expect(cells[0]).toHaveAttribute('data-resizable');
    expect(cells[1]).not.toHaveAttribute('data-resizable');
  });

  it('exposes the current width to assistive tech', () => {
    renderWithRoot(<ItemTable isResizable data={ROWS} columns={COLUMNS} />);

    expect(resizers()[0]).toHaveAttribute('aria-valuemin', '100');
    expect(resizers()[1]).toHaveAttribute('aria-valuemax', '300');
    expect(resizers()[0].getAttribute('aria-valuenow')).not.toBeNull();
  });

  it('narrows and widens with the arrow keys', async () => {
    renderWithRoot(<ItemTable isResizable data={ROWS} columns={COLUMNS} />);

    const before = colWidths()[0];

    pressArrow(resizers()[0], 'ArrowLeft');

    await waitFor(() => expect(colWidths()[0]).toBeLessThan(before));

    const narrowed = colWidths()[0];

    pressArrow(resizers()[0], 'ArrowRight');

    await waitFor(() => expect(colWidths()[0]).toBeGreaterThan(narrowed));
  });

  it('never goes below minWidth', async () => {
    renderWithRoot(<ItemTable isResizable data={ROWS} columns={COLUMNS} />);

    for (let i = 0; i < 80; i++) pressArrow(resizers()[0], 'ArrowLeft');

    await waitFor(() => expect(colWidths()[0]).toBe(100));
  });

  it('never goes above maxWidth', async () => {
    renderWithRoot(<ItemTable isResizable data={ROWS} columns={COLUMNS} />);

    for (let i = 0; i < 80; i++) pressArrow(resizers()[1], 'ArrowRight');

    await waitFor(() => expect(colWidths()[1]).toBe(300));
  });

  it('jumps to the bounds with Home and End', async () => {
    renderWithRoot(<ItemTable isResizable data={ROWS} columns={COLUMNS} />);

    fireEvent.keyDown(resizers()[1], { key: 'Home' });
    await waitFor(() => expect(colWidths()[1]).toBe(100));

    fireEvent.keyDown(resizers()[1], { key: 'End' });
    await waitFor(() => expect(colWidths()[1]).toBe(300));
  });

  it('reports the settled width once, not per step', async () => {
    const onColumnResize = vi.fn();

    renderWithRoot(
      <ItemTable
        isResizable
        data={ROWS}
        columns={COLUMNS}
        onColumnResize={onColumnResize}
      />,
    );

    pressArrow(resizers()[0], 'ArrowLeft');

    await waitFor(() => expect(onColumnResize).toHaveBeenCalledTimes(1));

    const [key, width, all] = onColumnResize.mock.calls[0];

    expect(key).toBe('name');
    expect(typeof width).toBe('number');
    expect(all).toHaveProperty('name', width);
  });

  describe('controlled widths', () => {
    function Controlled() {
      const [widths, setWidths] = useState<Record<string, number>>({
        name: 250,
      });

      return (
        <ItemTable
          isResizable
          data={ROWS}
          columns={COLUMNS}
          columnWidths={widths}
          onColumnResize={(_key, _width, all) => setWidths(all)}
        />
      );
    }

    it('keeps the width a controlled consumer echoes back', async () => {
      renderWithRoot(<Controlled />);

      expect(colWidths()[0]).toBe(250);

      pressArrow(resizers()[0], 'ArrowLeft');

      await waitFor(() => expect(colWidths()[0]).toBeLessThan(250));
    });

    it('reverts when the consumer ignores the callback', async () => {
      renderWithRoot(
        <ItemTable
          isResizable
          data={ROWS}
          columns={COLUMNS}
          columnWidths={{ name: 250 }}
          onColumnResize={() => {}}
        />,
      );

      pressArrow(resizers()[0], 'ArrowLeft');

      // Being controlled means the prop wins. A pointer drag still tracks the
      // cursor while it is in flight; it is the settled value that reverts.
      await waitFor(() => expect(colWidths()[0]).toBe(250));
    });
  });

  it('starts from defaultColumnWidths', () => {
    renderWithRoot(
      <ItemTable
        isResizable
        data={ROWS}
        columns={COLUMNS}
        defaultColumnWidths={{ name: 220 }}
      />,
    );

    expect(colWidths()[0]).toBe(220);
  });

  it('persists widths under a storageKey', async () => {
    localStorage.clear();

    const { unmount } = renderWithRoot(
      <ItemTable
        isResizable
        data={ROWS}
        columns={COLUMNS}
        storageKey="widths"
      />,
    );

    fireEvent.keyDown(resizers()[0], { key: 'Home' });

    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem('cube-ui-kit:table:widths') ?? '{}')
          .columnWidths?.name,
      ).toBe(100),
    );

    unmount();

    renderWithRoot(
      <ItemTable
        isResizable
        data={ROWS}
        columns={COLUMNS}
        storageKey="widths"
      />,
    );

    expect(colWidths()[0]).toBe(100);
  });
});
