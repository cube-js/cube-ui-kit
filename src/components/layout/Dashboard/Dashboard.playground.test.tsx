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
