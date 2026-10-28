import { userEvent as realInput } from 'vitest/browser';

import { act, renderWithRoot, screen } from '../../../test';

import { ItemTable } from './ItemTable';

import type { CubeItemTableColumn } from './types';

interface Row {
  id: string;
  name: string;
  favorite: boolean;
}
const DATA: Row[] = Array.from({ length: 220 }, (_, i) => ({
  id: `r${i}`,
  name: `Record ${i}`,
  favorite: i < 2,
}));
const SECTIONS = [
  { key: 'favorite', title: 'Favorites' },
  { key: 'other', title: 'Other items' },
];
const getSectionKey = (row: Row) => (row.favorite ? 'favorite' : 'other');
const COLUMNS: CubeItemTableColumn<Row>[] = [
  { key: 'name', title: 'Name', width: 160, isRowHeader: true },
];
const grid = () => screen.getByRole('grid');
const record = (id: string) =>
  grid().querySelector<HTMLTableRowElement>(
    `tbody tr[data-element="Row"][data-key="${id}"]`,
  );
async function key(value: string) {
  await act(() => realInput.keyboard(value));
}

describe('ItemTable section layout', () => {
  it.each(['light', 'dark'])(
    'spans pinned and scrolling columns in %s, preserving caption customization',
    async (scheme) => {
      const root = document.documentElement;
      const previous = root.dataset.scheme;
      root.dataset.scheme = scheme;
      try {
        renderWithRoot(
          <ItemTable
            data={DATA.slice(0, 4)}
            sections={SECTIONS}
            getSectionKey={getSectionKey}
            columns={[
              { ...COLUMNS[0], pin: 'start' },
              {
                key: 'value',
                title: 'Value',
                width: 700,
                render: () => 'Some value',
              },
              {
                key: 'action',
                title: 'Action',
                width: 80,
                pin: 'end',
                render: () => <button type="button">Edit</button>,
              },
            ]}
            width="360px"
            paginationMode="off"
            isAutoHeight
            isRowMoveAnimated={false}
            styles={{ SectionCell: { color: '#purple-text', height: '56px' } }}
          />,
        );
        const scroller = grid().parentElement!;
        const caption = grid().querySelector<HTMLElement>(
          '[data-element="SectionCell"]',
        )!;
        await vi.waitFor(() =>
          expect(caption.getBoundingClientRect().height).toBeGreaterThanOrEqual(
            56,
          ),
        );
        expect(caption).toHaveAttribute('colspan', '3');
        expect(
          Math.abs(
            caption.getBoundingClientRect().width -
              grid().getBoundingClientRect().width,
          ),
        ).toBeLessThanOrEqual(2);
        const color = getComputedStyle(caption).color;
        expect(color).not.toBe(getComputedStyle(grid()).color);
        await act(() => {
          scroller.scrollLeft = 240;
          scroller.dispatchEvent(new Event('scroll'));
        });
        await vi.waitFor(() =>
          expect(scroller.scrollLeft).toBeGreaterThan(200),
        );
        const label = caption.querySelector<HTMLElement>(
          '[data-element="SectionLabel"]',
        )!;
        expect(label.getBoundingClientRect().left).toBeGreaterThanOrEqual(
          scroller.getBoundingClientRect().left,
        );
        expect(label.getBoundingClientRect().right).toBeLessThanOrEqual(
          scroller.getBoundingClientRect().right,
        );
        for (const id of ['r0', 'r2']) {
          const pinned =
            record(id)!.querySelector<HTMLElement>('[data-key="name"]')!;
          expect(pinned.getBoundingClientRect().left).toBeCloseTo(
            scroller.getBoundingClientRect().left,
            0,
          );
        }
        expect(
          Math.abs(
            caption.getBoundingClientRect().width -
              grid().getBoundingClientRect().width,
          ),
        ).toBeLessThanOrEqual(2);
      } finally {
        if (previous == null) delete root.dataset.scheme;
        else root.dataset.scheme = previous;
      }
    },
  );

  it('navigates across measured section rows and virtual windows using record indices', async () => {
    renderWithRoot(
      <>
        <button type="button">Before</button>
        <ItemTable
          data={DATA}
          columns={COLUMNS}
          sections={SECTIONS}
          getSectionKey={getSectionKey}
          onRowAction={() => {}}
          width="360px"
          height="240px"
          paginationMode="off"
          isVirtualized
          overscan={2}
          isRowMoveAnimated={false}
          styles={{ SectionCell: { height: '80px' } }}
        />
      </>,
    );
    await act(() => screen.getByRole('button', { name: 'Before' }).focus());
    await key('{Tab}');
    await vi.waitFor(() => expect(record('r0')).toHaveFocus());
    await key('{ArrowDown}{ArrowDown}');
    await vi.waitFor(() => expect(record('r2')).toHaveFocus());
    expect(record('r2')).toHaveAttribute('data-row-index', '2');
    expect(record('r2')).toHaveAttribute('data-index', '4');
    const section = grid().querySelector<HTMLTableRowElement>(
      '[data-section-key="other"]',
    )!;
    await vi.waitFor(() =>
      expect(section.getBoundingClientRect().height).toBeGreaterThanOrEqual(80),
    );
    expect(record('r2')!.getBoundingClientRect().top).toBeCloseTo(
      section.getBoundingClientRect().bottom,
      0,
    );
    await key('{End}');
    await vi.waitFor(() => expect(record('r219')).toHaveFocus());
    const scroller = grid().parentElement!;
    const viewport = scroller.getBoundingClientRect();
    expect(record('r219')!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      viewport.bottom + 1,
    );
    expect(
      grid().querySelectorAll('tbody tr[data-element="Row"]').length,
    ).toBeLessThan(25);
    await key('{Home}');
    await vi.waitFor(() => expect(record('r0')).toHaveFocus());
    expect(record('r0')!.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      grid().querySelector('thead')!.getBoundingClientRect().bottom - 1,
    );
  });

  it('keeps section clicks inert while linked records and cell controls retain native targets', async () => {
    const onRowAction = vi.fn();
    const onEdit = vi.fn();
    renderWithRoot(
      <ItemTable
        data={DATA.slice(0, 4)}
        columns={[
          ...COLUMNS,
          {
            key: 'edit',
            title: 'Edit',
            render: () => (
              <button type="button" onClick={onEdit}>
                Edit
              </button>
            ),
          },
        ]}
        sections={SECTIONS}
        getSectionKey={getSectionKey}
        onRowAction={onRowAction}
        paginationMode="off"
        width="360px"
        isAutoHeight
        isRowMoveAnimated={false}
      />,
    );
    await act(() => realInput.click(screen.getByText('Other items')));
    expect(onRowAction).not.toHaveBeenCalled();
    await act(() => realInput.click(screen.getByText('Record 2')));
    expect(onRowAction).toHaveBeenLastCalledWith(DATA[2], 'r2');
    onRowAction.mockClear();
    await act(() =>
      realInput.click(screen.getAllByRole('button', { name: 'Edit' })[2]),
    );
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onRowAction).not.toHaveBeenCalled();
  });
});
