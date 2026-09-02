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

    expect(screen.getByTestId('Dashboard')).toHaveStyle({ gap: '16px' });
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

    expect(screen.getByTestId('Short')).toHaveStyle({
      gridColumn: 'span 2',
      gridRow: '1 / span 1',
    });
    expect(screen.getByTestId('Narrow')).toHaveStyle({
      gridColumn: '1 / span 2',
      gridRow: 'span 1',
    });
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

    expect(horizontalCells).toHaveLength(1);
    expect(horizontalCells[0]).toHaveAttribute('data-dashboard-column', '2');
    expect(horizontalCells[0]).toHaveAttribute('data-dashboard-row', '0');
    expect(verticalCells).toHaveLength(1);
    expect(verticalCells[0]).toHaveAttribute('data-dashboard-column', '0');
    expect(verticalCells[0]).toHaveAttribute('data-dashboard-row', '1');
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

  it('reveals container actions and the Board-style corner grip only after selection', async () => {
    const user = userEvent.setup();
    const onSettingsPress = vi.fn();
    const onDeletePress = vi.fn();
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
            onDeletePress={onDeletePress}
            deleteLabel="Delete empty layout"
          />
        </Dashboard.Grid>
      </Dashboard>,
    );

    const container = screen.getByRole('group', { name: 'Empty layout' });
    expect(container).toHaveAttribute('data-dashboard-empty', 'true');
    expect(
      screen.queryByRole('button', { name: 'Settings for empty layout' }),
    ).not.toBeInTheDocument();

    await user.click(container);
    expect(screen.getByTestId('DashboardResizeCornerGrip')).toBeInTheDocument();
    expect(
      Array.from(
        container.querySelectorAll('[data-dashboard-container-actions] button'),
      ).map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Delete empty layout', 'Settings for empty layout']);
    await user.click(
      screen.getByRole('button', { name: 'Settings for empty layout' }),
    );
    expect(onSettingsPress).toHaveBeenCalledOnce();

    await user.click(container);
    await user.click(
      screen.getByRole('button', { name: 'Delete empty layout' }),
    );
    expect(onDeletePress).toHaveBeenCalledOnce();
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

  it('reveals ordered settings and outline-delete actions for the selected widget', async () => {
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
      screen.queryByRole('button', { name: 'Settings for revenue metric' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete revenue metric' }),
    ).not.toBeInTheDocument();

    const widget = screen.getByRole('group', { name: 'Revenue metric' });
    await user.click(widget);
    expect(
      getComputedStyle(screen.getByRole('group', { name: 'section' })),
    ).toHaveProperty('zIndex', '3');
    const widgetActions = Array.from(
      widget.querySelectorAll('[data-dashboard-widget-actions] button'),
    );
    expect(
      widgetActions.map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Delete revenue metric', 'Settings for revenue metric']);
    expect(widgetActions[0]).toHaveAttribute('data-type', 'outline');
    expect(widgetActions[0]).toHaveAttribute('data-theme', 'danger');
    await user.click(
      screen.getByRole('button', { name: 'Settings for revenue metric' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Delete revenue metric' }),
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

  it('hides the placeholder when a destination cannot fit the minimum size', () => {
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

    expect(
      screen.queryByTestId('DashboardDropPlaceholder'),
    ).not.toBeInTheDocument();

    fireEvent(window, pointerEvent('pointerup', 628, 20));
    expect(onPlacementChange).not.toHaveBeenCalled();
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
