import { getCSSText, getCSSTextForNode } from '@tenphi/tasty';

import { renderWithRoot, screen } from '../../../test';

import { DataTable } from './DataTable';

import type { CubeDataTableColumn } from './types';

interface Row {
  id: string;
  region: string;
  orders: number;
}

const ROWS: Row[] = [
  { id: 'r0', region: 'eu-west-1', orders: 30 },
  { id: 'r1', region: 'us-east-1', orders: 10 },
  { id: 'r2', region: 'eu-west-2', orders: 20 },
];

const TOTAL: Row = { id: 'total', region: 'Total', orders: 60 };

const grid = () => screen.getByRole('grid');
const bodyCells = (key: string) =>
  Array.from(
    grid().querySelectorAll<HTMLElement>(
      `tbody tr[data-element="Row"]:not([data-pinned]) [data-key="${key}"]`,
    ),
  );
const totalCell = (key: string) =>
  grid().querySelector<HTMLElement>(
    `tr[data-pinned="bottom"] [data-key="${key}"]`,
  )!;

/** The CSS of the cell's OWN classes, not the table's sub-element rules. */
function ownCss(cell: HTMLElement): string {
  const own = cell.cloneNode(false) as HTMLElement;
  const host = document.createElement('div');

  host.appendChild(own);

  return getCSSTextForNode(host);
}

describe('DataTable column cellStyles', () => {
  it('resolves a token through tasty instead of dropping it inline', () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={[
          {
            key: 'region',
            title: 'Region',
            cellStyles: { color: '#surface-text-soft-2' },
          },
          { key: 'orders', title: 'Orders' },
        ]}
      />,
    );

    const [cell] = bodyCells('region');

    // The bug: spread into `style`, the token was an invalid inline value and
    // the browser discarded it, leaving no trace on the element at all.
    expect(cell.getAttribute('style') ?? '').not.toContain('surface-text');
    expect(cell.className).not.toBe('');
    expect(ownCss(cell)).toContain('color: var(--surface-text-soft-2-color)');

    // A column without styles takes no class and no anchor.
    expect(bodyCells('orders')[0].className).toBe('');
    expect(bodyCells('orders')[0]).not.toHaveAttribute('data-column-styles');
  });

  it('shares one class between every cell with equal styles', () => {
    const cellStyles = vi.fn((ctx: { rowIndex: number }) =>
      // A FRESH object per cell, the way an inline arrow returns one.
      ctx.rowIndex === 1
        ? { color: '#danger-text' }
        : { color: '#surface-text-soft' },
    );

    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={[{ key: 'region', title: 'Region', cellStyles }]}
      />,
    );

    const classes = bodyCells('region').map((cell) => cell.className);

    expect(cellStyles).toHaveBeenCalled();
    // Two distinct results, two classes — keyed on content, not identity.
    expect(classes[0]).toBe(classes[2]);
    expect(classes[1]).not.toBe(classes[0]);
    expect(ownCss(bodyCells('region')[1])).toContain(
      'color: var(--danger-text-color)',
    );
  });

  it('calls a function form per cell context, pinned rows included', () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        pinnedBottomRows={[TOTAL]}
        columns={[
          {
            key: 'region',
            title: 'Region',
            cellStyles: (ctx) =>
              ctx.section === 'pinnedBottom'
                ? { color: '#surface-text-soft-2' }
                : undefined,
          },
        ]}
      />,
    );

    expect(bodyCells('region').every((cell) => cell.className === '')).toBe(
      true,
    );
    expect(ownCss(totalCell('region'))).toContain(
      'color: var(--surface-text-soft-2-color)',
    );
  });

  it('compiles state maps against the cell itself', () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        pinnedBottomRows={[TOTAL]}
        columns={[
          {
            key: 'region',
            title: 'Region',
            cellStyles: {
              color: { '': '#surface-text', '@own(pinned=bottom)': '#purple' },
            },
          },
        ]}
      />,
    );

    const css = ownCss(totalCell('region'));

    expect(css).toContain('[data-pinned="bottom"]');
    expect(css).toContain('color: var(--purple-color)');
  });

  it('registers keyframes and rewrites the animation that names them', () => {
    renderWithRoot(
      <DataTable
        data={ROWS}
        columns={[
          {
            key: 'region',
            title: 'Region',
            cellStyles: {
              animation: 'column-flash 1s',
              '@keyframes': {
                'column-flash': {
                  from: { opacity: 0 },
                  to: { opacity: 1 },
                },
              },
            },
          },
        ]}
      />,
    );

    // Tasty reads `@keyframes` only from the top level of the object it
    // computes. Moved into the cell's sub-element along with everything else,
    // it was never registered and the animation named nothing.
    const name = /animation: (column-flash-[\w-]+) 1s/.exec(
      ownCss(bodyCells('region')[0]),
    )?.[1];

    expect(name).toBeDefined();
    expect(getCSSText()).toMatch(new RegExp(`@keyframes ${name}\\s*\\{`));
  });

  describe('on a number column', () => {
    const numeric = (
      cellStyles: CubeDataTableColumn<Row>['cellStyles'],
    ): CubeDataTableColumn<Row>[] => [
      { key: 'orders', title: 'Orders', dataType: 'number', cellStyles },
    ];

    it('applies tabular figures with no styles of its own', () => {
      renderWithRoot(<DataTable data={ROWS} columns={numeric(undefined)} />);

      expect(ownCss(bodyCells('orders')[0])).toContain(
        'font-variant-numeric: tabular-nums',
      );
    });

    it('merges an object over the tabular figures', () => {
      renderWithRoot(
        <DataTable data={ROWS} columns={numeric({ color: '#danger-text' })} />,
      );

      const css = ownCss(bodyCells('orders')[0]);

      expect(css).toContain('font-variant-numeric: tabular-nums');
      expect(css).toContain('color: var(--danger-text-color)');
    });

    it('keeps a function form, called per cell', () => {
      // The numeric default used to replace a function outright, so it was
      // never called and the total below was never dimmed.
      const cellStyles = vi.fn((ctx: { section: string }) =>
        ctx.section === 'pinnedBottom'
          ? { color: '#surface-text-soft-2' }
          : undefined,
      );

      renderWithRoot(
        <DataTable
          data={ROWS}
          pinnedBottomRows={[TOTAL]}
          columns={numeric(cellStyles)}
        />,
      );

      expect(cellStyles).toHaveBeenCalled();

      const total = ownCss(totalCell('orders'));

      expect(total).toContain('font-variant-numeric: tabular-nums');
      expect(total).toContain('color: var(--surface-text-soft-2-color)');

      const body = ownCss(bodyCells('orders')[0]);

      expect(body).toContain('font-variant-numeric: tabular-nums');
      expect(body).not.toContain('surface-text-soft-2');
    });
  });
});
