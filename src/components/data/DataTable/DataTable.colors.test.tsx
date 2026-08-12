import { renderWithRoot, screen } from '../../../test';
import { colorThemeSeed } from '../../../tokens/color-theme';

import { DataTable } from './DataTable';

import type { CubeDataTableColumn } from './types';

interface Row {
  id: string;
  region: string;
  orders: number;
  revenue: number;
}

const ROWS: Row[] = [
  { id: 'r0', region: 'eu-west-1', orders: 30, revenue: 300 },
  { id: 'r1', region: 'us-east-1', orders: 10, revenue: 100 },
  { id: 'r2', region: 'eu-west-2', orders: 20, revenue: 200 },
];

const TOTALS: Row[] = [
  { id: 'total', region: 'Total', orders: 60, revenue: 600 },
];

function columns(
  overrides: Partial<CubeDataTableColumn<Row>> = {},
): CubeDataTableColumn<Row>[] {
  return [
    { key: 'region', title: 'Region' },
    { key: 'orders', title: 'Orders', dataType: 'number', ...overrides },
    { key: 'revenue', title: 'Revenue', dataType: 'number' },
  ];
}

const grid = () => screen.getByRole('grid');
const headerTint = (key: string) =>
  grid()
    .querySelector(`thead [data-key="${key}"]`)
    ?.getAttribute('data-tint') ?? null;
const bodyTints = (key: string) =>
  Array.from(
    grid().querySelectorAll(
      // `:not([data-pinned])` matters: a pinned totals row is rendered inside
      // `<tbody>` and is a `data-element="Row"` too, so it would otherwise count
      // as a body row here.
      `tbody tr[data-element="Row"]:not([data-pinned]) [data-key="${key}"]`,
    ),
  ).map((cell) => cell.getAttribute('data-tint'));
const totalTint = (key: string) =>
  grid()
    .querySelector(`tr[data-pinned="bottom"] [data-key="${key}"]`)
    ?.getAttribute('data-tint') ?? null;

describe('DataTable column colors', () => {
  it('stamps no tint on an untinted table', () => {
    renderWithRoot(<DataTable data={ROWS} columns={columns()} />);

    expect(grid().querySelectorAll('[data-tint]')).toHaveLength(0);
  });

  it('tints the header, the cells and the totals by default', () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={columns({ color: 'success' })}
        pinnedBottomRows={TOTALS}
      />,
    );

    const slot = headerTint('orders');

    expect(slot).toMatch(/^tint-[a-z0-9]+$/);
    expect(bodyTints('orders')).toEqual([slot, slot, slot]);
    expect(totalTint('orders')).toBe(slot);

    // And nothing else is touched.
    expect(headerTint('revenue')).toBeNull();
    expect(bodyTints('revenue')).toEqual([null, null, null]);
  });

  it.each([
    ['header', { header: true, body: false, totals: false }],
    ['body', { header: false, body: true, totals: false }],
    ['totals', { header: false, body: false, totals: true }],
  ] as const)('narrows to %s with colorScope', (scope, expected) => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={columns({ color: 'success', colorScope: [scope] })}
        pinnedBottomRows={TOTALS}
      />,
    );

    expect(headerTint('orders') != null).toBe(expected.header);
    expect(bodyTints('orders')[0] != null).toBe(expected.body);
    expect(totalTint('orders') != null).toBe(expected.totals);
  });

  it('gives two columns of the same color one slot', () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={[
          { key: 'region', title: 'Region' },
          { key: 'orders', title: 'Orders', color: '#0ea5e9' },
          { key: 'revenue', title: 'Revenue', color: '#0ea5e9' },
        ]}
      />,
    );

    // Deduped by the theme's content hash, so the generated rules are written
    // once no matter how many columns share the colour.
    expect(headerTint('orders')).toBe(headerTint('revenue'));
  });

  it('gives different colors different slots', () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={[
          { key: 'region', title: 'Region' },
          { key: 'orders', title: 'Orders', color: '#0ea5e9' },
          { key: 'revenue', title: 'Revenue', color: 'danger' },
        ]}
      />,
    );

    expect(headerTint('orders')).not.toBe(headerTint('revenue'));
  });

  it('names a color spec and its resolved seed the same', () => {
    const seed = colorThemeSeed('#0ea5e9');
    const { unmount } = renderWithRoot(
      <DataTable data={ROWS} columns={columns({ color: '#0ea5e9' })} />,
    );
    const fromColor = headerTint('orders');

    unmount();

    renderWithRoot(
      <DataTable data={ROWS} columns={columns({ color: seed })} />,
    );

    // Two spellings of one colour, so one slot — and therefore one injection
    // shared across both tables rather than two.
    expect(headerTint('orders')).toBe(fromColor);
  });

  it('keeps a raw fill/text pair out of the theme machinery', () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={columns({
          color: { fill: '#note-surface', text: '#note-surface-text' },
        })}
      />,
    );

    // A distinct prefix, because nothing was derived and there is no theme to
    // name it after.
    expect(headerTint('orders')).toMatch(/^raw-[a-z0-9]+$/);
  });

  it('never tints a structural column', () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={columns({ color: 'success' })}
        showRowNumbers
      />,
    );

    const rowNumber = grid().querySelector('tbody [data-kind="row-number"]');

    expect(rowNumber).toBeTruthy();
    expect(rowNumber).not.toHaveAttribute('data-tint');
  });

  /* ── the band ─────────────────────────────────────────────────────────── */

  it('mirrors the row band onto body cells', () => {
    renderWithRoot(<DataTable data={ROWS} columns={columns()} />);

    const flags = Array.from(
      grid().querySelectorAll(
        'tbody tr[data-element="Row"]:not([data-pinned]) [data-key="orders"]',
      ),
    ).map((cell) => cell.hasAttribute('data-odd'));

    // A cell cannot read its row's mods — a sub-element's state keys resolve
    // against the table root — so a tinted column picks its band from this.
    expect(flags).toEqual([false, true, false]);
  });

  it('does not band a pinned total', () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={columns()}
        pinnedBottomRows={[...TOTALS, { ...TOTALS[0], id: 'total-2' }]}
      />,
    );

    const totals = Array.from(
      grid().querySelectorAll('tr[data-pinned="bottom"] [data-key="orders"]'),
    );

    expect(totals).toHaveLength(2);
    // The second pinned row is at an odd index but is not a banded body row.
    expect(totals.some((cell) => cell.hasAttribute('data-odd'))).toBe(false);
  });

  it('does not band when striping is off', () => {
    renderWithRoot(
      <DataTable data={ROWS} columns={columns()} isStriped={false} />,
    );

    expect(grid().querySelectorAll('tbody [data-odd]')).toHaveLength(0);
  });
});
