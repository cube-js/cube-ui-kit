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

    const revenue = screen.getByRole('group', { name: 'Move Net revenue' });
    const insight = screen.getByRole('group', {
      name: 'Move Revenue trend',
    });
    const orders = screen.getByRole('group', { name: 'Move Orders' });

    revenue.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');

    insight.focus();
    await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}');

    expect(insight).toHaveStyle({
      gridColumn: '1 / span 2',
      gridRow: '1 / span 2',
    });
    expect(orders).toHaveStyle({
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
      '[data-dashboard-free-cell][data-dashboard-parent-id="grid-1"][data-dashboard-column="5"][data-dashboard-row="0"]',
    )!;
    fireEvent.pointerMove(targetCell);
    await user.click(
      screen.getByRole('button', {
        name: 'Add an item at column 6, row 1 in grid-1',
      }),
    );
    await user.click(screen.getByRole('menuitem', { name: /Grid container/ }));

    const orders = screen.getByRole('group', { name: 'Move Orders' });
    const revenue = screen.getByRole('group', { name: 'Move Net revenue' });
    await user.click(orders);
    await user.keyboard('{Shift>}');
    await user.click(revenue);
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
    mockRect(nestedContent, { left: 600, top: 0, width: 600, height: 208 });
    mockRect(orders, { left: 0, top: 0, width: 88, height: 96 });

    fireEvent(orders, pointerEvent('pointerdown', 20, 20));
    fireEvent(window, pointerEvent('pointermove', 700, 20));

    expect(screen.getAllByTestId('DashboardDropPlaceholder')).toHaveLength(2);

    fireEvent(window, pointerEvent('pointerup', 700, 20));

    expect(
      nestedContent.querySelector('[data-dashboard-node-id="compact-1"]'),
    ).toBeInTheDocument();
    expect(
      nestedContent.querySelector('[data-dashboard-node-id="wide-1"]'),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      '2 selected items moved into Grid 10.',
    );
  }, 10000);
});
