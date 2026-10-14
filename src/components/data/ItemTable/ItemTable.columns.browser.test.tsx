import { act } from 'react';
import { page, userEvent as realInput } from 'vitest/browser';

import { renderWithRoot, screen } from '../../../test';
import { SlotProvider } from '../../../utils/react/Slots';
import { Menu } from '../../actions/Menu/Menu';
import { Root } from '../../Root';
import { DataTable } from '../DataTable/DataTable';

import { ItemTable } from './ItemTable';

import type { ComponentProps } from 'react';
import type { CubeItemTableColumn } from './types';

type Row = Record<string, string>;
const columns = (): CubeItemTableColumn<Row>[] =>
  Array.from({ length: 100 }, (_, index) => ({
    key: `c${index}`,
    title: `Column ${index}`,
    width: 150,
    isSortable: true,
  }));
const rows = (count = 2): Row[] =>
  Array.from({ length: count }, (_, index) =>
    Object.fromEntries([
      ['id', `r${index}`],
      ...Array.from({ length: 100 }, (_, column) => [
        `c${column}`,
        `Row ${index} value ${column}`,
      ]),
    ]),
  );
const grid = () => screen.getByRole('grid');
const scroller = () =>
  grid().closest<HTMLElement>('[data-element="Scroller"]')!;
const bodyRow = () =>
  grid().querySelector<HTMLTableRowElement>(
    'tbody tr[data-element="Row"][data-key]',
  )!;
const cell = (key: string) =>
  bodyRow()?.querySelector<HTMLElement>(
    `[data-element="Cell"][data-key="${key}"]`,
  );
const header = (key: string) =>
  grid().querySelector<HTMLElement>(
    `thead [data-element="HeaderCell"][data-key="${key}"]`,
  )!;
async function scrollTo(left: number, top = scroller().scrollTop) {
  await act(async () => {
    scroller().scrollLeft = left;
    scroller().scrollTop = top;
  });
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );
}

function Table({
  data = rows(),
  cols = columns(),
  ...props
}: { data?: Row[]; cols?: CubeItemTableColumn<Row>[] } & Partial<
  ComponentProps<typeof ItemTable<Row>>
>) {
  return (
    <ItemTable
      data={data}
      columns={cols}
      getRowKey={(row) => row.id}
      paginationMode="off"
      isRowMoveAnimated={false}
      width="600px"
      height="300px"
      {...props}
    />
  );
}

describe('ItemTable body column window', () => {
  it('retains cells through buffered horizontal movement and releases the refill at rest', async () => {
    renderWithRoot(<Table />);
    await vi.waitFor(() => {
      expect(cell('c0')).toBeInTheDocument();
      expect(scroller().parentElement).toHaveAttribute('data-scroll-x');
    });
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    await scrollTo(160);
    await vi.waitFor(() => expect(cell('c8')).toBeInTheDocument());
    const retained = Array.from(
      bodyRow().querySelectorAll('[data-element="Cell"]'),
    );
    await scrollTo(240);
    const moved = Array.from(
      bodyRow().querySelectorAll('[data-element="Cell"]'),
    );
    expect(moved).toHaveLength(retained.length);
    expect(moved.every((element, index) => element === retained[index])).toBe(
      true,
    );
    for (const key of ['c2', 'c3', 'c4', 'c5', 'c6']) {
      expect(cell(key)).toBeInTheDocument();
      expect(cell(key)!.getBoundingClientRect().left).toBeCloseTo(
        header(key).getBoundingClientRect().left,
        0,
      );
    }
    await vi.waitFor(() => expect(cell('c8')).not.toBeInTheDocument());
    expect(bodyRow().getBoundingClientRect().height).toBe(41);
    expect(scroller().scrollWidth).toBeGreaterThanOrEqual(15000);
  });

  it('drops the refill when vertical movement starts during a horizontal gesture', async () => {
    renderWithRoot(<Table data={rows(2000)} />);
    await vi.waitFor(() =>
      expect(scroller().parentElement).toHaveAttribute('data-scroll-x'),
    );
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    await scrollTo(160);
    await vi.waitFor(() => expect(cell('c8')).toBeInTheDocument());
    await scrollTo(160, 200);
    expect(cell('c8')).not.toBeInTheDocument();
    await scrollTo(320, 400);
    expect(cell('c8')).toBeInTheDocument();
    expect(cell('c9')).not.toBeInTheDocument();
    expect(bodyRow().getBoundingClientRect().height).toBe(41);
    expect(cell('c4')!.getBoundingClientRect().left).toBeCloseTo(
      header('c4').getBoundingClientRect().left,
      0,
    );
  });

  it('bounds wide body cells while preserving scroll extent, headers and logical indices', async () => {
    renderWithRoot(<Table data={rows(2000)} />);
    await vi.waitFor(() =>
      expect(
        bodyRow()?.querySelectorAll('[data-element="Cell"]').length,
      ).toBeLessThan(20),
    );
    expect(grid()).toHaveAttribute('aria-colcount', '100');
    expect(grid().querySelectorAll('colgroup col')).toHaveLength(100);
    expect(
      grid().querySelectorAll('thead [data-element="HeaderCell"]'),
    ).toHaveLength(100);
    expect(scroller().scrollWidth).toBeGreaterThanOrEqual(15000);
    const extent = scroller().scrollWidth;
    for (const [left, key] of [
      [6000, 'c40'],
      [14400, 'c99'],
      [0, 'c0'],
    ] as const) {
      await scrollTo(left, left === 6000 ? 1200 : 0);
      await vi.waitFor(() => expect(cell(key)).toBeInTheDocument());
      expect(cell(key)).toHaveAttribute(
        'aria-colindex',
        String(Number(key.slice(1)) + 1),
      );
      expect(
        Math.abs(
          cell(key)!.getBoundingClientRect().left -
            header(key).getBoundingClientRect().left,
        ),
      ).toBeLessThanOrEqual(1);
      expect(
        bodyRow().querySelectorAll('[data-element="Cell"]').length,
      ).toBeLessThan(20);
      expect(
        Array.from(bodyRow().cells).reduce(
          (sum, value) => sum + value.colSpan,
          0,
        ),
      ).toBe(100);
      expect(scroller().scrollWidth).toBe(extent);
    }
    await scrollTo(6000);
    await vi.waitFor(() => expect(cell('c0')).not.toBeInTheDocument());
    expect(
      bodyRow().querySelector('[data-element="ColumnSpacer"]'),
    ).toHaveAttribute('aria-hidden', 'true');
  });

  it('retains pinned, row-header, wrapping and stateful custom cells offscreen', async () => {
    const cols = columns();
    cols[0].pin = 'start';
    cols[99].pin = 'end';
    cols[50].isRowHeader = true;
    cols[20].key = 'column-gap:c6';
    cols[20].render = () => <input aria-label="Draft" defaultValue="draft" />;
    cols[30].cellStyles = { height: '180px' };
    cols[75].autoHeight = true;
    const data = rows();
    data[0].c75 = 'A wrapping value '.repeat(30);
    renderWithRoot(
      <Table data={data} cols={cols} rowLink={(row) => `/records/${row.id}`} />,
    );
    await vi.waitFor(() => expect(bodyRow()).toBeInTheDocument());
    const input = screen.getAllByRole('textbox', {
      name: 'Draft',
    })[0] as HTMLInputElement;
    await realInput.type(input, ' changed');
    const height = bodyRow().getBoundingClientRect().height;
    await scrollTo(14000);
    await vi.waitFor(() => expect(cell('c95')).toBeInTheDocument());
    for (const key of ['c0', 'c99', 'c50', 'column-gap:c6', 'c30', 'c75'])
      expect(cell(key)).toBeInTheDocument();
    expect(screen.getAllByRole('textbox', { name: 'Draft' })[0]).toBe(input);
    expect(input.value).toBe('draft changed');
    await scrollTo(0);
    expect(screen.getAllByRole('textbox', { name: 'Draft' })[0]).toBe(input);
    expect(input.value).toBe('draft changed');
    await scrollTo(14000);
    expect(bodyRow().getBoundingClientRect().height).toBe(height);
    expect(bodyRow().querySelector('[data-element="RowLink"]')).toHaveAttribute(
      'href',
      '/records/r0',
    );
    const viewport = scroller().getBoundingClientRect();
    expect(
      Math.abs(cell('c0')!.getBoundingClientRect().left - viewport.left),
    ).toBeLessThanOrEqual(3);
    expect(
      Math.abs(cell('c99')!.getBoundingClientRect().right - viewport.right),
    ).toBeLessThanOrEqual(3);
  });

  it.each([
    'disabled',
    'auto-height',
    'body-styles',
    'nested-styles',
    'cell-props',
  ] as const)('keeps complete body layout for %s', async (kind) => {
    const cols = columns();
    if (kind === 'cell-props') cols[40].cellProps = () => ({ colSpan: 2 });
    renderWithRoot(
      <Table
        cols={cols}
        isVirtualized={kind === 'disabled' ? false : 'auto'}
        isAutoHeight={kind === 'auto-height'}
        cellStyles={
          kind === 'body-styles' ? { whiteSpace: 'normal' } : undefined
        }
        styles={
          kind === 'nested-styles'
            ? { Cell: { whiteSpace: 'normal' } }
            : undefined
        }
      />,
    );
    await vi.waitFor(() =>
      expect(bodyRow()?.querySelectorAll('[data-element="Cell"]')).toHaveLength(
        100,
      ),
    );
    await scrollTo(6000);
    expect(bodyRow().querySelectorAll('[data-element="Cell"]')).toHaveLength(
      100,
    );
    expect(
      bodyRow().querySelector('[data-element="ColumnSpacer"]'),
    ).not.toBeInTheDocument();
  });

  it('preserves row height through loading and complete-body transitions', async () => {
    const { rerender } = renderWithRoot(<Table isVirtualized={false} />);
    const height = bodyRow().getBoundingClientRect().height;
    rerender(<Table />);
    await vi.waitFor(() =>
      expect(
        bodyRow().querySelectorAll('[data-element="Cell"]').length,
      ).toBeLessThan(20),
    );
    expect(bodyRow().getBoundingClientRect().height).toBe(height);
    await scrollTo(6000);
    expect(bodyRow().getBoundingClientRect().height).toBe(height);
    rerender(<Table data={[]} isLoading skeletonRowCount={2} />);
    await vi.waitFor(() =>
      expect(grid().querySelectorAll('tr[data-placeholder]')).toHaveLength(2),
    );
    const placeholder = grid().querySelector<HTMLTableRowElement>(
      'tr[data-placeholder]',
    )!;
    expect(placeholder.getBoundingClientRect().height).toBe(height);
    expect(
      placeholder.querySelectorAll('[data-element="Cell"]').length,
    ).toBeLessThan(20);
    expect(
      Array.from(placeholder.cells).reduce((sum, td) => sum + td.colSpan, 0),
    ).toBe(100);
    rerender(<Table />);
    await vi.waitFor(() => expect(cell('c40')).toBeInTheDocument());
    expect(bodyRow().getBoundingClientRect().height).toBe(height);
  });

  it('keeps intrinsic text height with compact rows and empty visible cells', async () => {
    const data = [
      Object.fromEntries([
        ['id', 'r0'],
        ...columns().map((col) => [col.key, {}]),
        ['c95', 'Text'],
      ]),
    ];
    renderWithRoot(
      <ItemTable
        data={data}
        columns={columns()}
        getRowKey={(row) => row.id}
        paginationMode="off"
        isRowMoveAnimated={false}
        rowHeight={18}
        width="600px"
        height="300px"
      />,
    );
    await vi.waitFor(() =>
      expect(bodyRow()?.querySelectorAll('[data-element="Cell"]')).toHaveLength(
        100,
      ),
    );
    const height = bodyRow().getBoundingClientRect().height;
    expect(height).toBeGreaterThan(19);
    await scrollTo(14000);
    expect(bodyRow().getBoundingClientRect().height).toBe(height);
  });

  it.each(['typography', 'size', 'relative'] as const)(
    'uses inherited %s tokens and refreshes eligibility when they change',
    async (kind) => {
      const data = [
        Object.fromEntries([
          ['id', 'r0'],
          ...columns().map((col) => [col.key, {}]),
          ['c95', 'Text'],
        ]),
      ];
      const token = kind === 'typography' ? '$t3-line-height' : '$size-lg';
      const value =
        kind === 'typography' ? '48px' : kind === 'relative' ? '25%' : '18px';
      const content = <Table data={data} />;
      const { rerender } = renderWithRoot(<Root>{content}</Root>);
      await vi.waitFor(() =>
        expect(
          bodyRow()?.querySelectorAll('[data-element="Cell"]').length,
        ).toBeLessThan(20),
      );
      rerender(<Root tokens={{ [token]: value }}>{content}</Root>);
      await vi.waitFor(() =>
        expect(
          bodyRow().querySelectorAll('[data-element="Cell"]'),
        ).toHaveLength(100),
      );
      const height = bodyRow().getBoundingClientRect().height;
      expect(height).toBe(kind === 'typography' ? 49 : 21);
      await scrollTo(14000);
      expect(bodyRow().getBoundingClientRect().height).toBe(height);
      rerender(<Root>{content}</Root>);
      await vi.waitFor(() =>
        expect(
          bodyRow().querySelectorAll('[data-element="Cell"]').length,
        ).toBeLessThan(20),
      );
      expect(bodyRow().getBoundingClientRect().height).toBe(41);
    },
  );

  it('preserves default text-slot customization when a provider changes', async () => {
    const data = [
      Object.fromEntries([
        ['id', 'r0'],
        ...columns().map((col) => [col.key, {}]),
        ['c95', 'Text'],
      ]),
    ];
    const content = <Table data={data} />;
    const { rerender } = renderWithRoot(<SlotProvider>{content}</SlotProvider>);
    await vi.waitFor(() =>
      expect(
        bodyRow()?.querySelectorAll('[data-element="Cell"]').length,
      ).toBeLessThan(20),
    );
    rerender(
      <SlotProvider slots={{ text: { styles: { lineHeight: '48px' } } }}>
        {content}
      </SlotProvider>,
    );
    await vi.waitFor(() =>
      expect(bodyRow().querySelectorAll('[data-element="Cell"]')).toHaveLength(
        100,
      ),
    );
    const height = bodyRow().getBoundingClientRect().height;
    expect(height).toBe(49);
    await scrollTo(14000);
    expect(bodyRow().getBoundingClientRect().height).toBe(height);
    rerender(<SlotProvider>{content}</SlotProvider>);
    await vi.waitFor(() =>
      expect(
        bodyRow().querySelectorAll('[data-element="Cell"]').length,
      ).toBeLessThan(20),
    );
    expect(bodyRow().getBoundingClientRect().height).toBe(41);
  });

  it('refreshes responsive typography even when the scroller size stays fixed', async () => {
    const width = window.innerWidth,
      height = window.innerHeight;
    try {
      await page.viewport(1200, 800);
      const data = [
        Object.fromEntries([
          ['id', 'r0'],
          ...columns().map((col) => [col.key, {}]),
          ['c95', 'Text'],
        ]),
      ];
      renderWithRoot(
        <>
          <style>{`[data-qa="ResponsiveColumnScope"] {--t3-line-height:20px} @media(max-width:1000px) {[data-qa="ResponsiveColumnScope"] {--t3-line-height:48px}}`}</style>
          <div data-qa="ResponsiveColumnScope">
            <Table data={data} />
          </div>
        </>,
      );
      await vi.waitFor(() =>
        expect(
          bodyRow()?.querySelectorAll('[data-element="Cell"]').length,
        ).toBeLessThan(20),
      );
      expect(bodyRow().getBoundingClientRect().height).toBe(41);
      const scrollerWidth = scroller().clientWidth;
      await act(() => page.viewport(900, 800));
      await vi.waitFor(() =>
        expect(
          bodyRow().querySelectorAll('[data-element="Cell"]'),
        ).toHaveLength(100),
      );
      expect(scroller().clientWidth).toBe(scrollerWidth);
      expect(bodyRow().getBoundingClientRect().height).toBe(49);
      await scrollTo(14000);
      expect(bodyRow().getBoundingClientRect().height).toBe(49);
    } finally {
      await page.viewport(width, height);
    }
  });

  it('aligns the final body column when an omitted run exceeds native colspan', async () => {
    const cols = Array.from({ length: 1100 }, (_, index) => ({
      key: `c${index}`,
      title: `Column ${index}`,
      width: 150,
    }));
    const data = [
      Object.fromEntries([
        ['id', 'r0'],
        ...cols.map((col) => [col.key, col.key]),
      ]),
    ];
    renderWithRoot(<Table data={data} cols={cols} />);
    await vi.waitFor(() =>
      expect(
        bodyRow()?.querySelectorAll('[data-element="Cell"]').length,
      ).toBeLessThan(20),
    );
    expect(
      Array.from(bodyRow().cells).reduce((sum, td) => sum + td.colSpan, 0),
    ).toBe(1100);
    await scrollTo(scroller().scrollWidth);
    await vi.waitFor(() => expect(cell('c1099')).toBeInTheDocument());
    expect(
      Math.abs(
        cell('c1099')!.getBoundingClientRect().left -
          header('c1099').getBoundingClientRect().left,
      ),
    ).toBeLessThanOrEqual(1);
  });

  it('keeps row selection, actions and menu controls usable while windowed', async () => {
    const onSelectionChange = vi.fn(),
      onRowAction = vi.fn(),
      onRowMenuAction = vi.fn();
    renderWithRoot(
      <Table
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
        onRowAction={onRowAction}
        rowContextMenu
        rowMenu={<Menu.Item key="inspect">Inspect record</Menu.Item>}
        onRowMenuAction={onRowMenuAction}
      />,
    );
    await scrollTo(6000);
    await act(() =>
      realInput.click(
        bodyRow().querySelector<HTMLElement>('[data-kind="selection"] input')!,
      ),
    );
    await vi.waitFor(() =>
      expect(onSelectionChange).toHaveBeenCalledWith(
        ['r0'],
        [expect.objectContaining({ id: 'r0' })],
      ),
    );
    expect(onRowAction).not.toHaveBeenCalled();
    await scrollTo(6000);
    await vi.waitFor(() => expect(cell('c40')).toBeInTheDocument());
    await act(() => realInput.click(cell('c40')!));
    expect(onRowAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'r0' }),
      'r0',
    );
    await act(() =>
      realInput.click(
        bodyRow().querySelector<HTMLElement>('[data-kind="actions"] button')!,
      ),
    );
    await vi.waitFor(() =>
      expect(
        screen.getByRole('menuitem', { name: 'Inspect record' }),
      ).toBeInTheDocument(),
    );
    await act(() =>
      realInput.click(screen.getByRole('menuitem', { name: 'Inspect record' })),
    );
    expect(onRowMenuAction).toHaveBeenCalledWith(
      'inspect',
      expect.objectContaining({ id: 'r0' }),
      'r0',
    );
  });

  it('reorders a focused DataTable header with the native keyboard delegate', async () => {
    const onColumnOrderChange = vi.fn();
    renderWithRoot(
      <DataTable
        data={rows()}
        columns={columns()}
        getRowKey={(row) => row.id}
        width="600px"
        height="300px"
        isRowMoveAnimated={false}
        isColumnReorderable
        onColumnOrderChange={onColumnOrderChange}
      />,
    );
    await scrollTo(6000);
    await act(async () => header('c40').focus());
    await act(() => realInput.keyboard('{Alt>}{ArrowRight}{/Alt}'));
    await vi.waitFor(() => expect(onColumnOrderChange).toHaveBeenCalled());
    const order = onColumnOrderChange.mock.lastCall![0];
    expect(order.slice(40, 42)).toEqual(['c41', 'c40']);
    expect(cell('c40')).toHaveAttribute('aria-colindex', '42');
    expect(
      Math.abs(
        cell('c40')!.getBoundingClientRect().left -
          header('c40').getBoundingClientRect().left,
      ),
    ).toBeLessThanOrEqual(1);
  });

  it('keeps offscreen header focus and keyboard resizing aligned with the body', async () => {
    renderWithRoot(<Table isResizable />);
    await vi.waitFor(() => expect(cell('c0')).toBeInTheDocument());
    const target = header('c80');
    await act(async () => target.focus());
    await vi.waitFor(() => expect(cell('c80')).toBeInTheDocument());
    await act(() => realInput.keyboard('{Enter}'));
    await vi.waitFor(() =>
      expect(target).toHaveAttribute('aria-sort', 'ascending'),
    );
    const handle = target.querySelector<HTMLElement>(
      '[data-element="Resizer"]',
    )!;
    await act(async () => handle.focus());
    const width = target.getBoundingClientRect().width;
    await act(() => realInput.keyboard('{ArrowRight}'));
    await vi.waitFor(() =>
      expect(target.getBoundingClientRect().width).toBe(width + 8),
    );
    expect(cell('c80')!.getBoundingClientRect().width).toBe(width + 8);
    await scrollTo(0);
    expect(target).toBeInTheDocument();
    expect(document.activeElement).toBe(handle);
  });

  it('tracks reordered columns and data replacement after horizontal scrolling', async () => {
    const cols = columns();
    const data = rows();
    const { rerender } = renderWithRoot(<Table cols={cols} data={data} />);
    await scrollTo(6000);
    await vi.waitFor(() =>
      expect(cell('c40')).toHaveTextContent('Row 0 value 40'),
    );
    const next = [...cols].reverse();
    const replacement = data.map((row) => ({
      ...row,
      c59: 'Replacement value',
    }));
    rerender(<Table cols={next} data={replacement} />);
    await vi.waitFor(() =>
      expect(cell('c59')).toHaveTextContent('Replacement value'),
    );
    expect(cell('c59')).toHaveAttribute('aria-colindex', '41');
    expect(
      Math.abs(
        cell('c59')!.getBoundingClientRect().left -
          header('c59').getBoundingClientRect().left,
      ),
    ).toBeLessThanOrEqual(1);
  });

  it('windows from the inline start in RTL', async () => {
    renderWithRoot(
      <div dir="rtl">
        <Table />
      </div>,
    );
    await vi.waitFor(() => expect(cell('c0')).toBeInTheDocument());
    await scrollTo(-6000);
    await vi.waitFor(() => expect(cell('c40')).toBeInTheDocument());
    expect(cell('c0')).not.toBeInTheDocument();
    expect(
      Math.abs(
        cell('c40')!.getBoundingClientRect().right -
          header('c40').getBoundingClientRect().right,
      ),
    ).toBeLessThanOrEqual(1);
  });

  it('keeps tree disclosure mounted outside the ordinary column window', async () => {
    const data = rows();
    renderWithRoot(
      <Table
        data={[data[0]]}
        treeColumnKey="c50"
        getRowChildren={(row) => (row.id === 'r0' ? [data[1]] : undefined)}
      />,
    );
    const treegrid = screen.getByRole('treegrid');
    const root =
      treegrid.querySelector<HTMLTableRowElement>('tr[data-key="r0"]')!;
    await vi.waitFor(() =>
      expect(root.querySelector('[data-key="c50"]')).toBeInTheDocument(),
    );
    await act(async () => root.focus());
    await act(() => realInput.keyboard('{ArrowRight}'));
    await vi.waitFor(() =>
      expect(treegrid.querySelector('tr[data-key="r1"]')).toBeInTheDocument(),
    );
    await act(async () => {
      treegrid.closest<HTMLElement>('[data-element="Scroller"]')!.scrollLeft =
        14000;
    });
    await vi.waitFor(() =>
      expect(root.querySelector('[data-key="c95"]')).toBeInTheDocument(),
    );
    expect(
      root.querySelector('[data-key="c50"] [data-element="TreeContent"]'),
    ).toBeInTheDocument();
  });

  it('measures a newly visible overflowing label after horizontal settlement', async () => {
    const data = rows();
    data[0].c40 = 'Overflowing column text '.repeat(6);
    renderWithRoot(<Table data={data} />);
    await scrollTo(6000);
    await vi.waitFor(() => expect(cell('c40')).toBeInTheDocument());
    await act(() => realInput.hover(header('c40')));
    await act(() => realInput.hover(cell('c40')!));
    await vi.waitFor(
      () =>
        expect(screen.getByRole('tooltip')).toHaveTextContent(
          'Overflowing column text',
        ),
      { timeout: 3000 },
    );
  });

  it('preserves grouped headers and copies a range across unmounted columns and pinned totals', async () => {
    const data = rows();
    const copied: Record<string, string> = {};
    renderWithRoot(
      <DataTable
        data={data}
        columns={[{ key: 'group', title: 'All columns', children: columns() }]}
        getRowKey={(row) => row.id}
        width="600px"
        height="300px"
        pinnedBottomRows={[data[0]]}
        isRowMoveAnimated={false}
        selectedCellRange={{
          fromRowKey: 'r0',
          toRowKey: 'pinnedBottom:r0',
          fromColumnKey: 'c0',
          toColumnKey: 'c99',
        }}
      />,
    );
    await vi.waitFor(() =>
      expect(
        bodyRow()?.querySelectorAll('[data-element="Cell"]').length,
      ).toBeLessThan(20),
    );
    expect(
      grid().querySelector('[data-element="HeaderGroupCell"]'),
    ).toHaveAttribute('colspan', '100');
    await scrollTo(6000);
    await vi.waitFor(() => expect(cell('c40')).toBeInTheDocument());
    const event = new Event('copy', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', {
      value: {
        setData: (type: string, value: string) => {
          copied[type] = value;
        },
      },
    });
    scroller().dispatchEvent(event);
    await vi.waitFor(() =>
      expect(copied['text/plain']).toContain('Row 0 value 99'),
    );
    expect(copied['text/plain'].split('\n')[0].split('\t')).toHaveLength(100);
    expect(
      grid().querySelector('tr[data-pinned="bottom"] [data-key="c40"]'),
    ).toBeInTheDocument();
    expect(cell('c0')).not.toBeInTheDocument();
  });
});
