import { act } from 'react';
import { userEvent as realInput } from 'vitest/browser';

import { renderWithRoot, screen } from '../../../test';
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
    for (const key of ['c0', 'c99', 'c50', 'c20', 'c30', 'c75'])
      expect(cell(key)).toBeInTheDocument();
    expect(screen.getAllByRole('textbox', { name: 'Draft' })[0]).toBe(input);
    expect(input.value).toBe('draft changed');
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
