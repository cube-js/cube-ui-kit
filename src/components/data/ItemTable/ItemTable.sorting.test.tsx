import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';

import { ItemTable } from './ItemTable';

import type { CubeItemTableColumn } from './types';

interface Row {
  id: string;
  name: string;
  count: number | null;
  when: Date;
}

const ROWS: Row[] = [
  { id: '1', name: 'banana', count: 20, when: new Date('2024-03-01') },
  { id: '2', name: 'Apple', count: null, when: new Date('2024-01-01') },
  { id: '3', name: 'cherry', count: 3, when: new Date('2024-02-01') },
];

const COLUMNS: CubeItemTableColumn<Row>[] = [
  { key: 'name', title: 'Name', isRowHeader: true, isSortable: true },
  { key: 'count', title: 'Count', isSortable: true },
  { key: 'when', title: 'When', isSortable: true },
];

function names() {
  return screen
    .getAllByRole('rowheader')
    .map((cell) => cell.textContent?.trim());
}

async function clickHeader(name: string | RegExp) {
  await userEvent.click(screen.getByRole('columnheader', { name }));
}

describe('ItemTable sorting', () => {
  it('does not offer sorting on a column that did not ask for it', () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={[{ key: 'name', title: 'Name' }]} />,
    );

    const header = screen.getByRole('columnheader', { name: 'Name' });

    expect(header).not.toHaveAttribute('data-sortable');
    expect(header).toHaveAttribute('tabindex', '-1');
  });

  it('makes a sortable header a tab stop', () => {
    renderWithRoot(<ItemTable data={ROWS} columns={COLUMNS} />);

    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
      'tabindex',
      '0',
    );
  });

  it('cycles asc → desc → unsorted', async () => {
    renderWithRoot(<ItemTable data={ROWS} columns={COLUMNS} />);

    const header = () => screen.getByRole('columnheader', { name: /Name/ });

    await clickHeader(/Name/);
    await waitFor(() =>
      expect(header()).toHaveAttribute('aria-sort', 'ascending'),
    );
    // Case-insensitive, locale-aware: "Apple" before "banana".
    expect(names()).toEqual(['Apple', 'banana', 'cherry']);

    await clickHeader(/Name/);
    await waitFor(() =>
      expect(header()).toHaveAttribute('aria-sort', 'descending'),
    );
    expect(names()).toEqual(['cherry', 'banana', 'Apple']);

    await clickHeader(/Name/);
    await waitFor(() => expect(header()).not.toHaveAttribute('aria-sort'));
    // Back to the source order — the reason the cycle is tri-state.
    expect(names()).toEqual(['banana', 'Apple', 'cherry']);
  });

  it('never leaves the cycle when disallowSortRemoval is set', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={[{ ...COLUMNS[0], disallowSortRemoval: true }]}
      />,
    );

    const header = () => screen.getByRole('columnheader', { name: /Name/ });

    await clickHeader(/Name/);
    await clickHeader(/Name/);
    await waitFor(() =>
      expect(header()).toHaveAttribute('aria-sort', 'descending'),
    );

    await clickHeader(/Name/);
    await waitFor(() =>
      expect(header()).toHaveAttribute('aria-sort', 'ascending'),
    );
  });

  it('sorts by keyboard', async () => {
    renderWithRoot(<ItemTable data={ROWS} columns={COLUMNS} />);

    const header = screen.getByRole('columnheader', { name: /Name/ });

    header.focus();
    await userEvent.keyboard('{Enter}');

    await waitFor(() =>
      expect(header).toHaveAttribute('aria-sort', 'ascending'),
    );
    expect(names()).toEqual(['Apple', 'banana', 'cherry']);
  });

  it('sorts numbers numerically and puts nullish first', async () => {
    renderWithRoot(<ItemTable data={ROWS} columns={COLUMNS} />);

    await clickHeader(/Count/);

    // 3 < 20 numerically; a string sort would give "20" before "3".
    await waitFor(() => expect(names()).toEqual(['Apple', 'cherry', 'banana']));
  });

  it('sorts dates chronologically', async () => {
    renderWithRoot(<ItemTable data={ROWS} columns={COLUMNS} />);

    await clickHeader(/When/);

    await waitFor(() => expect(names()).toEqual(['Apple', 'cherry', 'banana']));
  });

  it('uses a column comparator when given one', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={[
          {
            ...COLUMNS[0],
            // Sort by name length, to prove the comparator is what runs.
            compare: (a: string, b: string) => a.length - b.length,
          },
        ]}
      />,
    );

    await clickHeader(/Name/);

    await waitFor(() => expect(names()).toEqual(['Apple', 'banana', 'cherry']));
  });

  it('honours defaultSort without a click', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        defaultSort={{ columnKey: 'count', direction: 'desc' }}
      />,
    );

    expect(names()).toEqual(['banana', 'cherry', 'Apple']);
  });

  it('reflects a controlled sort and reports changes without reordering itself', async () => {
    const onSortChange = vi.fn();

    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        sort={{ columnKey: 'name', direction: 'asc' }}
        onSortChange={onSortChange}
      />,
    );

    expect(names()).toEqual(['Apple', 'banana', 'cherry']);

    await clickHeader(/Name/);

    expect(onSortChange).toHaveBeenCalledWith({
      columnKey: 'name',
      direction: 'desc',
    });
    // Controlled: the order does not move until the parent says so.
    expect(names()).toEqual(['Apple', 'banana', 'cherry']);
  });

  it('never reorders in server mode', async () => {
    const onSortChange = vi.fn();

    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        sortMode="server"
        onSortChange={onSortChange}
      />,
    );

    await clickHeader(/Name/);

    expect(onSortChange).toHaveBeenCalledWith({
      columnKey: 'name',
      direction: 'asc',
    });
    // The query does the sorting; the table only reflects it.
    expect(names()).toEqual(['banana', 'Apple', 'cherry']);
  });

  it('removes the affordance entirely in off mode', () => {
    renderWithRoot(<ItemTable data={ROWS} columns={COLUMNS} sortMode="off" />);

    const header = screen.getByRole('columnheader', { name: /Name/ });

    expect(header).not.toHaveAttribute('data-sortable');
    expect(header).toHaveAttribute('tabindex', '-1');
  });

  it('does not mutate the data array', async () => {
    const data = [...ROWS];
    const snapshot = [...data];

    renderWithRoot(<ItemTable data={data} columns={COLUMNS} />);

    await clickHeader(/Name/);

    await waitFor(() => expect(names()).toEqual(['Apple', 'banana', 'cherry']));
    expect(data).toEqual(snapshot);
  });
});

describe('ItemTable sort indicator placement', () => {
  it('renders the arrow in the Item rightIcon slot, not the text suffix', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={[{ key: 'name', title: 'Name', isSortable: true }]}
      />,
    );

    const indicator = document.querySelector('[data-element="SortIndicator"]')!;

    // `rightIcon` is sized and centred for an icon; `suffix` is a text slot and
    // would drop the glyph onto the label's baseline.
    expect(indicator.closest('[data-element="RightIcon"]')).not.toBeNull();
    expect(indicator.closest('[data-element="Suffix"]')).toBeNull();
  });

  it('yields the slot to a custom header rightIcon', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={[
          {
            key: 'name',
            title: 'Name',
            isSortable: true,
            header: { rightIcon: <span data-qa="custom" /> },
          },
        ]}
      />,
    );

    const indicator = document.querySelector('[data-element="SortIndicator"]')!;

    // The consumer asked for that slot explicitly, so the arrow falls back to
    // the suffix rather than either one being dropped.
    expect(document.querySelector('[data-qa="custom"]')).not.toBeNull();
    expect(indicator.closest('[data-element="Suffix"]')).not.toBeNull();
  });
});
