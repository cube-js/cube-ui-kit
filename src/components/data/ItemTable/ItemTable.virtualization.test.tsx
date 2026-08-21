import { renderWithRoot, screen, within } from '../../../test';

import { ItemTable } from './ItemTable';

import type { CubeItemTableColumn } from './types';

interface Row {
  id: string;
  name: string;
}

const COLUMNS: CubeItemTableColumn<Row>[] = [
  { key: 'name', title: 'Name', isRowHeader: true },
];

const makeRows = (count: number): Row[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `row-${i}`,
    name: `row-${i}`,
  }));

function bodyRows(): HTMLElement[] {
  return Array.from(
    screen.getByRole('grid').querySelectorAll('tbody tr[data-element="Row"]'),
  );
}

function spacers(): HTMLElement[] {
  return Array.from(
    screen.getByRole('grid').querySelectorAll('tr[data-spacer]'),
  );
}

/**
 * Rows on the virtualized path carry `data-index` (the virtualizer reads it off
 * the node to map a measurement back to its row). Its presence is the reliable
 * signal that the virtualized branch rendered — unlike the window size, which
 * jsdom cannot produce.
 */
function isVirtualizedPath() {
  return bodyRows().every((row) => row.hasAttribute('data-index'));
}

/**
 * jsdom reports every element as zero-sized, so the virtualizer cannot compute a
 * meaningful window — it mounts everything. These therefore assert the wiring
 * that does not depend on layout: which branch renders, ARIA bookkeeping, and
 * the spacer contract.
 *
 * The behaviour that needs real layout — the window following the scroll, and
 * variable-height rows being measured — is verified in Storybook against
 * 10,000 uniform rows and 2,000 wrapping rows.
 */
describe('ItemTable virtualization', () => {
  it('renders the plain path below the threshold', () => {
    renderWithRoot(<ItemTable data={makeRows(20)} columns={COLUMNS} />);

    expect(bodyRows()).toHaveLength(20);
    expect(spacers()).toHaveLength(0);
    expect(isVirtualizedPath()).toBe(false);
  });

  it('switches to the virtualized path above the threshold', () => {
    renderWithRoot(
      <ItemTable data={makeRows(200)} columns={COLUMNS} paginationMode="off" />,
    );

    expect(isVirtualizedPath()).toBe(true);
  });

  it('keeps aria-rowcount at the full dataset while virtualized', () => {
    renderWithRoot(
      <ItemTable
        data={makeRows(200)}
        columns={COLUMNS}
        ariaLabel="Rows"
        paginationMode="off"
      />,
    );

    // The count describes the data, not the DOM — that is the whole point of
    // `aria-rowcount` on a virtualized grid.
    expect(screen.getByRole('grid', { name: 'Rows' })).toHaveAttribute(
      'aria-rowcount',
      '201',
    );
  });

  it('keeps aria-rowindex document-absolute for the mounted window', () => {
    renderWithRoot(
      <ItemTable data={makeRows(200)} columns={COLUMNS} paginationMode="off" />,
    );

    for (const row of bodyRows()) {
      const key = row.getAttribute('data-key')!;
      const index = Number(key.replace('row-', ''));

      // 1 header row + the row's own position in the data.
      expect(row).toHaveAttribute('aria-rowindex', String(index + 2));
    }
  });

  it('hides spacer rows from assistive tech', () => {
    renderWithRoot(
      <ItemTable data={makeRows(200)} columns={COLUMNS} paginationMode="off" />,
    );

    // A spacer carries no data; announcing it would invent rows that are not
    // there. `aria-hidden` also keeps it out of the accessible row list.
    for (const spacer of spacers()) {
      expect(spacer).toHaveAttribute('aria-hidden', 'true');
    }

    const announced = within(screen.getByRole('grid')).getAllByRole('row');

    expect(announced.length).toBe(bodyRows().length + 1);
  });

  it('can be forced off', () => {
    renderWithRoot(
      <ItemTable
        data={makeRows(200)}
        columns={COLUMNS}
        paginationMode="off"
        isVirtualized={false}
      />,
    );

    expect(bodyRows()).toHaveLength(200);
    expect(spacers()).toHaveLength(0);
    expect(isVirtualizedPath()).toBe(false);
  });

  it('can be forced on below the threshold', () => {
    renderWithRoot(
      <ItemTable data={makeRows(10)} columns={COLUMNS} isVirtualized />,
    );

    expect(isVirtualizedPath()).toBe(true);
  });

  it('turns virtualization off in auto-height mode', () => {
    renderWithRoot(
      <ItemTable
        data={makeRows(100)}
        columns={COLUMNS}
        paginationMode="off"
        isVirtualized
        isAutoHeight
      />,
    );

    expect(bodyRows()).toHaveLength(100);
    expect(isVirtualizedPath()).toBe(false);
  });

  it('honours a custom threshold', () => {
    renderWithRoot(
      <ItemTable
        data={makeRows(20)}
        columns={COLUMNS}
        virtualizeThreshold={5}
      />,
    );

    expect(isVirtualizedPath()).toBe(true);
  });

  it('never virtualizes the empty, error or loading states', () => {
    const { rerender } = renderWithRoot(
      <ItemTable data={[]} columns={COLUMNS} emptyLabel="Nothing" />,
    );

    expect(screen.getByText('Nothing')).toBeInTheDocument();
    expect(spacers()).toHaveLength(0);

    rerender(
      <ItemTable
        data={makeRows(200)}
        columns={COLUMNS}
        paginationMode="off"
        error="Boom"
      />,
    );

    // An error replaces the rows outright, so there is nothing to virtualize.
    expect(screen.getByText('Boom')).toBeInTheDocument();
    expect(spacers()).toHaveLength(0);
  });

  it('keys mounted rows by identity, not index', () => {
    renderWithRoot(
      <ItemTable data={makeRows(200)} columns={COLUMNS} paginationMode="off" />,
    );

    const keys = bodyRows().map((row) => row.getAttribute('data-key'));

    // Index keys would make the virtualizer hand a recycled node to a different
    // row, leaking the previous row's state into it.
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.every((key) => key?.startsWith('row-'))).toBe(true);
  });

  it('does not virtualize a paginated page that fits under the threshold', () => {
    renderWithRoot(<ItemTable data={makeRows(200)} columns={COLUMNS} />);

    // Default pagination shows 50 rows, so there is nothing to virtualize —
    // paging and virtualization are alternatives, not a stack.
    expect(bodyRows()).toHaveLength(50);
    expect(isVirtualizedPath()).toBe(false);
  });

  it('survives the data shrinking under the window', () => {
    const { rerender } = renderWithRoot(
      <ItemTable
        data={makeRows(200)}
        columns={COLUMNS}
        ariaLabel="Rows"
        paginationMode="off"
      />,
    );

    rerender(
      <ItemTable
        data={makeRows(3)}
        columns={COLUMNS}
        ariaLabel="Rows"
        paginationMode="off"
      />,
    );

    expect(bodyRows()).toHaveLength(3);
    expect(screen.getByRole('grid', { name: 'Rows' })).toHaveAttribute(
      'aria-rowcount',
      '4',
    );
  });
});
