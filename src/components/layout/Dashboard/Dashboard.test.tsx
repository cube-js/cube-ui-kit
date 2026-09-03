import {
  act,
  fireEvent,
  renderWithRoot,
  screen,
  userEvent,
} from '../../../test';

import { Dashboard } from './Dashboard';

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

describe('Dashboard', () => {
  it('renders standalone compound containers on the shared grid', () => {
    renderWithRoot(
      <Dashboard qa="Dashboard" rowHeight={72} gap={16}>
        <Dashboard.Grid id="overview" title="Overview" rows={2} qa="Grid">
          <Dashboard.Widget
            id="metric"
            aria-label="Metric"
            column={3}
            row={1}
            columns={6}
            rows={1}
            qa="Widget"
            isCard
          >
            Metric content
          </Dashboard.Widget>
        </Dashboard.Grid>
      </Dashboard>,
    );

    // The `gap` prop is the spacing inside a container's grid. The top-level
    // channel is a fixed `1x` token on the root and no longer tracks it, so the
    // root carries no inline gap at all — `Dashboard.browser.test.tsx` pins the
    // resulting distance in pixels.
    expect(screen.getByTestId('Dashboard').style.gap).toBe('');
    expect(screen.getByTestId('DashboardContainerContent')).toHaveStyle({
      gap: '16px 16px',
    });
    expect(screen.getByTestId('Grid')).toHaveAttribute(
      'data-dashboard-depth',
      '1',
    );
    expect(screen.getByTestId('Widget')).toHaveStyle({
      gridColumn: '4 / span 6',
      gridRow: '2 / span 1',
    });
    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
    expect(screen.getByText('Metric content')).toBeInTheDocument();
  });

  it('aligns constrained stack children to the top or left', () => {
    renderWithRoot(
      <Dashboard>
        <Dashboard.HorizontalStack id="horizontal" rows={3}>
          <Dashboard.Widget
            id="short"
            columns={2}
            rows={1}
            maxRows={1}
            qa="Short"
          >
            Short
          </Dashboard.Widget>
        </Dashboard.HorizontalStack>
        <Dashboard.VerticalStack id="vertical" rows={3}>
          <Dashboard.Widget
            id="narrow"
            columns={2}
            rows={1}
            maxColumns={2}
            qa="Narrow"
          >
            Narrow
          </Dashboard.Widget>
        </Dashboard.VerticalStack>
      </Dashboard>,
    );

    // Each child stretches along its stack's own axis and is held at its
    // maximum across it, which is what keeps a short tile short and a narrow
    // one narrow.
    expect(screen.getByTestId('Short')).toHaveStyle({
      gridColumn: 'span 12',
      gridRow: '1 / span 1',
    });
    expect(screen.getByTestId('Narrow')).toHaveStyle({
      gridColumn: '1 / span 2',
      gridRow: 'span 3',
    });
  });

  it('shares a stack between its children and follows it as it resizes', () => {
    const renderStack = (columns: number) => (
      <Dashboard>
        <Dashboard.Grid id="grid" rows={1}>
          <Dashboard.HorizontalStack id="stack" columns={columns} rows={1}>
            <Dashboard.Widget id="a" columns={3} minColumns={2} qa="A" />
            <Dashboard.Widget id="b" columns={1} minColumns={1} qa="B" />
          </Dashboard.HorizontalStack>
        </Dashboard.Grid>
      </Dashboard>
    );

    const { rerender } = renderWithRoot(renderStack(8));

    // Stored spans are a preference, not a position: 3 and 1 share 8 in the
    // same 3:1 proportion.
    expect(screen.getByTestId('A')).toHaveStyle({ gridColumn: 'span 6' });
    expect(screen.getByTestId('B')).toHaveStyle({ gridColumn: 'span 2' });

    rerender(renderStack(12));
    expect(screen.getByTestId('A')).toHaveStyle({ gridColumn: 'span 9' });
    expect(screen.getByTestId('B')).toHaveStyle({ gridColumn: 'span 3' });

    // Down at the floor the children are at their own minimums and the stack
    // can go no further — `minColumns` on the first child is what stops it.
    rerender(renderStack(3));
    expect(screen.getByTestId('A')).toHaveStyle({ gridColumn: 'span 2' });
    expect(screen.getByTestId('B')).toHaveStyle({ gridColumn: 'span 1' });
    expect(
      document.querySelector('[data-dashboard-node-id="stack"]'),
    ).toHaveAttribute('data-dashboard-min-columns', '3');
  });

  it('highlights only the deepest hovered Grid free cells', () => {
    renderWithRoot(
      <Dashboard isEditing>
        <Dashboard.Grid id="outer" rows={2}>
          <Dashboard.Grid id="inner" columns={2} rows={1} />
        </Dashboard.Grid>
      </Dashboard>,
    );

    const innerCell = document.querySelector<HTMLElement>(
      '[data-dashboard-free-cell][data-dashboard-parent-id="inner"]',
    )!;
    fireEvent.pointerMove(innerCell);

    const innerCells = document.querySelectorAll(
      '[data-dashboard-free-cell][data-dashboard-parent-id="inner"]',
    );
    const outerCells = document.querySelectorAll(
      '[data-dashboard-free-cell][data-dashboard-parent-id="outer"]',
    );

    expect(innerCells).toHaveLength(2);
    innerCells.forEach((cell) =>
      expect(cell).toHaveAttribute('data-highlighted', 'true'),
    );
    outerCells.forEach((cell) =>
      expect(cell).not.toHaveAttribute('data-highlighted'),
    );
  });

  it('offers the add menu items a full stack can still squeeze for', async () => {
    const user = userEvent.setup();
    const onAddItem = vi.fn();

    renderWithRoot(
      <Dashboard
        isEditing
        onAddItem={onAddItem}
        addItems={[
          { id: 'tile', name: 'Tile', defaultColumns: 3, minColumns: 3 },
          { id: 'panel', name: 'Panel', defaultColumns: 9, minColumns: 9 },
        ]}
      >
        <Dashboard.HorizontalStack id="stack" rows={1}>
          <Dashboard.Widget id="resident" columns={4} minColumns={4} rows={1}>
            Resident
          </Dashboard.Widget>
        </Dashboard.HorizontalStack>
      </Dashboard>,
    );

    // The resident is drawn across the whole stack, yet it can be squeezed to
    // 4 — so an item needing 3 fits and one needing 9 does not.
    expect(
      document.querySelector('[data-dashboard-node-id="resident"]'),
    ).toHaveAttribute('data-dashboard-columns', '12');

    // The add button only enters the accessibility tree once its container is
    // hovered, the same as every other insertion point.
    fireEvent.pointerMove(
      document.querySelector('[data-dashboard-free-cell]')!,
    );
    await user.click(screen.getByRole('button', { name: /Add an item/ }));
    expect(screen.getByRole('menuitem', { name: 'Tile' })).not.toHaveAttribute(
      'aria-disabled',
    );
    expect(
      screen.getByRole('menuitem', { name: 'Panel' }).closest('li'),
    ).toHaveAttribute('aria-disabled', 'true');

    await user.click(screen.getByRole('menuitem', { name: 'Tile' }));
    expect(onAddItem).toHaveBeenCalledWith(
      'tile',
      expect.objectContaining({
        parentId: 'stack',
        placement: expect.objectContaining({ columns: 3 }),
      }),
    );
  });

  it('accepts a drop into a full stack the children can squeeze for', () => {
    const onPlacementChange = vi.fn();
    const renderTree = (destinationMin: number) =>
      renderWithRoot(
        <Dashboard qa="Dashboard">
          <Dashboard.Grid id="grid" rows={1}>
            <Dashboard.Widget
              id="metric"
              aria-label="Metric"
              column={0}
              columns={2}
              rows={1}
              isMovable
              onPlacementChange={onPlacementChange}
            >
              Metric
            </Dashboard.Widget>
            <Dashboard.HorizontalStack
              id="destination"
              aria-label="Destination"
              column={6}
              columns={6}
              rows={1}
            >
              <Dashboard.Widget
                id="resident"
                aria-label="Resident"
                columns={6}
                minColumns={destinationMin}
                rows={1}
              >
                Resident
              </Dashboard.Widget>
            </Dashboard.HorizontalStack>
          </Dashboard.Grid>
        </Dashboard>,
      );

    const drag = () => {
      const dashboard = screen.getByTestId('Dashboard');
      const contents = screen.getAllByTestId('DashboardContainerContent');
      const metric = screen.getByRole('group', { name: 'Metric' });
      mockRect(dashboard, { left: 0, top: 0, width: 1200, height: 200 });
      mockRect(contents[0], { left: 0, top: 0, width: 1200, height: 96 });
      mockRect(contents[1], { left: 608, top: 0, width: 592, height: 96 });
      mockRect(metric, { left: 0, top: 0, width: 186, height: 80 });

      fireEvent(metric, pointerEvent('pointerdown', 20, 20));
      fireEvent(window, pointerEvent('pointermove', 700, 20));

      return screen.getByTestId('DashboardDropPlaceholder');
    };

    // The resident is drawn across all six columns either way — a stack always
    // fills itself — so only its own floor can decide whether one more fits.
    const { unmount } = renderTree(1);
    expect(
      document.querySelector('[data-dashboard-node-id="resident"]'),
    ).toHaveAttribute('data-dashboard-columns', '6');
    expect(drag()).toHaveAttribute('data-dashboard-drop-status', 'valid');
    fireEvent(window, pointerEvent('pointerup', 700, 20));
    unmount();

    renderTree(6);
    expect(drag()).toHaveAttribute('data-dashboard-drop-status', 'danger');
  });

  it('uses one trailing add location for each stack', () => {
    renderWithRoot(
      <Dashboard isEditing>
        <Dashboard.HorizontalStack id="horizontal" rows={3}>
          <Dashboard.Widget id="horizontal-child" columns={2} rows={1} />
        </Dashboard.HorizontalStack>
        <Dashboard.VerticalStack id="vertical" rows={3}>
          <Dashboard.Widget id="vertical-child" columns={2} rows={1} />
        </Dashboard.VerticalStack>
      </Dashboard>,
    );

    const horizontalCells = document.querySelectorAll(
      '[data-dashboard-free-cell][data-dashboard-parent-id="horizontal"]',
    );
    const verticalCells = document.querySelectorAll(
      '[data-dashboard-free-cell][data-dashboard-parent-id="vertical"]',
    );

    // A stack fills itself, so the insertion point is not leftover space: the
    // children stretch across every column (or row) and the slot sits in a
    // narrow track of its own past the last one.
    expect(horizontalCells).toHaveLength(1);
    expect(horizontalCells[0]).toHaveAttribute('data-dashboard-column', '12');
    expect(horizontalCells[0]).toHaveAttribute('data-dashboard-row', '0');
    expect(verticalCells).toHaveLength(1);
    expect(verticalCells[0]).toHaveAttribute('data-dashboard-column', '0');
    expect(verticalCells[0]).toHaveAttribute('data-dashboard-row', '3');
  });

  it('moves the add button with the hovered Grid cell and disables items that cannot fit', async () => {
    const user = userEvent.setup();
    const onAddItem = vi.fn();

    renderWithRoot(
      <Dashboard
        isEditing
        addItems={[
          {
            id: 'small',
            name: 'Small widget',
            defaultColumns: 1,
            defaultRows: 1,
          },
          {
            id: 'large',
            name: 'Large widget',
            defaultColumns: 2,
            defaultRows: 2,
            minColumns: 2,
            minRows: 2,
          },
        ]}
        onAddItem={onAddItem}
      >
        <Dashboard.Grid id="grid" rows={2}>
          <Dashboard.Widget id="occupied" columns={11} rows={2} />
        </Dashboard.Grid>
      </Dashboard>,
    );

    const freeCell = document.querySelector<HTMLElement>(
      '[data-dashboard-free-cell][data-dashboard-parent-id="grid"][data-dashboard-column="11"][data-dashboard-row="1"]',
    )!;
    const dormantAddButton = document.querySelector<HTMLElement>(
      '[data-dashboard-add-slot][data-dashboard-parent-id="grid"]',
    )!;
    const contentGrid = document.querySelector<HTMLElement>(
      '[data-dashboard-drop-target][data-dashboard-parent-id="grid"]',
    )!;
    expect(dormantAddButton).toHaveAttribute('aria-hidden', 'true');
    expect(dormantAddButton.querySelector('svg')).not.toBeInTheDocument();

    fireEvent.pointerMove(freeCell);

    const addButton = screen.getByRole('button', {
      name: 'Add an item at column 12, row 2 in grid',
    });
    expect(addButton).not.toHaveAttribute('aria-hidden');
    expect(addButton.querySelector('svg')).toBeInTheDocument();
    expect(addButton).toHaveAttribute('data-dashboard-column', '11');
    expect(addButton).toHaveAttribute('data-dashboard-row', '1');
    expect(getComputedStyle(addButton).width).toBe('100%');
    expect(getComputedStyle(addButton).height).toBe('100%');
    expect(getComputedStyle(addButton).borderTopWidth).toBe('0px');
    expect(addButton).toHaveStyle({ outline: 'none' });

    fireEvent.pointerMove(contentGrid);
    expect(addButton).toHaveAttribute('data-dashboard-column', '11');
    expect(addButton).toHaveAttribute('data-dashboard-row', '1');
    fireEvent.pointerLeave(contentGrid);
    fireEvent.pointerMove(contentGrid);
    expect(addButton).toHaveAttribute('data-dashboard-column', '11');
    expect(addButton).toHaveAttribute('data-dashboard-row', '1');

    await user.click(addButton);
    fireEvent.pointerMove(
      document.querySelector(
        '[data-dashboard-free-cell][data-dashboard-parent-id="grid"][data-dashboard-column="11"][data-dashboard-row="0"]',
      )!,
    );
    fireEvent.pointerLeave(contentGrid);
    expect(
      screen.getByRole('menuitem', { name: /Large widget/ }),
    ).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('menuitem', { name: /Small widget/ }));

    expect(onAddItem).toHaveBeenCalledWith('small', {
      parentId: 'grid',
      parentKind: 'grid',
      parentDepth: 1,
      placement: { column: 11, row: 1, columns: 1, rows: 1 },
    });
  });

  it('keeps one permanent root add control and gives every empty tab its own container-only layout slot', async () => {
    const user = userEvent.setup();
    const onAddItem = vi.fn();
    const addItems = [
      { id: 'widget', name: 'Metric widget' },
      { id: 'grid', name: 'Grid layout', kind: 'grid' as const },
      { id: 'tabs', name: 'Tabs layout', kind: 'tabs' as const },
    ];

    renderWithRoot(
      <Dashboard isEditing addItems={addItems} onAddItem={onAddItem}>
        <Dashboard.Tabs id="analysis" aria-label="Analysis" rows={3}>
          <Dashboard.Tab id="filled" title="Filled">
            <Dashboard.Grid id="filled-layout" rows={3} />
          </Dashboard.Tab>
          <Dashboard.Tab id="empty" title="Empty" />
        </Dashboard.Tabs>
      </Dashboard>,
    );

    const rootAddButton = screen.getByRole('button', {
      name: 'Add top-level dashboard container',
    });
    expect(rootAddButton).toBeInTheDocument();
    expect(getComputedStyle(rootAddButton).borderTopWidth).toBe('0px');
    expect(
      document.querySelector(
        '[data-dashboard-add-slot][data-dashboard-parent-id="analysis:filled"]',
      ),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Empty' }));
    const tabAddButton = screen.getByRole('button', {
      name: 'Add an item at column 1, row 1 in analysis:empty',
    });
    await user.click(tabAddButton);

    expect(
      screen.queryByRole('menuitem', { name: /Metric widget/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: /Tabs layout/ }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: /Grid layout/ }));

    expect(onAddItem).toHaveBeenCalledWith('grid', {
      parentId: 'analysis:empty',
      parentKind: 'tabs',
      parentDepth: 1,
      placement: { column: 0, row: 0, columns: 12, rows: 3 },
      tabsId: 'analysis',
      tabId: 'empty',
    });
  });

  it('requires every populated tab to contain one layout container', () => {
    expect(() =>
      renderWithRoot(
        <Dashboard>
          <Dashboard.Tabs id="analysis">
            <Dashboard.Tab id="invalid" title="Invalid">
              <Dashboard.Widget id="direct-widget" />
            </Dashboard.Tab>
          </Dashboard.Tabs>
        </Dashboard>,
      ),
    ).toThrow(
      'Dashboard.Tab "invalid" inside "analysis" accepts one Grid, HorizontalStack, or VerticalStack layout container only.',
    );
  });

  it('gathers container actions and size commands under one menu after selection', async () => {
    const user = userEvent.setup();
    const onSettingsPress = vi.fn();
    const onDuplicatePress = vi.fn();
    const onDeletePress = vi.fn();
    const onMenuAction = vi.fn();
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard isEditing>
        <Dashboard.Grid id="parent" rows={3}>
          <Dashboard.Grid
            id="empty"
            aria-label="Empty layout"
            columns={3}
            rows={2}
            isResizable
            onPlacementChange={onPlacementChange}
            onSettingsPress={onSettingsPress}
            settingsLabel="Settings for empty layout"
            onDuplicatePress={onDuplicatePress}
            onDeletePress={onDeletePress}
            deleteLabel="Delete empty layout"
            actions={[{ id: 'export', name: 'Export as CSV' }]}
            onMenuAction={onMenuAction}
          />
        </Dashboard.Grid>
      </Dashboard>,
    );

    const container = screen.getByRole('group', { name: 'Empty layout' });
    expect(container).toHaveAttribute('data-dashboard-empty', 'true');
    expect(
      screen.queryByRole('button', { name: 'Actions for Empty layout' }),
    ).not.toBeInTheDocument();

    await user.click(container);
    expect(screen.getByTestId('DashboardResizeCornerGrip')).toBeInTheDocument();
    const trigger = screen.getByRole('button', {
      name: 'Actions for Empty layout',
    });
    expect(
      container.querySelectorAll('[data-dashboard-container-actions] button'),
    ).toHaveLength(1);

    await user.click(trigger);
    expect(
      screen
        .getAllByRole('menuitem')
        .map((item) => item.textContent?.trim())
        .filter(Boolean),
    ).toEqual([
      'Settings for empty layout',
      'Duplicate',
      'Export as CSV',
      'Widen',
      'Narrow',
      'Make taller',
      'Make shorter',
      'Grow on both axes',
      'Shrink on both axes',
      'Fill available space',
      'Delete empty layout',
    ]);

    await user.click(screen.getByRole('menuitem', { name: 'Export as CSV' }));
    expect(onMenuAction).toHaveBeenCalledExactlyOnceWith('export');

    // Every command reports through the same placement contract as the resize
    // handle, tagged so consumers can tell it from a drag.
    await user.click(trigger);
    await user.click(screen.getByRole('menuitem', { name: 'Widen' }));
    expect(onPlacementChange).toHaveBeenCalledExactlyOnceWith(
      { column: 0, row: 0, columns: 4, rows: 2 },
      { reason: 'resize', phase: 'commit', input: 'command' },
    );

    // Settings and Delete deselect the node, as the loose buttons used to.
    await user.click(trigger);
    await user.click(
      screen.getByRole('menuitem', { name: 'Settings for empty layout' }),
    );
    expect(onSettingsPress).toHaveBeenCalledOnce();

    await user.click(container);
    await user.click(trigger);
    await user.click(
      screen.getByRole('menuitem', { name: 'Delete empty layout' }),
    );
    expect(onDeletePress).toHaveBeenCalledOnce();
    expect(onDuplicatePress).not.toHaveBeenCalled();
  });

  it('disables the size commands a widget cannot act on', async () => {
    const user = userEvent.setup();

    renderWithRoot(
      <Dashboard isEditing>
        <Dashboard.Grid id="section" rows={2}>
          <Dashboard.Widget
            id="pinned"
            aria-label="Pinned"
            column={0}
            row={0}
            columns={12}
            rows={1}
            minRows={1}
            maxRows={2}
            isResizable
            onPlacementChange={vi.fn()}
          >
            Pinned
          </Dashboard.Widget>
          <Dashboard.Widget
            id="blocker"
            aria-label="Blocker"
            column={0}
            row={1}
            columns={12}
            rows={1}
          >
            Blocker
          </Dashboard.Widget>
        </Dashboard.Grid>
      </Dashboard>,
    );

    const widget = screen.getByRole('group', { name: 'Pinned' });
    await user.click(widget);
    await user.click(
      screen.getByRole('button', { name: 'Actions for Pinned' }),
    );

    const disabled = (name: string) =>
      screen
        .getByRole('menuitem', { name })
        .closest('li')
        ?.getAttribute('aria-disabled') === 'true';

    // Already spanning every column, so widening is capped by the parent…
    expect(disabled('Widen')).toBe(true);
    // …the sibling below blocks growing taller, even though maxRows allows it…
    expect(disabled('Make taller')).toBe(true);
    expect(disabled('Grow on both axes')).toBe(true);
    expect(disabled('Fill available space')).toBe(true);
    // …but narrowing is unobstructed, while nothing can be shorter than a row.
    expect(disabled('Narrow')).toBe(false);
    expect(disabled('Make shorter')).toBe(true);
    expect(disabled('Shrink on both axes')).toBe(true);
  });

  it('claims a dragged region for the add button and offers only items that fit it', async () => {
    const user = userEvent.setup();
    const onAddItem = vi.fn();

    renderWithRoot(
      <Dashboard
        isEditing
        gap={0}
        rowHeight={100}
        addItems={[
          {
            id: 'tile',
            name: 'Tile',
            defaultColumns: 1,
            defaultRows: 1,
            maxColumns: 1,
            maxRows: 1,
          },
          {
            id: 'panel',
            name: 'Panel',
            defaultColumns: 2,
            defaultRows: 1,
            minColumns: 2,
            maxColumns: 4,
          },
        ]}
        onAddItem={onAddItem}
      >
        <Dashboard.Grid id="grid" rows={2} />
      </Dashboard>,
    );

    const contentGrid = document.querySelector<HTMLElement>(
      '[data-dashboard-drop-target][data-dashboard-parent-id="grid"]',
    )!;
    // 12 columns over 1200px with no gap, so a column step is exactly 100px.
    mockRect(contentGrid, { left: 0, top: 0, width: 1200, height: 200 });

    // The add button only surfaces on hover of its own container.
    fireEvent.pointerMove(
      document.querySelector(
        '[data-dashboard-free-cell][data-dashboard-parent-id="grid"][data-dashboard-column="0"][data-dashboard-row="0"]',
      )!,
    );

    const addButton = screen.getByRole('button', { name: /^Add an item at/ });
    expect(addButton).toHaveAttribute('data-dashboard-columns', '1');

    await act(async () => {
      fireEvent.pointerDown(addButton, { button: 0, pointerId: 1 });
    });
    await act(async () => {
      fireEvent(window, pointerEvent('pointermove', 250, 40));
    });

    // The claim spans anchor→pointer, and the button occupies it.
    expect(addButton).toHaveAttribute('data-dashboard-columns', '3');
    expect(addButton).toHaveAttribute('data-dashboard-rows', '1');
    expect(addButton).toHaveStyle({ gridColumn: '1 / span 3' });
    expect(addButton).toHaveAccessibleName(
      'Add an item filling 3 by 1 cells from column 1, row 1 in grid',
    );

    await act(async () => {
      fireEvent(window, pointerEvent('pointerup', 250, 40));
    });

    // A claimed region is a demand: a one-cell tile cannot fill 3×1.
    expect(screen.getByRole('menuitem', { name: /Tile/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(screen.getByRole('menuitem', { name: /Panel/ }));

    expect(onAddItem).toHaveBeenCalledWith('panel', {
      parentId: 'grid',
      parentKind: 'grid',
      parentDepth: 1,
      placement: { column: 0, row: 0, columns: 3, rows: 1 },
    });
  });

  it('stops a claimed region at the first occupied cell', async () => {
    const onAddItem = vi.fn();

    renderWithRoot(
      <Dashboard
        isEditing
        gap={0}
        rowHeight={100}
        addItems={[{ id: 'panel', name: 'Panel', maxColumns: 12 }]}
        onAddItem={onAddItem}
      >
        <Dashboard.Grid id="grid" rows={1}>
          <Dashboard.Widget id="blocker" column={3} row={0} columns={1} />
        </Dashboard.Grid>
      </Dashboard>,
    );

    const contentGrid = document.querySelector<HTMLElement>(
      '[data-dashboard-drop-target][data-dashboard-parent-id="grid"]',
    )!;
    mockRect(contentGrid, { left: 0, top: 0, width: 1200, height: 100 });

    // The add button only surfaces on hover of its own container.
    fireEvent.pointerMove(
      document.querySelector(
        '[data-dashboard-free-cell][data-dashboard-parent-id="grid"][data-dashboard-column="0"][data-dashboard-row="0"]',
      )!,
    );

    const addButton = screen.getByRole('button', { name: /^Add an item at/ });

    await act(async () => {
      fireEvent.pointerDown(addButton, { button: 0, pointerId: 1 });
    });
    // Column 7 is free, but column 3 is not — a region cannot jump the blocker.
    await act(async () => {
      fireEvent(window, pointerEvent('pointermove', 750, 40));
    });

    expect(addButton).toHaveAttribute('data-dashboard-columns', '3');
  });

  it('abandons a claimed region on Escape and recovers on the next press', async () => {
    const user = userEvent.setup();

    renderWithRoot(
      <Dashboard
        isEditing
        gap={0}
        rowHeight={100}
        addItems={[{ id: 'panel', name: 'Panel', maxColumns: 12 }]}
        onAddItem={vi.fn()}
      >
        <Dashboard.Grid id="grid" rows={1} />
      </Dashboard>,
    );

    const contentGrid = document.querySelector<HTMLElement>(
      '[data-dashboard-drop-target][data-dashboard-parent-id="grid"]',
    )!;
    mockRect(contentGrid, { left: 0, top: 0, width: 1200, height: 100 });

    // The add button only surfaces on hover of its own container.
    fireEvent.pointerMove(
      document.querySelector(
        '[data-dashboard-free-cell][data-dashboard-parent-id="grid"][data-dashboard-column="0"][data-dashboard-row="0"]',
      )!,
    );

    const addButton = screen.getByRole('button', { name: /^Add an item at/ });

    await act(async () => {
      fireEvent.pointerDown(addButton, { button: 0, pointerId: 1 });
    });
    await act(async () => {
      fireEvent(window, pointerEvent('pointermove', 250, 40));
    });
    expect(addButton).toHaveAttribute('data-dashboard-columns', '3');

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(addButton).toHaveAttribute('data-dashboard-columns', '1');

    // `usePress` does not cancel a press on Escape, so the release still
    // reaches the button's own press handler. It must not open a menu for the
    // area the user just abandoned.
    await user.click(addButton);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    // …and the next press must still work: an abandoned claim suppresses one
    // release, not the button.
    await user.click(addButton);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('grows a claimed region from the keyboard with Shift and the arrow keys', async () => {
    const user = userEvent.setup();
    const onAddItem = vi.fn();

    renderWithRoot(
      <Dashboard
        isEditing
        addItems={[{ id: 'panel', name: 'Panel', maxColumns: 12, maxRows: 4 }]}
        onAddItem={onAddItem}
      >
        <Dashboard.Grid id="grid" rows={2} />
      </Dashboard>,
    );

    // The add button only surfaces on hover of its own container.
    fireEvent.pointerMove(
      document.querySelector(
        '[data-dashboard-free-cell][data-dashboard-parent-id="grid"][data-dashboard-column="0"][data-dashboard-row="0"]',
      )!,
    );

    const addButton = screen.getByRole('button', { name: /^Add an item at/ });

    fireEvent.keyDown(addButton, { key: 'ArrowRight', shiftKey: true });
    fireEvent.keyDown(addButton, { key: 'ArrowDown', shiftKey: true });
    expect(addButton).toHaveAttribute('data-dashboard-columns', '2');
    expect(addButton).toHaveAttribute('data-dashboard-rows', '2');

    // Shift back the way it came, so the claim is adjustable, not one-way.
    fireEvent.keyDown(addButton, { key: 'ArrowLeft', shiftKey: true });
    expect(addButton).toHaveAttribute('data-dashboard-columns', '1');

    addButton.focus();
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('menuitem', { name: /Panel/ }));

    expect(onAddItem).toHaveBeenCalledWith('panel', {
      parentId: 'grid',
      parentKind: 'grid',
      parentDepth: 1,
      placement: { column: 0, row: 0, columns: 1, rows: 2 },
    });
  });

  it('briefly reveals a container added after the initial layout mounts', () => {
    const { rerender } = renderWithRoot(
      <Dashboard isEditing>
        <Dashboard.Grid id="initial" aria-label="Initial" />
      </Dashboard>,
    );

    expect(screen.getByRole('group', { name: 'Initial' })).not.toHaveAttribute(
      'data-arriving',
    );

    vi.useFakeTimers();
    try {
      rerender(
        <Dashboard isEditing>
          <Dashboard.Grid id="initial" aria-label="Initial" />
          <Dashboard.Grid id="arriving" aria-label="Arriving" />
        </Dashboard>,
      );

      const arriving = screen.getByRole('group', { name: 'Arriving' });
      expect(arriving).toHaveAttribute('data-arriving', 'true');

      act(() => vi.advanceTimersByTime(1000));
      expect(arriving).not.toHaveAttribute('data-arriving');
    } finally {
      vi.useRealTimers();
    }
  });

  it('supports sibling multi-selection and blocks descendants of a selected container', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();

    renderWithRoot(
      <Dashboard onSelectionChange={onSelectionChange}>
        <Dashboard.Grid id="section" aria-label="Section" rows={1}>
          <Dashboard.Widget id="first" aria-label="First widget" columns={6}>
            First
          </Dashboard.Widget>
          <Dashboard.Widget
            id="second"
            aria-label="Second widget"
            column={6}
            columns={6}
          >
            Second
          </Dashboard.Widget>
        </Dashboard.Grid>
      </Dashboard>,
    );

    const first = screen.getByRole('group', { name: 'First widget' });
    const second = screen.getByRole('group', { name: 'Second widget' });
    const section = screen.getByRole('group', { name: 'Section' });

    await user.click(first);
    expect(onSelectionChange).toHaveBeenLastCalledWith(['first']);

    await user.keyboard('{Shift>}');
    await user.click(second);
    await user.keyboard('{/Shift}');
    expect(onSelectionChange).toHaveBeenLastCalledWith(['first', 'second']);

    await user.click(section);
    expect(onSelectionChange).toHaveBeenLastCalledWith(['section']);

    const callsBeforeBlockedSelection = onSelectionChange.mock.calls.length;
    await user.keyboard('{Shift>}');
    await user.click(first);
    await user.keyboard('{/Shift}');
    expect(onSelectionChange).toHaveBeenCalledTimes(
      callsBeforeBlockedSelection,
    );
  });

  it('clears selection when dashboard whitespace is pressed', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();

    renderWithRoot(
      <Dashboard qa="Dashboard" onSelectionChange={onSelectionChange}>
        <Dashboard.Grid id="section" rows={1}>
          <Dashboard.Widget id="metric" aria-label="Metric">
            Metric
          </Dashboard.Widget>
        </Dashboard.Grid>
      </Dashboard>,
    );

    const widget = screen.getByRole('group', { name: 'Metric' });
    await user.click(widget);
    expect(widget).toHaveAttribute('data-selected', 'true');

    fireEvent.click(screen.getByTestId('Dashboard'));

    expect(widget).not.toHaveAttribute('data-selected');
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
  });

  it('clears selection when the click lands outside the dashboard entirely', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();

    renderWithRoot(
      <>
        <button type="button">Elsewhere</button>
        <Dashboard qa="Dashboard" onSelectionChange={onSelectionChange}>
          <Dashboard.Grid id="section" rows={1}>
            <Dashboard.Widget
              id="metric"
              aria-label="Metric"
              columns={12}
              actions={[
                { id: 'export', name: 'Export' },
                { id: 'archive', name: 'Archive', isDisabled: true },
              ]}
              onMenuAction={vi.fn()}
            >
              Metric
            </Dashboard.Widget>
          </Dashboard.Grid>
        </Dashboard>
      </>,
    );

    const widget = screen.getByRole('group', { name: 'Metric' });
    await user.click(widget);
    expect(widget).toHaveAttribute('data-selected', 'true');

    // The node's own menu is portaled out of the Dashboard's subtree, so a
    // press inside it must not read as an outside click. A disabled item keeps
    // the menu open and the target attached, which is the case a plain
    // `contains()` on the Dashboard would get wrong.
    await user.click(
      screen.getByRole('button', { name: 'Actions for Metric' }),
    );
    await user.click(screen.getByRole('menuitem', { name: 'Archive' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(widget).toHaveAttribute('data-selected', 'true');
    expect(onSelectionChange).toHaveBeenLastCalledWith(['metric']);

    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));

    expect(screen.getByRole('group', { name: 'Metric' })).not.toHaveAttribute(
      'data-selected',
    );
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
  });

  it('reveals one action menu for the selected widget', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const onSettingsPress = vi.fn();
    const onDeletePress = vi.fn();

    renderWithRoot(
      <Dashboard onSelectionChange={onSelectionChange}>
        <Dashboard.Grid id="section" rows={1}>
          <Dashboard.Widget
            id="metric"
            aria-label="Revenue metric"
            columns={12}
            settingsLabel="Settings for revenue metric"
            deleteLabel="Delete revenue metric"
            onSettingsPress={onSettingsPress}
            onDeletePress={onDeletePress}
          >
            Revenue
          </Dashboard.Widget>
        </Dashboard.Grid>
      </Dashboard>,
    );

    expect(
      screen.queryByRole('button', { name: 'Actions for Revenue metric' }),
    ).not.toBeInTheDocument();

    const widget = screen.getByRole('group', { name: 'Revenue metric' });
    await user.click(widget);
    // The raise lives on the painted surface, not on the placement wrapper or
    // the container, so node controls are never trapped in a nested context.
    expect(
      getComputedStyle(screen.getByRole('group', { name: 'section' })),
    ).toHaveProperty('zIndex', 'auto');
    expect(getComputedStyle(widget)).toHaveProperty('zIndex', 'auto');
    expect(getComputedStyle(widget.firstElementChild!)).toHaveProperty(
      'zIndex',
      '3',
    );
    const trigger = screen.getByRole('button', {
      name: 'Actions for Revenue metric',
    });
    expect(
      widget.querySelectorAll('[data-dashboard-widget-actions] button'),
    ).toHaveLength(1);

    // Without `onPlacementChange` there is nothing to resize, so the size
    // section drops out and only the consumer's own actions remain.
    await user.click(trigger);
    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent?.trim()),
    ).toEqual(['Settings for revenue metric', 'Delete revenue metric']);
    expect(
      screen
        .getByRole('menuitem', { name: 'Delete revenue metric' })
        .closest('li'),
    ).toHaveAttribute('data-theme', 'danger');

    await user.click(
      screen.getByRole('menuitem', { name: 'Settings for revenue metric' }),
    );
    await user.click(widget);
    await user.click(trigger);
    await user.click(
      screen.getByRole('menuitem', { name: 'Delete revenue metric' }),
    );

    expect(onSelectionChange).toHaveBeenLastCalledWith(['metric']);
    expect(onSettingsPress).toHaveBeenCalledOnce();
    expect(onDeletePress).toHaveBeenCalledOnce();
  });

  it('renders root-only tab declarations as accessible tabs', () => {
    renderWithRoot(
      <Dashboard>
        <Dashboard.Tabs id="analysis" aria-label="Analysis" rows={1}>
          <Dashboard.Tab id="insights" title="Insights">
            <Dashboard.Grid id="insights-layout">
              <Dashboard.Widget id="trend" aria-label="Trend" columns={12}>
                Trend content
              </Dashboard.Widget>
            </Dashboard.Grid>
          </Dashboard.Tab>
          <Dashboard.Tab id="audience" title="Audience" />
        </Dashboard.Tabs>
      </Dashboard>,
    );

    expect(screen.getByRole('tab', { name: 'Insights' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Audience' })).toBeInTheDocument();
    expect(screen.getByText('Trend content')).toBeInTheDocument();
  });

  it('moves a widget by one grid unit with the keyboard', async () => {
    const user = userEvent.setup();
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard>
        <Dashboard.Grid id="section" rows={3}>
          <Dashboard.Widget
            id="metric"
            aria-label="Metric"
            column={0}
            row={0}
            columns={2}
            rows={1}
            isMovable
            moveLabel="Move metric"
            onPlacementChange={onPlacementChange}
          >
            Metric
          </Dashboard.Widget>
        </Dashboard.Grid>
      </Dashboard>,
    );

    const movableWidget = screen.getByRole('group', { name: 'Move metric' });
    movableWidget.focus();
    await user.keyboard('{ArrowRight}');

    expect(onPlacementChange).toHaveBeenCalledWith(
      { column: 1, row: 0, columns: 2, rows: 1 },
      { reason: 'move', phase: 'preview', input: 'keyboard' },
    );
    expect(onPlacementChange).toHaveBeenLastCalledWith(
      { column: 1, row: 0, columns: 2, rows: 1 },
      { reason: 'move', phase: 'commit', input: 'keyboard' },
    );
  });

  it('reports a widget move into the deepest nested container under the pointer', () => {
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard qa="Dashboard">
        <Dashboard.Grid id="outer" rows={2} qa="Outer">
          <Dashboard.Grid id="source" aria-label="Source" columns={6} rows={2}>
            <Dashboard.Widget
              id="metric"
              aria-label="Metric"
              columns={2}
              rows={1}
              isMovable
              onPlacementChange={onPlacementChange}
            >
              Metric
            </Dashboard.Widget>
          </Dashboard.Grid>
          <Dashboard.Grid
            id="destination"
            aria-label="Destination"
            column={6}
            columns={6}
            rows={2}
          >
            <Dashboard.Widget
              id="destination-add"
              columns={2}
              rows={1}
              isSelectable={false}
              data-dashboard-add-slot=""
            >
              <button type="button">Add to destination</button>
            </Dashboard.Widget>
          </Dashboard.Grid>
        </Dashboard.Grid>
      </Dashboard>,
    );

    const dashboard = screen.getByTestId('Dashboard');
    const contents = screen.getAllByTestId('DashboardContainerContent');
    const metric = screen.getByRole('group', { name: 'Metric' });
    const addSlot = screen.getByRole('group', { name: 'destination-add' });
    mockRect(dashboard, { left: 0, top: 0, width: 1200, height: 400 });
    mockRect(contents[0], { left: 0, top: 0, width: 1200, height: 192 });
    mockRect(contents[1], { left: 0, top: 0, width: 592, height: 192 });
    mockRect(contents[2], { left: 608, top: 0, width: 592, height: 192 });
    mockRect(metric, { left: 0, top: 0, width: 186, height: 80 });

    fireEvent(metric, pointerEvent('pointerdown', 20, 20));
    fireEvent(window, pointerEvent('pointermove', 628, 20));

    const placeholder = screen.getByTestId('DashboardDropPlaceholder');
    expect(contents[2]).toContainElement(placeholder);
    expect(placeholder).toHaveAttribute('data-dashboard-drop-status', 'valid');
    expect(placeholder).toHaveAttribute(
      'data-dashboard-drop-covers-add-slot',
      'true',
    );
    expect(addSlot).toHaveStyle({ visibility: 'hidden' });
    expect(placeholder).toHaveStyle({
      gridColumn: '1 / span 2',
      gridRow: '1 / span 1',
    });

    fireEvent(window, pointerEvent('pointerup', 628, 20));
    expect(
      screen.queryByTestId('DashboardDropPlaceholder'),
    ).not.toBeInTheDocument();
    expect(addSlot).toHaveStyle({ visibility: 'visible' });

    expect(onPlacementChange).toHaveBeenCalledWith(
      { column: 0, row: 0, columns: 2, rows: 1 },
      {
        reason: 'move',
        phase: 'preview',
        input: 'pointer',
        sourceParentId: 'source',
        destinationParentId: 'destination',
      },
    );
    expect(onPlacementChange).toHaveBeenLastCalledWith(
      { column: 0, row: 0, columns: 2, rows: 1 },
      {
        reason: 'move',
        phase: 'commit',
        input: 'pointer',
        sourceParentId: 'source',
        destinationParentId: 'destination',
      },
    );
  });

  it.each([
    {
      name: 'height in a horizontal stack',
      kind: 'horizontal' as const,
      expected: { column: 0, row: 0, columns: 2, rows: 2 },
    },
    {
      name: 'width in a vertical stack',
      kind: 'vertical' as const,
      expected: { column: 0, row: 0, columns: 4, rows: 1 },
    },
  ])(
    'stretches a dropped widget $name within its constraints',
    ({ kind, expected }) => {
      const onPlacementChange = vi.fn();
      const Destination =
        kind === 'horizontal'
          ? Dashboard.HorizontalStack
          : Dashboard.VerticalStack;

      renderWithRoot(
        <Dashboard qa="Dashboard">
          <Dashboard.Grid id="outer" rows={3}>
            <Dashboard.Grid
              id="source"
              columns={kind === 'vertical' ? 2 : 6}
              rows={kind === 'horizontal' ? 1 : 3}
            >
              <Dashboard.Widget
                id="metric"
                aria-label="Metric"
                columns={2}
                rows={1}
                maxColumns={4}
                maxRows={2}
                isMovable
                onPlacementChange={onPlacementChange}
              >
                Metric
              </Dashboard.Widget>
            </Dashboard.Grid>
            <Destination id="destination" column={6} columns={6} rows={3} />
          </Dashboard.Grid>
        </Dashboard>,
      );

      const dashboard = screen.getByTestId('Dashboard');
      const contents = screen.getAllByTestId('DashboardContainerContent');
      const metric = screen.getByRole('group', { name: 'Metric' });
      mockRect(dashboard, { left: 0, top: 0, width: 1200, height: 400 });
      mockRect(contents[0], { left: 0, top: 0, width: 1200, height: 288 });
      mockRect(contents[1], {
        left: 0,
        top: 0,
        width: kind === 'vertical' ? 186 : 592,
        height: kind === 'horizontal' ? 80 : 288,
      });
      mockRect(contents[2], { left: 608, top: 0, width: 592, height: 288 });
      mockRect(metric, { left: 0, top: 0, width: 186, height: 80 });

      fireEvent(metric, pointerEvent('pointerdown', 20, 20));
      fireEvent(window, pointerEvent('pointermove', 628, 20));
      fireEvent(window, pointerEvent('pointerup', 628, 20));

      expect(onPlacementChange).toHaveBeenLastCalledWith(expected, {
        reason: 'move',
        phase: 'commit',
        input: 'pointer',
        sourceParentId: 'source',
        destinationParentId: 'destination',
      });
    },
  );

  it('renders a danger placeholder for an occupied cross-container landing', () => {
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard qa="Dashboard">
        <Dashboard.Grid id="outer" rows={2}>
          <Dashboard.Grid id="source" columns={6} rows={2}>
            <Dashboard.Widget
              id="metric"
              aria-label="Metric"
              columns={2}
              rows={1}
              isMovable
              onPlacementChange={onPlacementChange}
            >
              Metric
            </Dashboard.Widget>
          </Dashboard.Grid>
          <Dashboard.Grid id="destination" column={6} columns={6} rows={2}>
            <Dashboard.Widget id="blocker" columns={2} rows={1}>
              Blocker
            </Dashboard.Widget>
          </Dashboard.Grid>
        </Dashboard.Grid>
      </Dashboard>,
    );

    const dashboard = screen.getByTestId('Dashboard');
    const contents = screen.getAllByTestId('DashboardContainerContent');
    const metric = screen.getByRole('group', { name: 'Metric' });
    mockRect(dashboard, { left: 0, top: 0, width: 1200, height: 400 });
    mockRect(contents[0], { left: 0, top: 0, width: 1200, height: 192 });
    mockRect(contents[1], { left: 0, top: 0, width: 592, height: 192 });
    mockRect(contents[2], { left: 608, top: 0, width: 592, height: 192 });
    mockRect(metric, { left: 0, top: 0, width: 186, height: 80 });

    fireEvent(metric, pointerEvent('pointerdown', 20, 20));
    fireEvent(window, pointerEvent('pointermove', 628, 20));

    expect(screen.getByTestId('DashboardDropPlaceholder')).toHaveAttribute(
      'data-dashboard-drop-status',
      'danger',
    );

    fireEvent(window, pointerEvent('pointerup', 628, 20));

    expect(onPlacementChange).toHaveBeenCalledWith(
      { column: 0, row: 0, columns: 2, rows: 1 },
      expect.objectContaining({
        reason: 'move',
        phase: 'preview',
        destinationParentId: 'destination',
      }),
    );
    expect(onPlacementChange).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ phase: 'commit' }),
    );
  });

  it('renders and commits one destination placeholder per selected sibling', () => {
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard qa="Dashboard" defaultSelectedKeys={['first', 'second']}>
        <Dashboard.Grid id="outer" rows={2}>
          <Dashboard.Grid id="source" columns={6} rows={2}>
            <Dashboard.Widget
              id="first"
              aria-label="First"
              column={0}
              columns={2}
              rows={1}
              isMovable
              onPlacementChange={onPlacementChange}
            >
              First
            </Dashboard.Widget>
            <Dashboard.Widget
              id="second"
              aria-label="Second"
              column={2}
              columns={2}
              rows={1}
              isMovable
              onPlacementChange={() => {}}
            >
              Second
            </Dashboard.Widget>
          </Dashboard.Grid>
          <Dashboard.Grid id="destination" column={6} columns={6} rows={2} />
        </Dashboard.Grid>
      </Dashboard>,
    );

    const dashboard = screen.getByTestId('Dashboard');
    const contents = screen.getAllByTestId('DashboardContainerContent');
    const first = screen.getByRole('group', { name: 'First' });
    mockRect(dashboard, { left: 0, top: 0, width: 1200, height: 400 });
    mockRect(contents[0], { left: 0, top: 0, width: 1200, height: 192 });
    mockRect(contents[1], { left: 0, top: 0, width: 592, height: 192 });
    mockRect(contents[2], { left: 608, top: 0, width: 592, height: 192 });
    mockRect(first, { left: 0, top: 0, width: 186, height: 80 });

    fireEvent(first, pointerEvent('pointerdown', 20, 20));
    fireEvent(window, pointerEvent('pointermove', 628, 20));

    const placeholders = screen.getAllByTestId('DashboardDropPlaceholder');
    expect(placeholders).toHaveLength(2);
    expect(
      placeholders.map((item) => item.dataset.dashboardDropItemId),
    ).toEqual(['first', 'second']);
    expect(
      placeholders.every(
        (item) => item.dataset.dashboardDropStatus === 'valid',
      ),
    ).toBe(true);

    fireEvent(window, pointerEvent('pointerup', 628, 20));

    expect(onPlacementChange).toHaveBeenLastCalledWith(
      { column: 0, row: 0, columns: 2, rows: 1 },
      {
        reason: 'move',
        phase: 'commit',
        input: 'pointer',
        sourceParentId: 'source',
        destinationParentId: 'destination',
        items: [
          {
            id: 'first',
            placement: { column: 0, row: 0, columns: 2, rows: 1 },
          },
          {
            id: 'second',
            placement: { column: 2, row: 0, columns: 2, rows: 1 },
          },
        ],
      },
    );
  });

  it('falls back to an enclosing destination when the deepest one cannot fit', () => {
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard qa="Dashboard">
        <Dashboard.Grid id="outer" rows={2}>
          <Dashboard.Grid id="source" columns={6} rows={2}>
            <Dashboard.Widget
              id="metric"
              aria-label="Metric"
              columns={2}
              rows={1}
              minColumns={2}
              isMovable
              onPlacementChange={onPlacementChange}
            >
              Metric
            </Dashboard.Widget>
          </Dashboard.Grid>
          <Dashboard.Grid id="destination" column={6} columns={1} rows={2} />
        </Dashboard.Grid>
      </Dashboard>,
    );

    const dashboard = screen.getByTestId('Dashboard');
    const contents = screen.getAllByTestId('DashboardContainerContent');
    const metric = screen.getByRole('group', { name: 'Metric' });
    mockRect(dashboard, { left: 0, top: 0, width: 1200, height: 400 });
    mockRect(contents[0], { left: 0, top: 0, width: 1200, height: 192 });
    mockRect(contents[1], { left: 0, top: 0, width: 592, height: 192 });
    mockRect(contents[2], { left: 608, top: 0, width: 90, height: 192 });
    mockRect(metric, { left: 0, top: 0, width: 186, height: 80 });

    fireEvent(metric, pointerEvent('pointerdown', 20, 20));
    fireEvent(window, pointerEvent('pointermove', 628, 20));

    // The one-column destination cannot hold a two-column minimum, so it is
    // skipped and the enclosing grid — also under the pointer — is offered
    // instead. It has the geometry but the destination container occupies that
    // region, so the landing is reported as danger and never commits.
    const placeholder = screen.getByTestId('DashboardDropPlaceholder');
    expect(placeholder).toHaveAttribute('data-dashboard-drop-status', 'danger');
    expect(contents[0]).toContainElement(placeholder);

    fireEvent(window, pointerEvent('pointerup', 628, 20));
    expect(onPlacementChange).toHaveBeenCalledTimes(1);
    expect(onPlacementChange).toHaveBeenCalledWith(
      { column: 6, row: 0, columns: 2, rows: 1 },
      {
        reason: 'move',
        phase: 'preview',
        input: 'pointer',
        isBlocked: true,
        sourceParentId: 'source',
        destinationParentId: 'outer',
      },
    );
  });

  it('restores the origin and commits nothing when Escape cancels a move', () => {
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard qa="Dashboard">
        <Dashboard.Grid id="source" columns={12} rows={2}>
          <Dashboard.Widget
            id="metric"
            aria-label="Metric"
            columns={2}
            rows={1}
            isMovable
            onPlacementChange={onPlacementChange}
          >
            Metric
          </Dashboard.Widget>
        </Dashboard.Grid>
      </Dashboard>,
    );

    const dashboard = screen.getByTestId('Dashboard');
    const content = screen.getByTestId('DashboardContainerContent');
    const metric = screen.getByRole('group', { name: 'Metric' });
    mockRect(dashboard, { left: 0, top: 0, width: 1200, height: 400 });
    mockRect(content, { left: 0, top: 0, width: 1200, height: 192 });
    mockRect(metric, { left: 0, top: 0, width: 186, height: 80 });

    fireEvent(metric, pointerEvent('pointerdown', 20, 20));
    fireEvent(window, pointerEvent('pointermove', 425, 20));
    expect(onPlacementChange).toHaveBeenLastCalledWith(
      { column: 4, row: 0, columns: 2, rows: 1 },
      { reason: 'move', phase: 'preview', input: 'pointer' },
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    // The consumer has been applying every preview, so cancelling has to hand
    // the origin back rather than simply skipping the commit.
    expect(onPlacementChange).toHaveBeenLastCalledWith(
      { column: 0, row: 0, columns: 2, rows: 1 },
      { reason: 'move', phase: 'commit', input: 'pointer' },
    );
    expect(
      screen.queryByTestId('DashboardDropPlaceholder'),
    ).not.toBeInTheDocument();

    const callsAfterEscape = onPlacementChange.mock.calls.length;
    fireEvent(window, pointerEvent('pointermove', 700, 20));
    fireEvent(window, pointerEvent('pointerup', 700, 20));
    expect(onPlacementChange).toHaveBeenCalledTimes(callsAfterEscape);
  });

  it('never targets a nested Dashboard as a destination', () => {
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard qa="Dashboard">
        <Dashboard.Grid id="source" columns={12} rows={2}>
          <Dashboard.Widget
            id="metric"
            aria-label="Metric"
            columns={2}
            rows={1}
            isMovable
            onPlacementChange={onPlacementChange}
          >
            Metric
          </Dashboard.Widget>
          <Dashboard.Widget id="host" column={6} columns={6} rows={2}>
            <Dashboard qa="Inner">
              <Dashboard.Grid id="inner-grid" columns={12} rows={2}>
                <Dashboard.Widget id="inner-metric" aria-label="Inner metric">
                  Inner
                </Dashboard.Widget>
              </Dashboard.Grid>
            </Dashboard>
          </Dashboard.Widget>
        </Dashboard.Grid>
      </Dashboard>,
    );

    const contents = screen.getAllByTestId('DashboardContainerContent');
    mockRect(screen.getByTestId('Dashboard'), {
      left: 0,
      top: 0,
      width: 1200,
      height: 400,
    });
    mockRect(screen.getByTestId('Inner'), {
      left: 600,
      top: 0,
      width: 600,
      height: 192,
    });
    mockRect(contents[0], { left: 0, top: 0, width: 1200, height: 192 });
    // The inner Dashboard's grid restarts at depth 1, so before it was scoped
    // out it beat the outer grid on the depth sort and handed the outer
    // consumer a `destinationParentId` from a tree it does not own.
    mockRect(contents[1], { left: 600, top: 0, width: 600, height: 192 });
    const metric = screen.getByRole('group', { name: 'Metric' });
    mockRect(metric, { left: 0, top: 0, width: 186, height: 80 });

    fireEvent(metric, pointerEvent('pointerdown', 20, 20));
    fireEvent(window, pointerEvent('pointermove', 700, 20));

    // The move stays inside the outer tree: the placeholder is drawn in the
    // widget's own grid, not in the nested Dashboard the pointer is over.
    const placeholder = screen.getByTestId('DashboardDropPlaceholder');
    expect(contents[0]).toContainElement(placeholder);
    expect(contents[1]).not.toContainElement(placeholder);

    fireEvent(window, pointerEvent('pointerup', 700, 20));
    expect(onPlacementChange).toHaveBeenCalled();
    for (const [, info] of onPlacementChange.mock.calls) {
      expect(info.destinationParentId).not.toBe('inner-grid');
    }
  });

  it('hit-tests against geometry frozen at the start of the gesture', () => {
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard qa="Dashboard">
        <Dashboard.Grid id="outer" rows={2}>
          <Dashboard.Grid id="source" columns={6} rows={2}>
            <Dashboard.Widget
              id="metric"
              aria-label="Metric"
              columns={2}
              rows={1}
              isMovable
              onPlacementChange={onPlacementChange}
            >
              Metric
            </Dashboard.Widget>
          </Dashboard.Grid>
          <Dashboard.Grid id="destination" column={6} columns={6} rows={2} />
        </Dashboard.Grid>
      </Dashboard>,
    );

    const contents = screen.getAllByTestId('DashboardContainerContent');
    const metric = screen.getByRole('group', { name: 'Metric' });
    mockRect(screen.getByTestId('Dashboard'), {
      left: 0,
      top: 0,
      width: 1200,
      height: 400,
    });
    mockRect(contents[0], { left: 0, top: 0, width: 1200, height: 192 });
    mockRect(contents[1], { left: 0, top: 0, width: 592, height: 192 });
    mockRect(contents[2], { left: 608, top: 0, width: 592, height: 192 });
    mockRect(metric, { left: 0, top: 0, width: 186, height: 80 });

    fireEvent(metric, pointerEvent('pointerdown', 20, 20));
    fireEvent(window, pointerEvent('pointermove', 628, 20));
    expect(onPlacementChange).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ destinationParentId: 'destination' }),
    );

    // Reflowing the layout under the pointer must not move the destination the
    // gesture is aiming at; otherwise the preview the consumer applies feeds
    // back into the next frame's hit test and the drop oscillates.
    mockRect(contents[2], { left: 900, top: 0, width: 300, height: 192 });
    fireEvent(window, pointerEvent('pointermove', 640, 20));
    fireEvent(window, pointerEvent('pointerup', 640, 20));

    expect(onPlacementChange).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        phase: 'commit',
        destinationParentId: 'destination',
      }),
    );
  });

  it('reports a nested container move back to the dashboard root', () => {
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard qa="Dashboard">
        <Dashboard.Grid id="outer" aria-label="Outer" rows={2} qa="Outer">
          <Dashboard.Grid
            id="nested"
            aria-label="Nested"
            columns={6}
            rows={1}
            isMovable
            onPlacementChange={onPlacementChange}
          />
        </Dashboard.Grid>
      </Dashboard>,
    );

    const dashboard = screen.getByTestId('Dashboard');
    const outer = screen.getByTestId('Outer');
    const contents = screen.getAllByTestId('DashboardContainerContent');
    const nested = screen.getByRole('group', { name: 'Nested' });
    mockRect(dashboard, { left: 0, top: 0, width: 1200, height: 500 });
    mockRect(outer, { left: 0, top: 0, width: 1200, height: 192 });
    mockRect(contents[0], { left: 0, top: 0, width: 1200, height: 192 });
    mockRect(contents[1], { left: 0, top: 0, width: 592, height: 80 });
    mockRect(nested, { left: 0, top: 0, width: 592, height: 80 });

    fireEvent(nested, pointerEvent('pointerdown', 20, 20));
    fireEvent(window, pointerEvent('pointermove', 20, 320));
    fireEvent(window, pointerEvent('pointerup', 20, 320));

    expect(onPlacementChange).toHaveBeenLastCalledWith(
      { column: 0, row: 1, columns: 12, rows: 1 },
      {
        reason: 'move',
        phase: 'commit',
        input: 'pointer',
        sourceParentId: 'outer',
        destinationParentId: null,
      },
    );
  });

  it('moves from the widget surface but not from an action element', () => {
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard qa="Dashboard" isEditing>
        <Dashboard.Grid id="section" aria-label="Section" rows={2}>
          <Dashboard.Widget
            id="metric"
            aria-label="Metric"
            moveLabel="Move metric"
            columns={2}
            rows={1}
            isMovable
            onPlacementChange={onPlacementChange}
          >
            <span>Drag area</span>
            <button type="button">Widget action</button>
          </Dashboard.Widget>
        </Dashboard.Grid>
      </Dashboard>,
    );

    const dashboard = screen.getByTestId('Dashboard');
    const content = screen.getByTestId('DashboardContainerContent');
    const metric = screen.getByRole('group', { name: 'Move metric' });
    const dragArea = screen.getByText('Drag area');
    mockRect(dashboard, { left: 0, top: 0, width: 1200, height: 192 });
    mockRect(content, { left: 0, top: 0, width: 1200, height: 192 });
    mockRect(metric, { left: 0, top: 0, width: 186, height: 80 });
    fireEvent(dragArea, pointerEvent('pointerdown', 0, 0));
    fireEvent(window, pointerEvent('pointermove', 100, 0));

    expect(screen.getByTestId('Dashboard')).toHaveAttribute('data-dragging');
    expect(screen.getByRole('group', { name: 'Section' })).toHaveAttribute(
      'data-dragging',
    );

    fireEvent(window, pointerEvent('pointerup', 100, 0));
    expect(onPlacementChange).toHaveBeenCalledWith(
      expect.objectContaining({ column: expect.any(Number) }),
      { reason: 'move', phase: 'preview', input: 'pointer' },
    );
    expect(screen.getByTestId('Dashboard')).not.toHaveAttribute(
      'data-dragging',
    );

    onPlacementChange.mockClear();
    const action = screen.getByRole('button', { name: 'Widget action' });
    fireEvent(action, pointerEvent('pointerdown', 0, 0));
    fireEvent(window, pointerEvent('pointermove', 100, 0));
    fireEvent(window, pointerEvent('pointerup', 100, 0));

    expect(onPlacementChange).not.toHaveBeenCalled();
  });

  it('moves a top-level container from its focused surface', async () => {
    const user = userEvent.setup();
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard>
        <Dashboard.Grid
          id="section"
          aria-label="Section"
          moveLabel="Move section"
          row={1}
          rows={2}
          isMovable
          onPlacementChange={onPlacementChange}
        />
      </Dashboard>,
    );

    const container = screen.getByRole('group', { name: 'Move section' });
    container.focus();
    await user.keyboard('{ArrowUp}');

    expect(onPlacementChange).toHaveBeenLastCalledWith(
      { column: 0, row: 0, columns: 12, rows: 2 },
      { reason: 'move', phase: 'commit', input: 'keyboard' },
    );
  });

  it('moves a nested container on the axes allowed by its parent', async () => {
    const user = userEvent.setup();
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard>
        <Dashboard.Grid id="parent" rows={3}>
          <Dashboard.Grid
            id="nested"
            aria-label="Nested"
            moveLabel="Move nested"
            columns={4}
            rows={2}
            isMovable
            onPlacementChange={onPlacementChange}
          />
        </Dashboard.Grid>
      </Dashboard>,
    );

    const container = screen.getByRole('group', { name: 'Move nested' });
    container.focus();
    await user.keyboard('{ArrowRight}');

    expect(onPlacementChange).toHaveBeenLastCalledWith(
      { column: 1, row: 0, columns: 4, rows: 2 },
      { reason: 'move', phase: 'commit', input: 'keyboard' },
    );
  });

  it('supports exactly three container levels', () => {
    renderWithRoot(
      <Dashboard>
        <Dashboard.Grid id="first" qa="First" rows={2}>
          <Dashboard.Grid id="second" qa="Second" columns={6} rows={2}>
            <Dashboard.Grid id="third" qa="Third" columns={3} rows={1} />
          </Dashboard.Grid>
        </Dashboard.Grid>
      </Dashboard>,
    );

    expect(screen.getByTestId('First')).toHaveAttribute(
      'data-dashboard-depth',
      '1',
    );
    expect(screen.getByTestId('Second')).toHaveAttribute(
      'data-dashboard-depth',
      '2',
    );
    expect(screen.getByTestId('Third')).toHaveAttribute(
      'data-dashboard-depth',
      '3',
    );
  });

  it('uses a horizontal resize handle when only columns can change', async () => {
    const user = userEvent.setup();
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard>
        <Dashboard.Grid id="section" rows={2}>
          <Dashboard.Widget
            id="wide"
            aria-label="Wide metric"
            columns={2}
            rows={1}
            minColumns={2}
            maxColumns={6}
            minRows={1}
            maxRows={1}
            isResizable
            resizeLabel="Resize wide metric"
            onPlacementChange={onPlacementChange}
          >
            Wide metric
          </Dashboard.Widget>
        </Dashboard.Grid>
      </Dashboard>,
    );

    expect(
      screen.queryByRole('button', { name: 'Resize wide metric' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('group', { name: 'Wide metric' }));

    const resizeHandle = screen.getByRole('button', {
      name: 'Resize wide metric',
    });
    expect(resizeHandle).toHaveAttribute('data-dashboard-resize-axis', 'x');

    resizeHandle.focus();
    await user.keyboard('{ArrowRight}');

    expect(onPlacementChange).toHaveBeenLastCalledWith(
      { column: 0, row: 0, columns: 3, rows: 1 },
      { reason: 'resize', phase: 'commit', input: 'keyboard' },
    );
  });

  it('resizes a stack child against its neighbour', async () => {
    const user = userEvent.setup();
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard>
        <Dashboard.HorizontalStack id="stack" rows={1}>
          <Dashboard.Widget
            id="first"
            aria-label="First"
            columns={6}
            minColumns={2}
            maxColumns={10}
            rows={1}
            isResizable
            resizeLabel="Resize first"
            onPlacementChange={onPlacementChange}
          >
            First
          </Dashboard.Widget>
          <Dashboard.Widget
            id="second"
            aria-label="Second"
            columns={6}
            minColumns={2}
            rows={1}
          >
            Second
          </Dashboard.Widget>
        </Dashboard.HorizontalStack>
      </Dashboard>,
    );

    await user.click(screen.getByRole('group', { name: 'First' }));
    screen.getByRole('button', { name: 'Resize first' }).focus();
    await user.keyboard('{ArrowRight}');

    // The stack is full, so the track has to come from somewhere: the seam
    // between the two moves rather than the first one claiming free space.
    expect(onPlacementChange).toHaveBeenLastCalledWith(
      { column: 0, row: 0, columns: 7, rows: 1 },
      expect.objectContaining({
        reason: 'resize',
        phase: 'commit',
        displaced: [
          {
            id: 'second',
            placement: { column: 6, row: 0, columns: 5, rows: 1 },
          },
        ],
      }),
    );
  });

  it('does not render a resize handle for a fixed-size widget', () => {
    renderWithRoot(
      <Dashboard>
        <Dashboard.Grid id="section" rows={1}>
          <Dashboard.Widget
            id="fixed"
            aria-label="Fixed metric"
            columns={1}
            rows={1}
            minColumns={1}
            maxColumns={1}
            minRows={1}
            maxRows={1}
            isResizable
            onPlacementChange={() => {}}
          >
            Fixed metric
          </Dashboard.Widget>
        </Dashboard.Grid>
      </Dashboard>,
    );

    fireEvent.click(screen.getByRole('group', { name: 'Fixed metric' }));
    expect(
      screen.queryByRole('button', { name: 'Resize dashboard widget' }),
    ).not.toBeInTheDocument();
  });

  it('resizes a top-level container vertically', async () => {
    const user = userEvent.setup();
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard>
        <Dashboard.Grid
          id="section"
          aria-label="Section"
          rows={4}
          maxRows={8}
          isResizable
          resizeLabel="Resize section"
          onPlacementChange={onPlacementChange}
        >
          <Dashboard.Widget id="metric" row={0} rows={2} columns={4}>
            Metric
          </Dashboard.Widget>
        </Dashboard.Grid>
      </Dashboard>,
    );

    await user.click(screen.getByRole('group', { name: 'Section' }));
    const resizeHandle = screen.getByRole('button', {
      name: 'Resize section',
    });
    expect(resizeHandle).toHaveAttribute('data-dashboard-resize-axis', 'y');

    resizeHandle.focus();
    await user.keyboard('{ArrowDown}');

    expect(onPlacementChange).toHaveBeenLastCalledWith(
      { column: 0, row: 0, columns: 12, rows: 5 },
      { reason: 'resize', phase: 'commit', input: 'keyboard' },
    );
  });

  it('resizes a top-level container by multiple row steps with the pointer', () => {
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard rowHeight={80} gap={16}>
        <Dashboard.Grid
          id="section"
          aria-label="Section"
          rows={4}
          maxRows={8}
          isResizable
          resizeLabel="Resize section"
          onPlacementChange={onPlacementChange}
        >
          <Dashboard.Widget id="metric" rows={2} columns={4}>
            Metric
          </Dashboard.Widget>
        </Dashboard.Grid>
      </Dashboard>,
    );

    fireEvent.click(screen.getByRole('group', { name: 'Section' }));
    const resizeHandle = screen.getByRole('button', {
      name: 'Resize section',
    });
    fireEvent(resizeHandle, pointerEvent('pointerdown', 0, 0));
    fireEvent(window, pointerEvent('pointermove', 0, 200));
    expect(screen.getByRole('group', { name: 'Section' })).toHaveAttribute(
      'data-resizing',
    );
    fireEvent(window, pointerEvent('pointermove', 0, 300));
    fireEvent(window, pointerEvent('pointerup', 0, 300));
    expect(screen.getByRole('group', { name: 'Section' })).not.toHaveAttribute(
      'data-resizing',
    );

    expect(onPlacementChange).toHaveBeenCalledWith(
      { column: 0, row: 0, columns: 12, rows: 6 },
      { reason: 'resize', phase: 'preview', input: 'pointer' },
    );
    expect(onPlacementChange).toHaveBeenLastCalledWith(
      { column: 0, row: 0, columns: 12, rows: 7 },
      { reason: 'resize', phase: 'commit', input: 'pointer' },
    );
  });

  it('does not shrink a container below its occupied child bounds', async () => {
    const user = userEvent.setup();
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard>
        <Dashboard.Grid
          id="section"
          aria-label="Section"
          rows={3}
          maxRows={8}
          isResizable
          resizeLabel="Resize section"
          onPlacementChange={onPlacementChange}
        >
          <Dashboard.Widget id="metric" row={1} rows={2} columns={4}>
            Metric
          </Dashboard.Widget>
        </Dashboard.Grid>
      </Dashboard>,
    );

    await user.click(screen.getByRole('group', { name: 'Section' }));
    const resizeHandle = screen.getByRole('button', {
      name: 'Resize section',
    });
    resizeHandle.focus();
    await user.keyboard('{ArrowUp}');

    expect(onPlacementChange).not.toHaveBeenCalled();
  });

  it('resizes a nested container on the axes available from its parent', async () => {
    const user = userEvent.setup();
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard>
        <Dashboard.Grid id="parent" rows={4}>
          <Dashboard.Grid
            id="nested"
            aria-label="Nested grid"
            columns={6}
            rows={3}
            isResizable
            resizeLabel="Resize nested grid"
            onPlacementChange={onPlacementChange}
          >
            <Dashboard.Widget id="metric" columns={4} rows={1}>
              Metric
            </Dashboard.Widget>
          </Dashboard.Grid>
        </Dashboard.Grid>
      </Dashboard>,
    );

    await user.click(screen.getByRole('group', { name: 'Nested grid' }));
    const resizeHandle = screen.getByRole('button', {
      name: 'Resize nested grid',
    });
    expect(resizeHandle).toHaveAttribute('data-dashboard-resize-axis', 'both');

    resizeHandle.focus();
    await user.keyboard('{ArrowLeft}');

    expect(onPlacementChange).toHaveBeenLastCalledWith(
      { column: 0, row: 0, columns: 5, rows: 3 },
      { reason: 'resize', phase: 'commit', input: 'keyboard' },
    );
  });

  it('clamps nested child placement to the parent capacity', () => {
    renderWithRoot(
      <Dashboard>
        <Dashboard.Grid id="parent" rows={2}>
          <Dashboard.Grid
            id="nested"
            aria-label="Nested grid"
            column={10}
            row={3}
            columns={6}
            rows={4}
            qa="Nested"
          />
        </Dashboard.Grid>
      </Dashboard>,
    );

    expect(screen.getByTestId('Nested')).toHaveStyle({
      gridColumn: '7 / span 6',
      gridRow: '1 / span 2',
    });
  });

  it('uses a nested container width as its child-grid capacity', () => {
    renderWithRoot(
      <Dashboard>
        <Dashboard.Grid id="parent" rows={4}>
          <Dashboard.Grid id="nested" columns={6} rows={3} qa="Nested">
            <Dashboard.Widget
              id="metric"
              column={10}
              row={2}
              columns={4}
              rows={2}
              qa="Metric"
            >
              Metric
            </Dashboard.Widget>
          </Dashboard.Grid>
        </Dashboard.Grid>
      </Dashboard>,
    );

    expect(screen.getByTestId('Metric')).toHaveStyle({
      gridColumn: '3 / span 4',
      gridRow: '2 / span 2',
    });
    expect(screen.getByTestId('Nested')).toHaveStyle({
      gridColumn: '1 / span 6',
      gridRow: '1 / span 3',
    });
  });

  it('does not let an inner widget resize beyond its parent capacity', async () => {
    const user = userEvent.setup();
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard>
        <Dashboard.Grid id="parent" rows={3}>
          <Dashboard.Grid id="nested" columns={4} rows={2}>
            <Dashboard.Widget
              id="metric"
              columns={4}
              rows={1}
              minColumns={2}
              maxColumns={6}
              minRows={1}
              maxRows={1}
              isResizable
              resizeLabel="Resize metric"
              onPlacementChange={onPlacementChange}
            >
              Metric
            </Dashboard.Widget>
          </Dashboard.Grid>
        </Dashboard.Grid>
      </Dashboard>,
    );

    await user.click(screen.getByRole('group', { name: 'metric' }));
    const resizeHandle = screen.getByRole('button', {
      name: 'Resize metric',
    });
    resizeHandle.focus();
    await user.keyboard('{ArrowRight}');

    expect(onPlacementChange).not.toHaveBeenCalled();
  });

  it('does not shrink a nested container across occupied columns', async () => {
    const user = userEvent.setup();
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard>
        <Dashboard.Grid id="parent" rows={4}>
          <Dashboard.Grid
            id="nested"
            aria-label="Nested grid"
            columns={4}
            rows={3}
            isResizable
            resizeLabel="Resize nested grid"
            onPlacementChange={onPlacementChange}
          >
            <Dashboard.Widget id="metric" column={2} columns={2} rows={1}>
              Metric
            </Dashboard.Widget>
          </Dashboard.Grid>
        </Dashboard.Grid>
      </Dashboard>,
    );

    await user.click(screen.getByRole('group', { name: 'Nested grid' }));
    const resizeHandle = screen.getByRole('button', {
      name: 'Resize nested grid',
    });
    resizeHandle.focus();
    await user.keyboard('{ArrowLeft}');

    expect(onPlacementChange).not.toHaveBeenCalled();
  });

  it('excludes an authoring add slot from the container minimum', async () => {
    const user = userEvent.setup();
    const onPlacementChange = vi.fn();

    renderWithRoot(
      <Dashboard>
        <Dashboard.Grid id="parent" rows={4}>
          <Dashboard.Grid
            id="nested"
            columns={6}
            rows={3}
            isResizable
            resizeLabel="Resize nested grid"
            onPlacementChange={onPlacementChange}
          >
            <Dashboard.Widget
              id="add"
              columns={6}
              rows={1}
              isSelectable={false}
              data-dashboard-add-slot=""
            >
              Add
            </Dashboard.Widget>
          </Dashboard.Grid>
        </Dashboard.Grid>
      </Dashboard>,
    );

    await user.click(screen.getByRole('group', { name: 'nested' }));
    const resizeHandle = screen.getByRole('button', {
      name: 'Resize nested grid',
    });
    resizeHandle.focus();
    await user.keyboard('{ArrowLeft}');

    expect(onPlacementChange).toHaveBeenLastCalledWith(
      { column: 0, row: 0, columns: 5, rows: 3 },
      { reason: 'resize', phase: 'commit', input: 'keyboard' },
    );
  });
});
