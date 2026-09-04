import { fireEvent, renderWithRoot, screen, userEvent } from '../../../test';

import { DashboardPlayground } from './Dashboard.stories';

function pointerEvent(type: string, pageX: number, pageY: number) {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: pageX,
    clientY: pageY,
    pointerId: 1,
    pointerType: 'mouse',
  });
  Object.defineProperty(event, 'pageX', { get: () => pageX });
  Object.defineProperty(event, 'pageY', { get: () => pageY });

  return event;
}

function mockRect(
  element: Element,
  rect: { left: number; top: number; width: number; height: number },
) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    ...rect,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    x: rect.left,
    y: rect.top,
    toJSON: () => ({}),
  });
}

describe('Dashboard Playground', () => {
  it('swaps a smaller Grid blocker into space vacated by a larger widget', async () => {
    const user = userEvent.setup();

    renderWithRoot(
      <DashboardPlayground rowHeight={96} gap={16} selectionMode="multiple" />,
    );

    const signups = screen.getByRole('group', { name: 'Move Signups' });
    const insight = screen.getByRole('group', {
      name: 'Move Conversion quality',
    });
    const sessions = screen.getByRole('group', { name: 'Move Sessions' });

    signups.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');

    insight.focus();
    await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}');

    expect(insight).toHaveStyle({
      gridColumn: '1 / span 2',
      gridRow: '1 / span 2',
    });
    expect(sessions).toHaveStyle({
      gridColumn: '3 / span 1',
      gridRow: '1 / span 1',
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Moved to 2×2 at column 1, row 1.',
    );
  }, 10000);

  it('moves a selected widget group into a nested container atomically', async () => {
    const user = userEvent.setup();

    renderWithRoot(
      <DashboardPlayground rowHeight={96} gap={16} selectionMode="multiple" />,
    );

    const targetCell = document.querySelector<HTMLElement>(
      '[data-dashboard-free-cell][data-dashboard-parent-id="grid-1"][data-dashboard-column="7"][data-dashboard-row="1"]',
    )!;
    fireEvent.pointerMove(targetCell);
    await user.click(
      screen.getByRole('button', {
        name: 'Add an item at column 8, row 2 in grid-1',
      }),
    );
    await user.click(screen.getByRole('menuitem', { name: /Grid container/ }));

    const sessions = screen.getByRole('group', { name: 'Move Sessions' });
    const signups = screen.getByRole('group', { name: 'Move Signups' });
    await user.click(sessions);
    await user.keyboard('{Shift>}');
    await user.click(signups);
    await user.keyboard('{/Shift}');

    const dashboard = screen.getByTestId('Dashboard');
    const outerContent = document.querySelector<HTMLElement>(
      '[data-dashboard-drop-target][data-dashboard-parent-id="grid-1"]',
    )!;
    const nestedContent = document.querySelector<HTMLElement>(
      '[data-dashboard-drop-target][data-dashboard-parent-id="grid-10"]',
    )!;
    mockRect(dashboard, { left: 0, top: 0, width: 1200, height: 700 });
    mockRect(outerContent, { left: 0, top: 0, width: 1200, height: 656 });
    mockRect(nestedContent, { left: 700, top: 0, width: 400, height: 208 });
    mockRect(sessions, { left: 0, top: 0, width: 88, height: 96 });

    fireEvent(sessions, pointerEvent('pointerdown', 20, 20));
    fireEvent(window, pointerEvent('pointermove', 750, 20));

    expect(screen.getAllByTestId('DashboardDropPlaceholder')).toHaveLength(2);

    fireEvent(window, pointerEvent('pointerup', 750, 20));

    expect(
      nestedContent.querySelector('[data-dashboard-node-id="compact-3"]'),
    ).toBeInTheDocument();
    expect(
      nestedContent.querySelector('[data-dashboard-node-id="wide-8"]'),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      '2 selected items moved into Grid 10.',
    );
  }, 10000);
  it('reorders a stack by pointer and by keyboard', async () => {
    const user = userEvent.setup();

    renderWithRoot(<DashboardPlayground rowHeight={96} gap={16} />);

    // A stack renders its children in array order, so the reorder only counts
    // once the array itself has moved — reading the DOM is the whole point.
    const stackOrder = () =>
      Array.from(
        document
          .querySelector<HTMLElement>(
            '[data-dashboard-drop-target][data-dashboard-parent-id="horizontal-kpi"]',
          )!
          .querySelectorAll(':scope > [data-dashboard-node-id]'),
        (node) => node.getAttribute('data-dashboard-node-id'),
      );

    expect(stackOrder().slice(0, 3)).toEqual(['wide-1', 'wide-2', 'wide-3']);

    const dashboard = screen.getByTestId('Dashboard');
    const content = document.querySelector<HTMLElement>(
      '[data-dashboard-drop-target][data-dashboard-parent-id="horizontal-kpi"]',
    )!;
    const orders = screen.getByRole('group', { name: 'Move Orders' });
    mockRect(dashboard, { left: 0, top: 0, width: 1200, height: 700 });
    mockRect(content, { left: 0, top: 0, width: 1200, height: 96 });
    mockRect(orders, { left: 405, top: 0, width: 288, height: 96 });

    // Far enough left that it is past the first tile's midpoint whatever share
    // of the stack that tile currently holds.
    fireEvent(orders, pointerEvent('pointerdown', 420, 40));
    fireEvent(window, pointerEvent('pointermove', 20, 40));
    fireEvent(window, pointerEvent('pointerup', 20, 40));

    expect(stackOrder().slice(0, 3)).toEqual(['wide-2', 'wide-1', 'wide-3']);

    // An arrow key steps one position, not one column: a stack is packed edge
    // to edge, so a single-column step would never leave the item's own slot.
    orders.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(stackOrder().slice(0, 3)).toEqual(['wide-1', 'wide-3', 'wide-2']);

    // Rows are pinned in a horizontal stack, so the cross-axis arrow does not
    // move anything.
    await user.keyboard('{ArrowUp}');
    expect(stackOrder().slice(0, 3)).toEqual(['wide-1', 'wide-3', 'wide-2']);
  }, 15000);

  it('puts a previewed reorder back when Escape cancels the drag', async () => {
    renderWithRoot(<DashboardPlayground rowHeight={96} gap={16} />);

    const stackOrder = () =>
      Array.from(
        document
          .querySelector<HTMLElement>(
            '[data-dashboard-drop-target][data-dashboard-parent-id="horizontal-kpi"]',
          )!
          .querySelectorAll(':scope > [data-dashboard-node-id]'),
        (node) => node.getAttribute('data-dashboard-node-id'),
      );

    expect(stackOrder().slice(0, 3)).toEqual(['wide-1', 'wide-2', 'wide-3']);

    const dashboard = screen.getByTestId('Dashboard');
    const content = document.querySelector<HTMLElement>(
      '[data-dashboard-drop-target][data-dashboard-parent-id="horizontal-kpi"]',
    )!;
    const orders = screen.getByRole('group', { name: 'Move Orders' });
    mockRect(dashboard, { left: 0, top: 0, width: 1200, height: 700 });
    mockRect(content, { left: 0, top: 0, width: 1200, height: 96 });
    mockRect(orders, { left: 405, top: 0, width: 288, height: 96 });

    fireEvent(orders, pointerEvent('pointerdown', 420, 40));
    fireEvent(window, pointerEvent('pointermove', 20, 40));

    // The preview is real state: the story has already written the reorder, so
    // a cancel has to undo it rather than merely decline to repeat it.
    expect(stackOrder().slice(0, 3)).toEqual(['wide-2', 'wide-1', 'wide-3']);

    fireEvent.keyDown(window, { key: 'Escape' });

    // Both halves come back — the dragged tile from `info.items`, and the
    // sibling its landing had pushed aside from `info.displaced`.
    expect(stackOrder().slice(0, 3)).toEqual(['wide-1', 'wide-2', 'wide-3']);

    fireEvent(window, pointerEvent('pointerup', 20, 40));
    expect(stackOrder().slice(0, 3)).toEqual(['wide-1', 'wide-2', 'wide-3']);
  }, 15000);

  it('refuses to duplicate into a stack with no room left', async () => {
    const user = userEvent.setup();

    renderWithRoot(<DashboardPlayground rowHeight={96} gap={16} />);

    // The headline stack holds 3+3+3+1+1 of its 12 columns, so it has room for
    // another compact tile and none at all for another wide one.
    const revenue = screen.getByRole('group', { name: 'Move Net revenue' });
    await user.click(revenue);
    await user.click(
      screen.getByRole('button', { name: 'Actions for Net revenue' }),
    );
    await user.click(screen.getByRole('menuitem', { name: /Duplicate/ }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'No room to duplicate Net revenue in Headline metrics.',
    );
    expect(
      screen.queryByRole('group', { name: 'Move Net revenue copy' }),
    ).not.toBeInTheDocument();
    await user.keyboard('{Escape}');

    const returns = screen.getByRole('group', { name: 'Move Returns' });
    await user.click(returns);
    await user.click(
      screen.getByRole('button', { name: 'Actions for Returns' }),
    );
    await user.click(screen.getByRole('menuitem', { name: /Duplicate/ }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Returns duplicated in Headline metrics.',
    );
    expect(
      screen.getByRole('group', { name: 'Move Returns copy' }),
    ).toBeInTheDocument();
  }, 15000);

  it('applies a menu size command, which commits without ever previewing', async () => {
    const user = userEvent.setup();

    renderWithRoot(<DashboardPlayground rowHeight={96} gap={16} />);

    // A compact tile is pinned at 1×1, so neither axis can change and the size
    // section is absent rather than present-and-disabled.
    const sessions = screen.getByRole('group', { name: 'Move Sessions' });
    await user.click(sessions);
    await user.click(
      screen.getByRole('button', { name: 'Actions for Sessions' }),
    );
    expect(
      screen.getByRole('menuitem', { name: /^Settings/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Narrow' }),
    ).not.toBeInTheDocument();
    await user.keyboard('{Escape}');

    const table = screen.getByRole('group', {
      name: 'Move Campaign performance',
    });
    expect(table).toHaveStyle({ gridColumn: '8 / span 5' });

    await user.click(table);
    await user.click(
      screen.getByRole('button', { name: 'Actions for Campaign performance' }),
    );
    // Widening would run past the parent's last column; narrowing has room.
    expect(
      screen.getByRole('menuitem', { name: 'Widen' }).closest('li'),
    ).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('menuitem', { name: 'Narrow' }));

    // The story writes the command's single commit, so the widget really moves.
    expect(table).toHaveStyle({ gridColumn: '8 / span 4' });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Resized to 4×3 at column 8, row 4.',
    );
  }, 15000);
});
