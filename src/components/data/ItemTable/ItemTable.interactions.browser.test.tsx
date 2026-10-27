import { cdp, userEvent as realInput } from 'vitest/browser';

import { act, render, renderWithRoot, screen } from '../../../test';
import { Menu } from '../../actions/Menu/Menu';
import { Root } from '../../Root';

import { ItemTable } from './ItemTable';

import type { CubeItemTableColumn } from './types';

interface Row {
  id: string;
  name: string;
  description: string;
}

const ROWS: Row[] = Array.from({ length: 60 }, (_, index) => ({
  id: `r${index}`,
  name: `Record ${index}`,
  description: `Description ${index}`,
}));
const COLUMNS: CubeItemTableColumn<Row>[] = [
  { key: 'name', title: 'Name', isRowHeader: true, width: 180 },
  { key: 'description', title: 'Description', width: 200 },
];
const LONG_TEXT =
  'A complete description that is much too long to fit inside this narrow table cell';
const grid = () => screen.getByRole('grid');
const row = (key: string) =>
  grid().querySelector<HTMLTableRowElement>(
    `tbody tr[data-element="Row"][data-key="${key}"]`,
  )!;
const cell = (key: string, column: string) =>
  row(key).querySelector<HTMLElement>(`[data-key="${column}"]`)!;
const label = (key: string, column: string) =>
  cell(key, column).querySelector<HTMLElement>('[data-qa="TextItem"]')!;

async function key(input: string) {
  await act(() => realInput.keyboard(input));
}

async function click(element: Element) {
  await act(() => realInput.click(element));
}

async function hover(element: Element) {
  await act(() => realInput.hover(element));
}

async function enterTable() {
  await act(() => screen.getByRole('button', { name: 'Before' }).focus());
  await key('{Tab}');
  await vi.waitFor(() => expect(row('r0')).toHaveFocus());
}

/** CDP coordinates include Vitest's iframe and its possible scale. */
function nativePosition(x: number, y: number) {
  const frame = window.frameElement as HTMLElement | null;
  const bounds = frame?.getBoundingClientRect();
  return {
    x:
      (bounds?.left ?? 0) +
      (x + (frame?.clientLeft ?? 0)) *
        (bounds && frame ? bounds.width / frame.offsetWidth : 1),
    y:
      (bounds?.top ?? 0) +
      (y + (frame?.clientTop ?? 0)) *
        (bounds && frame ? bounds.height / frame.offsetHeight : 1),
  };
}

async function pressAt(
  x: number,
  y: number,
  button: 'left' | 'middle' = 'left',
  modifiers = 0,
) {
  const position = nativePosition(x, y);
  await act(async () => {
    await cdp().send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      button,
      buttons: button === 'left' ? 1 : 4,
      clickCount: 1,
      modifiers,
      ...position,
    });
    await cdp().send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      button,
      buttons: 0,
      clickCount: 1,
      modifiers,
      ...position,
    });
  });
}

async function wheelOver(element: HTMLElement, deltaY: number) {
  const bounds = element.getBoundingClientRect();
  const position = nativePosition(
    bounds.left + bounds.width / 2,
    bounds.top + bounds.height / 2,
  );
  await act(async () => {
    await cdp().send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      ...position,
    });
    await cdp().send('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      deltaX: 0,
      deltaY,
      ...position,
    });
  });
}

describe('ItemTable row focus appearance', () => {
  it.each([
    ['light', false],
    ['dark', false],
    ['light', true],
    ['dark', true],
  ] as const)(
    'uses row background emphasis in %s with selected=%s',
    async (scheme, selected) => {
      const root = document.documentElement;
      const previousScheme = root.dataset.scheme;
      root.dataset.scheme = scheme;
      try {
        renderWithRoot(
          <>
            <button type="button">Before</button>
            <ItemTable
              data={ROWS.slice(0, 3)}
              columns={[
                ...COLUMNS,
                {
                  key: 'edit',
                  title: 'Edit',
                  render: () => <button type="button">Edit record</button>,
                },
              ]}
              selectionMode={selected ? 'multiple' : undefined}
              selectedKeys={selected ? ['r0', 'r1'] : undefined}
              onRowAction={() => {}}
              paginationMode="off"
              isRowMoveAnimated={false}
            />
          </>,
        );
        await hover(screen.getByRole('button', { name: 'Before' }));
        const paint = (key: string) =>
          getComputedStyle(cell(key, 'name')).backgroundImage;
        const rest = [paint('r0'), paint('r1')];
        // Prime the native keyboard modality, including the selectable table
        // whose header checkbox takes the first Tab stop.
        await key('{Tab}');
        await act(() => row('r0').focus());
        expect(row('r0').matches(':focus-visible')).toBe(true);
        expect.soft(getComputedStyle(row('r0')).outlineStyle).toBe('none');
        await vi.waitFor(() => expect(paint('r0')).not.toBe(rest[0]));
        await key('{ArrowDown}');
        expect(row('r1')).toHaveFocus();
        expect(row('r1').matches(':focus-visible')).toBe(true);
        await vi.waitFor(() => expect(paint('r0')).toBe(rest[0]));
        await vi.waitFor(() => expect(paint('r1')).not.toBe(rest[1]));
        await key('{Tab}');
        expect(row('r1').contains(document.activeElement)).toBe(true);
        expect(row('r1').matches(':focus-visible')).toBe(false);
        await vi.waitFor(() => expect(paint('r1')).toBe(rest[1]));
      } finally {
        if (previousScheme == null) delete root.dataset.scheme;
        else root.dataset.scheme = previousScheme;
      }
    },
  );

  it('keeps elevated linked text below the pinned cells while scrolling', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS.slice(0, 3).map((record) => ({
          ...record,
          description: LONG_TEXT.repeat(4),
        }))}
        columns={[
          { ...COLUMNS[0], pin: 'start' },
          { ...COLUMNS[1], width: 800 },
          {
            key: 'edit',
            title: 'Edit',
            width: 80,
            pin: 'end',
            render: () => <button type="button">Edit record</button>,
          },
        ]}
        rowLink={(record) => `/records/${record.id}`}
        width="360px"
        paginationMode="off"
        isAutoHeight
        isRowMoveAnimated={false}
      />,
    );
    const scroller = grid().parentElement!;
    await act(() => {
      scroller.scrollLeft = 260;
      scroller.dispatchEvent(new Event('scroll'));
    });
    await vi.waitFor(() => {
      expect(scroller.scrollLeft).toBeGreaterThan(200);
      for (const column of ['name', 'edit']) {
        const bounds = cell('r0', column).getBoundingClientRect();
        const hit = document.elementFromPoint(
          bounds.right - 8,
          bounds.top + bounds.height / 2,
        );
        expect(hit?.closest('[data-element="Cell"]')).toBe(cell('r0', column));
      }
    });
  });
});

describe('ItemTable flat row keyboard interaction', () => {
  it.each(['link', 'action'] as const)(
    'enters a plain %s table with Tab, moves rows and activates once',
    async (kind) => {
      const navigate = vi.fn();
      const onRowAction = vi.fn();
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          <button type="button">Before</button>
          <ItemTable
            data={ROWS.slice(0, 3)}
            columns={COLUMNS}
            rowLink={
              kind === 'link' ? (record) => `/records/${record.id}` : undefined
            }
            onRowAction={kind === 'action' ? onRowAction : undefined}
            paginationMode="off"
            isRowMoveAnimated={false}
          />
          <button type="button">After</button>
        </Root>,
      );
      await enterTable();
      await key('{ArrowDown}');
      expect(row('r1')).toHaveFocus();
      await key('{Enter}');
      if (kind === 'link') {
        expect(navigate).toHaveBeenCalledTimes(1);
        expect(navigate.mock.calls[0][0]).toBe('/records/r1');
      } else {
        expect(onRowAction).toHaveBeenCalledExactlyOnceWith(ROWS[1], 'r1');
      }
      await key('{Tab}');
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      await key('{Shift>}{Tab}{/Shift}');
      expect(row('r1')).toHaveFocus();
    },
  );

  it('enters the body from a sortable header and supports row boundaries', async () => {
    renderWithRoot(
      <>
        <button type="button">Before</button>
        <ItemTable
          data={ROWS.slice(0, 3)}
          columns={[{ ...COLUMNS[0], isSortable: true }, COLUMNS[1]]}
          onRowAction={() => {}}
          paginationMode="off"
        />
      </>,
    );
    await act(() => screen.getByRole('button', { name: 'Before' }).focus());
    await key('{Tab}');
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveFocus();
    await key('{ArrowDown}');
    expect(row('r0')).toHaveFocus();
    await key('{End}');
    expect(row('r2')).toHaveFocus();
    await key('{Home}');
    expect(row('r0')).toHaveFocus();
  });

  it.each([true, 'context-only'] as const)(
    'enters a menu-only table and restores the row after closing (%s)',
    async (rowContextMenu) => {
      const onRowMenuAction = vi.fn();
      renderWithRoot(
        <>
          <button type="button">Before</button>
          <ItemTable
            data={ROWS.slice(0, 3)}
            columns={COLUMNS}
            rowMenu={(record) => (
              <Menu.Item key="open">Open {record.name}</Menu.Item>
            )}
            rowContextMenu={rowContextMenu}
            onRowMenuAction={onRowMenuAction}
            paginationMode="off"
          />
          <button type="button">After</button>
        </>,
      );
      await enterTable();
      await key('{ArrowDown}');
      if (rowContextMenu === true) {
        await key('{Tab}');
        const trigger = row('r1').querySelector<HTMLButtonElement>(
          '[aria-label="Row actions"]',
        )!;
        expect(trigger).toHaveFocus();
        await key('{Enter}');
        await vi.waitFor(() =>
          expect(
            screen.getByRole('menuitem', { name: 'Open Record 1' }),
          ).toHaveFocus(),
        );
        await key('{Escape}');
        await vi.waitFor(() => expect(trigger).toHaveFocus());
        await key('{Shift>}{Tab}{/Shift}');
        expect(row('r1')).toHaveFocus();
      }
      await key('{Shift>}{F10}{/Shift}');
      await vi.waitFor(() =>
        expect(
          screen.getByRole('menuitem', { name: 'Open Record 1' }),
        ).toHaveFocus(),
      );
      await key('{Escape}');
      await vi.waitFor(() => expect(row('r1')).toHaveFocus());
      await key('{Shift>}{F10}{/Shift}');
      await vi.waitFor(() =>
        expect(
          screen.getByRole('menuitem', { name: 'Open Record 1' }),
        ).toHaveFocus(),
      );
      await key('{Enter}');
      expect(onRowMenuAction).toHaveBeenCalledExactlyOnceWith(
        'open',
        ROWS[1],
        'r1',
      );
      await vi.waitFor(() =>
        expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
      );
      await vi.waitFor(() => expect(row('r1')).toHaveFocus());
    },
  );

  it('keeps cell controls independent and hard-disabled rows inoperable', async () => {
    const onRowAction = vi.fn();
    const onControl = vi.fn();
    renderWithRoot(
      <ItemTable
        data={ROWS.slice(0, 3)}
        columns={[
          COLUMNS[0],
          {
            key: 'description',
            title: 'Description',
            render: (_, record) => (
              <button type="button" onClick={onControl}>
                Act {record.id}
              </button>
            ),
          },
        ]}
        onRowAction={onRowAction}
        disabledKeys={['r1']}
        rowMenu={<Menu.Item key="open">Open</Menu.Item>}
        rowContextMenu
        paginationMode="off"
      />,
    );
    const control = screen.getByRole('button', { name: 'Act r0' });
    await click(control);
    await key('{Enter}');
    expect(onControl).toHaveBeenCalledTimes(2);
    expect(onRowAction).not.toHaveBeenCalled();
    await click(label('r1', 'name'));
    expect(onRowAction).not.toHaveBeenCalled();
    await act(() => row('r1').focus());
    await key('{Enter}');
    await key('{Shift>}{F10}{/Shift}');
    expect(onRowAction).not.toHaveBeenCalled();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

describe('ItemTable flat virtual focus', () => {
  function virtualTable(data = ROWS) {
    return (
      <>
        <button type="button">Before</button>
        <ItemTable
          data={data}
          columns={COLUMNS}
          onRowAction={() => {}}
          height="140px"
          isVirtualized
          overscan={0}
          paginationMode="off"
          isRowMoveAnimated={false}
        />
        <button type="button">Outside</button>
      </>
    );
  }

  function rapidDown(count: number) {
    for (let index = 0; index < count; index++) {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
      );
    }
  }

  it('continues rapid arrow navigation beyond the mounted window', async () => {
    renderWithRoot(virtualTable());
    await vi.waitFor(() => expect(row('r0')).toBeInTheDocument());
    await act(() => row('r0').focus());
    await act(() => rapidDown(12));
    await vi.waitFor(() => expect(row('r12')).toHaveFocus());
    expect(grid().parentElement!.scrollTop).toBeGreaterThan(0);
    expect(
      grid().querySelectorAll('tbody tr[data-element="Row"]').length,
    ).toBeLessThan(ROWS.length);
  });

  it('keeps keyboard-focused rows fully visible below the sticky header', async () => {
    renderWithRoot(virtualTable());
    await enterTable();
    const scroller = grid().parentElement!;
    const expectVisible = (record: string) => {
      const bounds = row(record).getBoundingClientRect();
      const viewport = scroller.getBoundingClientRect();
      const header = grid().querySelector('thead')!.getBoundingClientRect();
      expect(bounds.top).toBeGreaterThanOrEqual(header.bottom - 1);
      expect(bounds.bottom).toBeLessThanOrEqual(
        viewport.top + scroller.clientTop + scroller.clientHeight + 1,
      );
    };
    await key('{End}');
    await vi.waitFor(() => expect(row('r59')).toHaveFocus());
    expectVisible('r59');
    await key('{Home}');
    await vi.waitFor(() => expect(row('r0')).toHaveFocus());
    expectVisible('r0');
    await act(() => rapidDown(12));
    await vi.waitFor(() => expect(row('r12')).toHaveFocus());
    expectVisible('r12');
  });

  it.each([false, true])(
    'does not apply activation or a menu key to a stale virtual row (variable height: %s)',
    async (variableHeight) => {
      const onRowAction = vi.fn();
      const data = variableHeight
        ? ROWS.map((record, index) =>
            index < 2
              ? { ...record, description: LONG_TEXT.repeat(4) }
              : record,
          )
        : ROWS;
      const columns = variableHeight
        ? [COLUMNS[0], { ...COLUMNS[1], autoHeight: true }]
        : COLUMNS;
      renderWithRoot(
        <ItemTable
          data={data}
          columns={columns}
          onRowAction={onRowAction}
          rowContextMenu="context-only"
          rowMenu={(record) => (
            <Menu.Item key="open">Open {record.name}</Menu.Item>
          )}
          height="140px"
          isVirtualized
          overscan={0}
          paginationMode="off"
        />,
      );
      await vi.waitFor(() => expect(row('r0')).toBeInTheDocument());
      if (variableHeight) {
        await vi.waitFor(() =>
          expect(row('r0').getBoundingClientRect().height).toBeGreaterThan(80),
        );
      }
      await act(() => row('r0').focus());
      await act(() => {
        rapidDown(12);
        for (const key of ['Enter', 'F10']) {
          document.activeElement?.dispatchEvent(
            new KeyboardEvent('keydown', {
              key,
              shiftKey: key === 'F10',
              bubbles: true,
            }),
          );
        }
      });
      await vi.waitFor(() => expect(row('r12')).toHaveFocus());
      expect(onRowAction).not.toHaveBeenCalled();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      await key('{Enter}');
      expect(onRowAction).toHaveBeenCalledExactlyOnceWith(ROWS[12], 'r12');
      await key('{Shift>}{F10}{/Shift}');
      await vi.waitFor(() =>
        expect(
          screen.getByRole('menuitem', { name: 'Open Record 12' }),
        ).toHaveFocus(),
      );
    },
  );

  it('cancels pending focus when the user leaves the table', async () => {
    renderWithRoot(virtualTable());
    await vi.waitFor(() => expect(row('r0')).toBeInTheDocument());
    await act(() => row('r0').focus());
    await act(() => {
      rapidDown(12);
      screen.getByRole('button', { name: 'Outside' }).focus();
    });
    // Let the queued virtualizer render/focus attempt settle before checking.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus();
  });

  it('keeps pointer scrolling when the focused row leaves the virtual window', async () => {
    renderWithRoot(virtualTable());
    await enterTable();
    const scroller = grid().parentElement!;
    await wheelOver(scroller, 720);
    await vi.waitFor(() => expect(row('r0')).not.toBeInTheDocument());
    await vi.waitFor(() => expect(scroller).toHaveFocus());
    // Include the virtualizer's scrolling-rest commit, which must not restore
    // the old row and move the viewport back to its former position.
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 200)));
    expect(scroller.scrollTop).toBeGreaterThan(400);
    const firstMounted = grid().querySelector<HTMLTableRowElement>(
      'tbody tr[data-element="Row"][data-key]',
    )!;
    await key('{ArrowDown}');
    expect(firstMounted).toHaveFocus();
    expect(scroller.scrollTop).toBeGreaterThan(400);
  });

  it('tabs into the visible window after pointer scrolling past the resting row', async () => {
    renderWithRoot(virtualTable());
    await enterTable();
    await key('{ArrowDown}');
    expect(row('r1')).toHaveFocus();
    const outside = screen.getByRole('button', { name: 'Outside' });
    await act(() => outside.focus());
    const scroller = grid().parentElement!;
    await wheelOver(scroller, 720);
    await vi.waitFor(() => expect(row('r1')).not.toBeInTheDocument());
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 200)));
    expect(outside).toHaveFocus();
    const candidate = grid().querySelector<HTMLTableRowElement>(
      'tbody tr[data-element="Row"][tabindex="0"]',
    );
    expect(candidate).not.toBeNull();
    await act(() => screen.getByRole('button', { name: 'Before' }).focus());
    await key('{Tab}');
    expect(candidate).toHaveFocus();
    expect(scroller.scrollTop).toBeGreaterThan(400);
    const bounds = candidate!.getBoundingClientRect();
    const viewport = scroller.getBoundingClientRect();
    const header = grid().querySelector('thead')!.getBoundingClientRect();
    expect(bounds.top).toBeGreaterThanOrEqual(header.bottom - 1);
    expect(bounds.bottom).toBeLessThanOrEqual(
      viewport.top + scroller.clientTop + scroller.clientHeight + 1,
    );
  });

  it('leaves a reachable row after the focused record is deleted', async () => {
    const { rerender } = renderWithRoot(virtualTable());
    await vi.waitFor(() => expect(row('r0')).toBeInTheDocument());
    await act(() => row('r0').focus());
    await act(() => rapidDown(12));
    await vi.waitFor(() => expect(row('r12')).toHaveFocus());
    rerender(virtualTable(ROWS.filter((record) => record.id !== 'r12')));
    await vi.waitFor(() => expect(row('r13')).toHaveFocus());
    expect(row('r13')).toHaveAttribute('tabindex', '0');
  });

  it('keeps page controls focused and makes the next page reachable', async () => {
    renderWithRoot(
      <ItemTable
        data={ROWS.slice(0, 20)}
        columns={COLUMNS}
        onRowAction={() => {}}
        defaultPageSize={10}
        pageSizeOptions={[10]}
        isRowMoveAnimated={false}
      />,
    );
    await act(() => row('r0').focus());
    await key('{ArrowDown}');
    const pageTwo = screen.getByRole('button', { name: 'Page 2' });
    await click(pageTwo);
    await vi.waitFor(() => expect(row('r10')).toBeInTheDocument());
    expect(pageTwo).toHaveFocus();
    const resting = grid().querySelector<HTMLTableRowElement>(
      'tbody tr[tabindex="0"]',
    );
    expect(resting).not.toBeNull();
    await act(() => resting!.focus());
    await key('{ArrowDown}');
    expect(document.activeElement).toBe(resting!.nextElementSibling);
  });
});

describe('ItemTable native row links', () => {
  it.each(
    (['text', 'whitespace'] as const).flatMap((area) =>
      (['primary', 'modified', 'middle'] as const).map((gesture) => ({
        area,
        gesture,
      })),
    ),
  )(
    'preserves a native $gesture gesture over $area',
    async ({ area, gesture }) => {
      const navigate = vi.fn();
      const destination = `/__menu-link-test/itemtable-${area}-${gesture}`;
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          <ItemTable
            data={[ROWS[0]]}
            columns={COLUMNS}
            rowLink={() => destination}
            width="380px"
            paginationMode="off"
          />
        </Root>,
      );
      const target =
        area === 'text'
          ? label('r0', 'description')
          : cell('r0', 'description');
      await vi.waitFor(() =>
        expect(target.getBoundingClientRect().width).toBeGreaterThan(0),
      );
      const bounds = target.getBoundingClientRect();
      const x =
        area === 'text' ? bounds.left + bounds.width / 2 : bounds.right - 4;
      const y = bounds.top + bounds.height / 2;
      const events: MouseEvent[] = [];
      const type = gesture === 'middle' ? 'auxclick' : 'click';
      const record = (event: MouseEvent) => events.push(event);
      document.addEventListener(type, record, true);
      try {
        await pressAt(
          x,
          y,
          gesture === 'middle' ? 'middle' : 'left',
          gesture === 'modified' ? 4 : 0,
        );
        expect(events).toHaveLength(1);
        expect(events[0].isTrusted).toBe(true);
        const anchor = (events[0].target as Element).closest('a');
        expect(anchor).toHaveAttribute('href', destination);
        expect(events[0].defaultPrevented).toBe(gesture === 'primary');
        if (gesture === 'primary') {
          expect(navigate).toHaveBeenCalledTimes(1);
          expect(navigate.mock.calls[0][0]).toBe(destination);
        } else {
          expect(navigate).not.toHaveBeenCalled();
          await vi.waitFor(async () => {
            const requests: { url: string }[] = await (
              await fetch('/__menu-link-test/requests')
            ).json();
            expect(
              requests.some((request) => request.url === destination),
            ).toBe(true);
          });
        }
        expect(screen.getAllByRole('link')).toHaveLength(1);
        expect(screen.getByRole('link')).toHaveAccessibleName('Record 0');
      } finally {
        document.removeEventListener(type, record, true);
      }
    },
  );

  it('keeps buttons, checkbox labels and custom links independent of row navigation', async () => {
    const navigate = vi.fn();
    const onControl = vi.fn();
    render(
      <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
        <ItemTable
          data={[ROWS[0]]}
          columns={[
            COLUMNS[0],
            {
              key: 'description',
              title: 'Controls',
              width: 600,
              render: () => (
                <>
                  <button type="button" onClick={onControl}>
                    Control
                  </button>
                  <label>
                    <input type="checkbox" onChange={onControl} />
                    Select
                  </label>
                  <a
                    href="/__menu-link-test/custom-cell"
                    onClick={(event) => {
                      event.preventDefault();
                      onControl();
                    }}
                  >
                    Custom link
                  </a>
                  <span>Custom text</span>
                  <button
                    type="button"
                    style={{ pointerEvents: 'none' }}
                    onClick={onControl}
                  >
                    Ignored control
                  </button>
                  <div style={{ pointerEvents: 'none' }}>
                    <button type="button" onClick={onControl}>
                      Inherited ignored control
                    </button>
                  </div>
                </>
              ),
            },
          ]}
          rowLink={() => '/records/r0'}
          paginationMode="off"
        />
      </Root>,
    );
    await click(screen.getByRole('button', { name: 'Control' }));
    await click(screen.getByText('Select'));
    await click(screen.getByRole('link', { name: 'Custom link' }));
    expect(onControl).toHaveBeenCalledTimes(3);
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(navigate).not.toHaveBeenCalled();
    const customTextElement = screen.getByText('Custom text');
    await act(() =>
      customTextElement.scrollIntoView({ block: 'nearest', inline: 'center' }),
    );
    const customText = customTextElement.getBoundingClientRect();
    await pressAt(
      customText.left + customText.width / 2,
      customText.top + customText.height / 2,
    );
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0][0]).toBe('/records/r0');
    const ignored = screen.getByRole('button', { name: 'Ignored control' });
    expect(getComputedStyle(ignored).pointerEvents).toBe('none');
    await act(() =>
      ignored.scrollIntoView({ block: 'nearest', inline: 'center' }),
    );
    const ignoredBounds = ignored.getBoundingClientRect();
    await pressAt(
      ignoredBounds.left + ignoredBounds.width / 2,
      ignoredBounds.top + ignoredBounds.height / 2,
    );
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(onControl).toHaveBeenCalledTimes(3);
    const inherited = screen.getByRole('button', {
      name: 'Inherited ignored control',
    });
    expect(getComputedStyle(inherited).pointerEvents).toBe('none');
    await act(() =>
      inherited.scrollIntoView({ block: 'nearest', inline: 'center' }),
    );
    const inheritedBounds = inherited.getBoundingClientRect();
    await pressAt(
      inheritedBounds.left + inheritedBounds.width / 2,
      inheritedBounds.top + inheritedBounds.height / 2,
    );
    expect(navigate).toHaveBeenCalledTimes(3);
    expect(onControl).toHaveBeenCalledTimes(3);
  });
});

describe('ItemTable linked default text tooltips', () => {
  it('opens the complete clipped value, closes on leave and cleans up when its row unmounts', async () => {
    const { rerender } = renderWithRoot(
      <>
        <button type="button">Outside</button>
        <ItemTable
          data={[{ ...ROWS[0], description: LONG_TEXT }, ROWS[1]]}
          columns={[
            COLUMNS[0],
            { ...COLUMNS[1], width: 160, minWidth: 160, maxWidth: 160 },
          ]}
          rowLink={(record) => `/records/${record.id}`}
          width="340px"
          paginationMode="off"
        />
      </>,
    );
    const outside = screen.getByRole('button', { name: 'Outside' });
    await vi.waitFor(() =>
      expect(label('r0', 'description').scrollWidth).toBeGreaterThan(
        label('r0', 'description').clientWidth,
      ),
    );
    await hover(outside);
    await hover(label('r0', 'description'));
    await vi.waitFor(
      () => expect(screen.getByRole('tooltip')).toHaveTextContent(LONG_TEXT),
      { timeout: 3_000 },
    );
    await hover(outside);
    await vi.waitFor(() =>
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(),
    );
    expect(label('r1', 'description').scrollWidth).toBe(
      label('r1', 'description').clientWidth,
    );
    await hover(label('r1', 'description'));
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    await hover(outside);
    await hover(label('r0', 'description'));
    await vi.waitFor(
      () => expect(screen.getByRole('tooltip')).toHaveTextContent(LONG_TEXT),
      { timeout: 3_000 },
    );
    rerender(<button type="button">Table removed</button>);
    await vi.waitFor(() =>
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(),
    );
  });
});
