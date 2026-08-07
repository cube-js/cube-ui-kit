import {
  act,
  fireEvent,
  render,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test';
import { Tab, Tabs } from '../../navigation/Tabs';

import { Board } from './index';

import type { LayoutConstraint, LayoutItem } from './grid-core';

const baseLayout = [
  { i: 'a', x: 0, y: 0, w: 2, h: 2 },
  { i: 'b', x: 2, y: 0, w: 2, h: 2 },
  { i: 'c', x: 0, y: 2, w: 4, h: 2 },
];

describe('Board', () => {
  it('renders widgets content', () => {
    render(
      <Board width={1200} defaultLayout={baseLayout}>
        <Board.Widget id="a">Widget A</Board.Widget>
        <Board.Widget id="b">Widget B</Board.Widget>
        <Board.Widget id="c">Widget C</Board.Widget>
      </Board>,
    );

    expect(screen.getByText('Widget A')).toBeInTheDocument();
    expect(screen.getByText('Widget B')).toBeInTheDocument();
    expect(screen.getByText('Widget C')).toBeInTheDocument();
  });

  it('renders a widget host per layout item', () => {
    render(
      <Board width={1200} defaultLayout={baseLayout}>
        <Board.Widget id="a" qa="WidgetA">
          A
        </Board.Widget>
        <Board.Widget id="b" qa="WidgetB">
          B
        </Board.Widget>
        <Board.Widget id="c" qa="WidgetC">
          C
        </Board.Widget>
      </Board>,
    );

    expect(screen.getByTestId('WidgetA')).toBeInTheDocument();
    expect(screen.getByTestId('WidgetB')).toBeInTheDocument();
    expect(screen.getByTestId('WidgetC')).toBeInTheDocument();
  });

  it('positions widgets using CSS inset (left/top)', () => {
    render(
      <Board
        width={1200}
        rowHeight={100}
        margin={[10, 10]}
        containerPadding={[10, 10]}
        defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}
      >
        <Board.Widget id="a" qa="WidgetA">
          A
        </Board.Widget>
      </Board>,
    );

    const widget = screen.getByTestId('WidgetA');
    // First item sits at the container padding origin (10, 10).
    expect(widget.style.left).toBe('10px');
    expect(widget.style.top).toBe('10px');
  });

  it('transitions widget position and size after initial placement', () => {
    const callbacks: FrameRequestCallback[] = [];
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callbacks.push(callback);
        return callbacks.length;
      });

    try {
      render(
        <Board
          width={1200}
          defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}
        >
          <Board.Widget id="a" qa="WidgetA">
            A
          </Board.Widget>
        </Board>,
      );

      act(() => callbacks.shift()?.(0));
      act(() => callbacks.shift()?.(0));

      const widget = screen.getByTestId('WidgetA');
      expect(widget).toHaveAttribute('data-settled');
      const transition = getComputedStyle(widget).transition;
      expect(transition).toContain('width');
      expect(transition).toContain('height');
    } finally {
      rafSpy.mockRestore();
    }
  });

  it('makes draggable widgets focusable', () => {
    render(
      <Board width={1200} defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}>
        <Board.Widget id="a" qa="WidgetA">
          A
        </Board.Widget>
      </Board>,
    );

    expect(screen.getByTestId('WidgetA')).toHaveAttribute('tabindex', '0');
  });

  it('shows the widget focus state only for focus-visible focus', async () => {
    const user = userEvent.setup();
    render(
      <Board width={1200} defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}>
        <Board.Widget id="a" qa="WidgetA">
          A
        </Board.Widget>
      </Board>,
    );

    await user.tab();

    expect(screen.getByTestId('WidgetA')).toHaveAttribute('data-focus-visible');
  });

  it('does not make widgets focusable when dragging is disabled', () => {
    render(
      <Board
        width={1200}
        isDraggable={false}
        defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}
      >
        <Board.Widget id="a" qa="WidgetA">
          A
        </Board.Widget>
      </Board>,
    );

    expect(screen.getByTestId('WidgetA')).not.toHaveAttribute('tabindex');
  });

  it('renders resize handles for resizable widgets', () => {
    render(
      <Board
        width={1200}
        resizeHandles={['se']}
        defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}
      >
        <Board.Widget id="a" qa="WidgetA">
          A
        </Board.Widget>
      </Board>,
    );

    expect(screen.getAllByTestId('BoardResizeHandle').length).toBe(1);
  });

  it('does not render resize handles when resizing is disabled', () => {
    render(
      <Board
        width={1200}
        isResizable={false}
        defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}
      >
        <Board.Widget id="a" qa="WidgetA">
          A
        </Board.Widget>
      </Board>,
    );

    expect(screen.queryByTestId('BoardResizeHandle')).not.toBeInTheDocument();
  });

  it('renders a resize grip affordance for corner handles', () => {
    render(
      <Board
        width={1200}
        resizeHandles={['se']}
        defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}
      >
        <Board.Widget id="a" qa="WidgetA">
          A
        </Board.Widget>
      </Board>,
    );

    const grips = screen.getAllByTestId('BoardResizeGrip');
    expect(grips.length).toBe(1);
    expect(grips[0]).toHaveAttribute('data-axis', 'se');
  });

  it('renders corner grips for corners and edge grips for edges', () => {
    render(
      <Board
        width={1200}
        resizeHandles={['se', 'n', 'e', 'nw']}
        defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}
      >
        <Board.Widget id="a" qa="WidgetA">
          A
        </Board.Widget>
      </Board>,
    );

    // 4 handles total: the two corners (se, nw) get an angle grip, the two
    // edges (n, e) get a dotted edge grip.
    expect(screen.getAllByTestId('BoardResizeHandle').length).toBe(4);
    expect(screen.getAllByTestId('BoardResizeGrip').length).toBe(2);
    expect(screen.getAllByTestId('BoardResizeEdgeGrip').length).toBe(2);
  });

  it('renders a dotted edge grip for a single-axis edge handle', () => {
    render(
      <Board width={1200} defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}>
        <Board.Widget id="a" qa="WidgetA" resizeHandles={['e']}>
          A
        </Board.Widget>
      </Board>,
    );

    // A single east handle with a dotted edge grip and no corner grip.
    expect(screen.getAllByTestId('BoardResizeHandle').length).toBe(1);
    const grips = screen.getAllByTestId('BoardResizeEdgeGrip');
    expect(grips.length).toBe(1);
    expect(grips[0]).toHaveAttribute('data-axis', 'e');
    expect(screen.queryByTestId('BoardResizeGrip')).not.toBeInTheDocument();
  });

  it('does not render edge grips when resizing is disabled', () => {
    render(
      <Board
        width={1200}
        isResizable={false}
        resizeHandles={['e']}
        defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}
      >
        <Board.Widget id="a" qa="WidgetA">
          A
        </Board.Widget>
      </Board>,
    );

    expect(screen.queryByTestId('BoardResizeEdgeGrip')).not.toBeInTheDocument();
  });

  it('does not render grips when resizing is disabled', () => {
    render(
      <Board
        width={1200}
        isResizable={false}
        defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}
      >
        <Board.Widget id="a" qa="WidgetA">
          A
        </Board.Widget>
      </Board>,
    );

    expect(screen.queryByTestId('BoardResizeGrip')).not.toBeInTheDocument();
  });

  it('renders all widgets at their given positions in free mode', () => {
    render(
      <Board
        width={1200}
        rowHeight={100}
        margin={[10, 10]}
        containerPadding={[10, 10]}
        compact="free"
        defaultLayout={[
          { i: 'a', x: 0, y: 0, w: 2, h: 2 },
          { i: 'b', x: 3, y: 0, w: 2, h: 2 },
        ]}
      >
        <Board.Widget id="a" qa="WidgetA">
          A
        </Board.Widget>
        <Board.Widget id="b" qa="WidgetB">
          B
        </Board.Widget>
      </Board>,
    );

    // Free positioning keeps items exactly where placed (no reflow to origin).
    const widgetA = screen.getByTestId('WidgetA');
    expect(widgetA.style.left).toBe('10px');
    expect(widgetA.style.top).toBe('10px');
    const widgetB = screen.getByTestId('WidgetB');
    expect(widgetB.style.left).not.toBe('10px');
  });

  describe('free positioning', () => {
    // A single arrow key runs the whole keyboard-drag gesture (start + move +
    // commit), like the lifecycle tests. jsdom reports a zero rect for the
    // dragged host, so the keyboard landing is computed from the origin: one
    // ArrowRight always lands the dragged widget at x=1. Dragging the widget
    // that starts at x=0 therefore gives a deterministic one-column move.

    it('scans past occupied cells and never moves neighbours', () => {
      const onLayoutChange = vi.fn();
      render(
        <Board
          width={1200}
          cols={12}
          compact="free"
          onLayoutChange={onLayoutChange}
          defaultLayout={[
            { i: 'a', x: 0, y: 0, w: 2, h: 2 },
            { i: 'b', x: 2, y: 0, w: 4, h: 2 },
          ]}
        >
          <Board.Widget id="a" qa="WidgetA">
            A
          </Board.Widget>
          <Board.Widget id="b" qa="WidgetB">
            B
          </Board.Widget>
        </Board>,
      );

      const widget = screen.getByTestId('WidgetA');
      widget.focus();
      // Adjacent candidates overlap B, so keyboard movement scans to the first
      // free slot after it without pushing or swapping in free mode.
      fireEvent.keyDown(widget, { key: 'ArrowRight' });

      expect(onLayoutChange).toHaveBeenCalled();
      const last = onLayoutChange.mock.calls.at(-1)![0] as LayoutItem[];
      expect(last.find((l) => l.i === 'a')?.x).toBe(6);
      expect(last.find((l) => l.i === 'b')?.x).toBe(2);
    });

    it('places a widget in free space without disturbing neighbours', () => {
      const onLayoutChange = vi.fn();
      render(
        <Board
          width={1200}
          cols={12}
          compact="free"
          onLayoutChange={onLayoutChange}
          defaultLayout={[
            { i: 'a', x: 0, y: 0, w: 2, h: 2 },
            { i: 'b', x: 4, y: 0, w: 2, h: 2 },
          ]}
        >
          <Board.Widget id="a" qa="WidgetA">
            A
          </Board.Widget>
          <Board.Widget id="b" qa="WidgetB">
            B
          </Board.Widget>
        </Board>,
      );

      const widget = screen.getByTestId('WidgetA');
      widget.focus();
      // A lands in empty space one column over; B is untouched.
      fireEvent.keyDown(widget, { key: 'ArrowRight' });

      expect(onLayoutChange).toHaveBeenCalled();
      const last = onLayoutChange.mock.calls.at(-1)![0] as LayoutItem[];
      expect(last.find((l) => l.i === 'a')?.x).toBe(1);
      expect(last.find((l) => l.i === 'b')?.x).toBe(4);
    });

    it('lets widgets overlap with allowOverlap and still never moves neighbours', () => {
      const onLayoutChange = vi.fn();
      render(
        <Board
          width={1200}
          cols={12}
          compact="free"
          allowOverlap
          onLayoutChange={onLayoutChange}
          defaultLayout={[
            { i: 'a', x: 0, y: 0, w: 2, h: 2 },
            { i: 'b', x: 2, y: 0, w: 2, h: 2 },
          ]}
        >
          <Board.Widget id="a" qa="WidgetA">
            A
          </Board.Widget>
          <Board.Widget id="b" qa="WidgetB">
            B
          </Board.Widget>
        </Board>,
      );

      const widget = screen.getByTestId('WidgetA');
      widget.focus();
      // Moving A one column right overlaps B; with overlap it stacks there and
      // B stays where it is.
      fireEvent.keyDown(widget, { key: 'ArrowRight' });

      expect(onLayoutChange).toHaveBeenCalled();
      const last = onLayoutChange.mock.calls.at(-1)![0] as LayoutItem[];
      expect(last.find((l) => l.i === 'a')?.x).toBe(1);
      expect(last.find((l) => l.i === 'b')?.x).toBe(2);
    });
  });

  it('scans past a larger static widget without changing rows', () => {
    const onLayoutChange = vi.fn();
    render(
      <Board
        width={1200}
        cols={12}
        onLayoutChange={onLayoutChange}
        defaultLayout={[
          { i: 'a', x: 0, y: 0, w: 2, h: 2 },
          { i: 'b', x: 2, y: 0, w: 4, h: 4, static: true },
        ]}
      >
        <Board.Widget id="a" qa="WidgetA">
          A
        </Board.Widget>
        <Board.Widget id="b">B</Board.Widget>
      </Board>,
    );

    const widget = screen.getByTestId('WidgetA');
    widget.focus();
    fireEvent.keyDown(widget, { key: 'ArrowRight' });

    const last = onLayoutChange.mock.calls.at(-1)![0] as LayoutItem[];
    expect(last.find((l) => l.i === 'a')).toMatchObject({ x: 6, y: 0 });
    expect(last.find((l) => l.i === 'b')).toMatchObject({ x: 2, y: 0 });
  });

  it('reflows a larger movable widget without creating overlap', () => {
    const onLayoutChange = vi.fn();
    render(
      <Board
        width={1200}
        cols={12}
        onLayoutChange={onLayoutChange}
        defaultLayout={[
          { i: 'a', x: 0, y: 0, w: 2, h: 2 },
          { i: 'b', x: 2, y: 0, w: 4, h: 4 },
        ]}
      >
        <Board.Widget id="a" qa="WidgetA">
          A
        </Board.Widget>
        <Board.Widget id="b">B</Board.Widget>
      </Board>,
    );

    const widget = screen.getByTestId('WidgetA');
    widget.focus();
    fireEvent.keyDown(widget, { key: 'ArrowRight' });

    const last = onLayoutChange.mock.calls.at(-1)![0] as LayoutItem[];
    const a = last.find((l) => l.i === 'a')!;
    const b = last.find((l) => l.i === 'b')!;
    expect(a.x).toBeGreaterThan(0);
    expect(
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y,
    ).toBe(false);
  });

  it('never stacks a pushed neighbour during a keyboard move in legacy compaction', () => {
    // Regression: in `compact={null}` (collisions resolved the legacy
    // react-grid-layout way, no gap compaction) a move that pushed a neighbour
    // could drop it on top of the widget below - a z-overlap. Moving A right
    // onto B pushes B down onto C. Both the keyboard path (this test) and the
    // pointer path (next test) must refuse the stack.
    const onLayoutChange = vi.fn();
    render(
      <Board
        width={1200}
        cols={12}
        compact={null}
        onLayoutChange={onLayoutChange}
        defaultLayout={[
          { i: 'a', x: 0, y: 0, w: 2, h: 2 },
          { i: 'b', x: 2, y: 0, w: 2, h: 2 },
          { i: 'c', x: 2, y: 2, w: 2, h: 2 },
        ]}
      >
        <Board.Widget id="a" qa="WidgetA">
          A
        </Board.Widget>
        <Board.Widget id="b">B</Board.Widget>
        <Board.Widget id="c">C</Board.Widget>
      </Board>,
    );

    const widget = screen.getByTestId('WidgetA');
    widget.focus();
    fireEvent.keyDown(widget, { key: 'ArrowRight' });

    const last = onLayoutChange.mock.calls.at(-1)?.[0] as
      | LayoutItem[]
      | undefined;
    const overlapping = (last ?? []).some((x, i) =>
      (last ?? [])
        .slice(i + 1)
        .some(
          (y) =>
            x.x < y.x + y.w &&
            x.x + x.w > y.x &&
            x.y < y.y + y.h &&
            x.y + x.h > y.y,
        ),
    );
    expect(overlapping).toBe(false);
  });

  it('never stacks a pushed neighbour during a pointer drag in legacy compaction', () => {
    // Same regression as above but driven by the mouse: dragging A one column
    // right onto B (legacy `compact={null}`) would push B down onto C. The
    // pointer path must keep the widget at its last valid arrangement instead of
    // committing the stack, matching the keyboard path.
    const onLayoutChange = vi.fn();
    // jsdom drops pageX/pageY passed via init; React Aria's useMove reads them.
    const pointerEvent = (type: string, pageX: number, pageY: number) => {
      const event = new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        pointerId: 1,
        pointerType: 'mouse',
      });
      Object.defineProperty(event, 'pageX', { get: () => pageX });
      Object.defineProperty(event, 'pageY', { get: () => pageY });
      return event;
    };
    const mockRect = (
      left: number,
      top: number,
      width: number,
      height: number,
    ): DOMRect =>
      ({
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect;

    render(
      <Board
        width={1200}
        cols={12}
        rowHeight={100}
        margin={[0, 0]}
        containerPadding={[0, 0]}
        compact={null}
        onLayoutChange={onLayoutChange}
        defaultLayout={[
          { i: 'a', x: 0, y: 0, w: 2, h: 2 },
          { i: 'b', x: 2, y: 0, w: 2, h: 2 },
          { i: 'c', x: 2, y: 2, w: 2, h: 2 },
        ]}
      >
        <Board.Widget id="a" qa="WidgetA">
          A
        </Board.Widget>
        <Board.Widget id="b">B</Board.Widget>
        <Board.Widget id="c">C</Board.Widget>
      </Board>,
    );

    const widget = screen.getByTestId('WidgetA');
    const content = widget.parentElement as HTMLElement;
    // 12 cols over 1200px with no margin/padding => 100px per column.
    content.getBoundingClientRect = () => mockRect(0, 0, 1200, 800);
    widget.getBoundingClientRect = () => mockRect(0, 0, 200, 200);

    // Drag A one column right, straight onto B.
    fireEvent(widget, pointerEvent('pointerdown', 0, 0));
    fireEvent(window, pointerEvent('pointermove', 100, 0));
    fireEvent(window, pointerEvent('pointerup', 100, 0));

    expect(onLayoutChange).toHaveBeenCalled();
    const last = onLayoutChange.mock.calls.at(-1)![0] as LayoutItem[];
    const overlapping = last.some((x, i) =>
      last
        .slice(i + 1)
        .some(
          (y) =>
            x.x < y.x + y.w &&
            x.x + x.w > y.x &&
            x.y < y.y + y.h &&
            x.y + x.h > y.y,
        ),
    );
    expect(overlapping).toBe(false);
  });

  it('still moves a widget with the keyboard when an unrelated overlap exists', () => {
    // Regression: the overlap guard must reject only *newly introduced* stacks,
    // not any overlap in the board. In `compact={null}` a layout is never
    // gap-compacted, so an app can supply already-overlapping widgets; a
    // whole-layout collision check would then see an overlap for every candidate
    // and freeze keyboard navigation for the whole board. Here `b`/`c` overlap
    // from the start, but moving the unrelated `a` must still work.
    const onLayoutChange = vi.fn();
    render(
      <Board
        width={1200}
        cols={12}
        compact={null}
        onLayoutChange={onLayoutChange}
        defaultLayout={[
          { i: 'a', x: 0, y: 0, w: 2, h: 2 },
          { i: 'b', x: 6, y: 0, w: 2, h: 2 },
          { i: 'c', x: 6, y: 0, w: 2, h: 2 },
        ]}
      >
        <Board.Widget id="a" qa="WidgetA">
          A
        </Board.Widget>
        <Board.Widget id="b">B</Board.Widget>
        <Board.Widget id="c">C</Board.Widget>
      </Board>,
    );

    const widget = screen.getByTestId('WidgetA');
    widget.focus();
    fireEvent.keyDown(widget, { key: 'ArrowRight' });

    const last = onLayoutChange.mock.calls.at(-1)![0] as LayoutItem[];
    const a = last.find((l) => l.i === 'a');
    // `a` advanced one column despite the pre-existing `b`/`c` stack.
    expect(a?.x).toBe(1);
    expect(a?.y).toBe(0);
    // The pre-existing overlap is preserved, not "fixed" by the move.
    expect(last.find((l) => l.i === 'b')).toMatchObject({ x: 6, y: 0 });
    expect(last.find((l) => l.i === 'c')).toMatchObject({ x: 6, y: 0 });
  });

  it('supports nested boards inside a widget', () => {
    render(
      <Board.Provider>
        <Board
          id="outer"
          width={1200}
          defaultLayout={[{ i: 'container', x: 0, y: 0, w: 6, h: 4 }]}
        >
          <Board.Widget id="container">
            <Board
              id="inner"
              width={500}
              defaultLayout={[{ i: 'child', x: 0, y: 0, w: 2, h: 2 }]}
            >
              <Board.Widget id="child">Nested child</Board.Widget>
            </Board>
          </Board.Widget>
        </Board>
      </Board.Provider>,
    );

    expect(screen.getByText('Nested child')).toBeInTheDocument();
  });

  it('renders multiple boards under a shared provider', () => {
    render(
      <Board.Provider>
        <Board
          id="left"
          width={600}
          defaultLayout={[{ i: 'l1', x: 0, y: 0, w: 2, h: 2 }]}
        >
          <Board.Widget id="l1">Left widget</Board.Widget>
        </Board>
        <Board
          id="right"
          width={600}
          defaultLayout={[{ i: 'r1', x: 0, y: 0, w: 2, h: 2 }]}
        >
          <Board.Widget id="r1">Right widget</Board.Widget>
        </Board>
      </Board.Provider>,
    );

    expect(screen.getByText('Left widget')).toBeInTheDocument();
    expect(screen.getByText('Right widget')).toBeInTheDocument();
  });

  it('does not render a static widget as draggable', () => {
    render(
      <Board
        width={1200}
        defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2, static: true }]}
      >
        <Board.Widget id="a" qa="WidgetA">
          A
        </Board.Widget>
      </Board>,
    );

    expect(screen.getByTestId('WidgetA')).not.toHaveAttribute('tabindex');
  });

  it('updates widget content when children change', () => {
    const layout = [{ i: 'a', x: 0, y: 0, w: 2, h: 2 }];
    const { rerender } = render(
      <Board width={1200} defaultLayout={layout}>
        <Board.Widget id="a">Original content</Board.Widget>
      </Board>,
    );

    expect(screen.getByText('Original content')).toBeInTheDocument();

    rerender(
      <Board width={1200} defaultLayout={layout}>
        <Board.Widget id="a">Updated content</Board.Widget>
      </Board>,
    );

    expect(screen.getByText('Updated content')).toBeInTheDocument();
    expect(screen.queryByText('Original content')).not.toBeInTheDocument();
  });

  it('applies per-widget constraints during a keyboard drag', () => {
    const onLayoutChange = vi.fn();
    // A constraint that pins the item to column 5 regardless of the requested
    // position - only observable if the widget's `constraints` prop is wired
    // through to the layout item the constraint engine reads.
    const pinToColumn5: LayoutConstraint = {
      name: 'pinToColumn5',
      constrainPosition: (_item, _x, y) => ({ x: 5, y }),
    };

    render(
      <Board
        width={1200}
        cols={12}
        onLayoutChange={onLayoutChange}
        defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}
      >
        <Board.Widget id="a" qa="WidgetA" constraints={[pinToColumn5]}>
          A
        </Board.Widget>
      </Board>,
    );

    const widget = screen.getByTestId('WidgetA');
    widget.focus();
    fireEvent.keyDown(widget, { key: 'ArrowRight' });

    expect(onLayoutChange).toHaveBeenCalled();
    const lastLayout = onLayoutChange.mock.calls.at(-1)![0] as LayoutItem[];
    expect(lastLayout.find((l) => l.i === 'a')?.x).toBe(5);
  });

  it('keeps keyboard movement within the grid bounds', () => {
    const onLayoutChange = vi.fn();
    render(
      <Board
        width={1200}
        cols={12}
        onLayoutChange={onLayoutChange}
        defaultLayout={[{ i: 'a', x: 10, y: 0, w: 2, h: 2 }]}
      >
        <Board.Widget id="a" qa="WidgetA">
          A
        </Board.Widget>
      </Board>,
    );

    const widget = screen.getByTestId('WidgetA');
    widget.focus();
    fireEvent.keyDown(widget, { key: 'ArrowRight' });

    const lastLayout = onLayoutChange.mock.calls.at(-1)![0] as LayoutItem[];
    expect(lastLayout.find((l) => l.i === 'a')?.x).toBe(10);
  });

  it('stays registered and draggable after its id changes', () => {
    const onLayoutChange = vi.fn();

    function Wrapper({ boardId }: { boardId: string }) {
      return (
        <Board.Provider>
          <Board
            id={boardId}
            width={1200}
            cols={12}
            onLayoutChange={onLayoutChange}
            defaultLayout={[
              { i: 'a', x: 0, y: 0, w: 2, h: 2 },
              { i: 'b', x: 4, y: 0, w: 2, h: 2 },
            ]}
          >
            <Board.Widget id="a" qa="WidgetA">
              A
            </Board.Widget>
            <Board.Widget id="b" qa="WidgetB">
              B
            </Board.Widget>
          </Board>
        </Board.Provider>
      );
    }

    const { rerender } = render(<Wrapper boardId="first" />);
    rerender(<Wrapper boardId="second" />);

    expect(screen.getByText('A')).toBeInTheDocument();

    // A drag only commits if the board is still found in the registry under its
    // new id (the drag handlers key off the current board id).
    const widget = screen.getByTestId('WidgetA');
    widget.focus();
    fireEvent.keyDown(widget, { key: 'ArrowRight' });

    expect(onLayoutChange).toHaveBeenCalled();
  });

  it('aligns a nested board column pitch to the parent grid', () => {
    render(
      <Board.Provider>
        <Board
          id="outer"
          width={1212}
          cols={12}
          margin={[10, 10]}
          containerPadding={[10, 10]}
          defaultLayout={[
            { i: 'p', x: 0, y: 0, w: 1, h: 1 },
            { i: 'container', x: 1, y: 0, w: 6, h: 4 },
          ]}
        >
          <Board.Widget id="p" qa="ParentCell">
            P
          </Board.Widget>
          <Board.Widget id="container">
            <Board
              id="inner"
              isAligned
              width={500}
              cols={6}
              defaultLayout={[{ i: 'c', x: 0, y: 0, w: 1, h: 1 }]}
            >
              <Board.Widget id="c" qa="InnerCell">
                C
              </Board.Widget>
            </Board>
          </Board.Widget>
        </Board>
      </Board.Provider>,
    );

    const parentCell = screen.getByTestId('ParentCell');
    const innerCell = screen.getByTestId('InnerCell');
    // The aligned board inherits the parent's column pitch, so a single-column
    // widget has the same pixel width in both boards even though their own
    // widths and column counts differ.
    expect(innerCell.style.width).toBe(parentCell.style.width);
  });

  it('leaves a nested board without isAligned on its own grid', () => {
    render(
      <Board.Provider>
        <Board
          id="outer"
          width={1212}
          cols={12}
          margin={[10, 10]}
          containerPadding={[10, 10]}
          defaultLayout={[
            { i: 'p', x: 0, y: 0, w: 1, h: 1 },
            { i: 'container', x: 1, y: 0, w: 6, h: 4 },
          ]}
        >
          <Board.Widget id="p" qa="ParentCell">
            P
          </Board.Widget>
          <Board.Widget id="container">
            <Board
              id="inner"
              width={600}
              cols={4}
              margin={[10, 10]}
              containerPadding={[10, 10]}
              defaultLayout={[{ i: 'c', x: 0, y: 0, w: 1, h: 1 }]}
            >
              <Board.Widget id="c" qa="InnerCell">
                C
              </Board.Widget>
            </Board>
          </Board.Widget>
        </Board>
      </Board.Provider>,
    );

    const parentCell = screen.getByTestId('ParentCell');
    const innerCell = screen.getByTestId('InnerCell');
    // Without `isAligned`, the nested board keeps its own column width.
    expect(innerCell.style.width).not.toBe(parentCell.style.width);
  });

  it('moves a widget within an aligned board using the keyboard', () => {
    const onLayoutChange = vi.fn();

    render(
      <Board.Provider>
        <Board
          id="outer"
          width={1200}
          cols={12}
          defaultLayout={[{ i: 'container', x: 0, y: 0, w: 12, h: 4 }]}
        >
          <Board.Widget id="container">
            <Board
              id="inner"
              isAligned
              width={600}
              onLayoutChange={onLayoutChange}
              defaultLayout={[{ i: 'c', x: 0, y: 0, w: 1, h: 1 }]}
            >
              <Board.Widget id="c" qa="InnerCell">
                C
              </Board.Widget>
            </Board>
          </Board.Widget>
        </Board>
      </Board.Provider>,
    );

    const widget = screen.getByTestId('InnerCell');
    widget.focus();
    fireEvent.keyDown(widget, { key: 'ArrowRight' });

    expect(onLayoutChange).toHaveBeenCalled();
    const lastLayout = onLayoutChange.mock.calls.at(-1)![0] as LayoutItem[];
    // One arrow step moves the widget exactly one aligned column to the right.
    expect(lastLayout.find((l) => l.i === 'c')?.x).toBe(1);
  });

  it('does not reflow a measured aligned board on the first width measurement', () => {
    // A nested aligned board with no explicit `width` renders first at width 0
    // (falling back to `cols`), then jumps to a measured width once the resize
    // observer fires. That first jump derives a different aligned column count,
    // but it is not a user-driven change and must not commit a reflow.
    const widthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockReturnValue(600);
    const onLayoutChange = vi.fn();

    try {
      render(
        <Board.Provider>
          <Board
            id="outer"
            width={1212}
            cols={12}
            defaultLayout={[{ i: 'container', x: 0, y: 0, w: 6, h: 4 }]}
          >
            <Board.Widget id="container">
              <Board
                id="inner"
                isAligned
                cols={12}
                onLayoutChange={onLayoutChange}
                defaultLayout={[{ i: 'c', x: 8, y: 0, w: 2, h: 1 }]}
              >
                <Board.Widget id="c" qa="InnerCell">
                  C
                </Board.Widget>
              </Board>
            </Board.Widget>
          </Board>
        </Board.Provider>,
      );

      // No user interaction happened, so the aligned board must not have
      // committed a reflow despite deriving a narrower column count on measure.
      expect(onLayoutChange).not.toHaveBeenCalled();
    } finally {
      widthSpy.mockRestore();
    }
  });

  it('uses the parent row height verbatim for aligned cells', () => {
    // jsdom reports 0 for offset dimensions; mock them so a nested board can
    // measure the height it is given (and derive a column count from its width).
    // The container is intentionally shorter (120px) than the two rows need at
    // the 100px parent row height: an aligned board must NOT shrink its rows to
    // fit, so the cell keeps the full parent-sized height regardless.
    const widthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockReturnValue(600);
    const heightSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockReturnValue(120);

    try {
      render(
        <Board.Provider>
          <Board
            id="outer"
            width={1212}
            cols={12}
            rowHeight={100}
            defaultLayout={[
              { i: 'a', x: 0, y: 0, w: 6, h: 4 },
              { i: 'b', x: 6, y: 0, w: 6, h: 4 },
            ]}
          >
            <Board.Widget id="a">
              <Board
                id="inner-aligned"
                isAligned
                defaultLayout={[{ i: 'ca', x: 0, y: 0, w: 1, h: 2 }]}
              >
                <Board.Widget id="ca" qa="AlignedCell">
                  CA
                </Board.Widget>
              </Board>
            </Board.Widget>
            <Board.Widget id="b">
              <Board
                id="inner-plain"
                rowHeight={100}
                defaultLayout={[{ i: 'cb', x: 0, y: 0, w: 1, h: 2 }]}
              >
                <Board.Widget id="cb" qa="PlainCell">
                  CB
                </Board.Widget>
              </Board>
            </Board.Widget>
          </Board>
        </Board.Provider>,
      );

      const aligned = screen.getByTestId('AlignedCell');
      const plain = screen.getByTestId('PlainCell');
      // The aligned board uses the parent's row height verbatim, so the same
      // widget renders at exactly the same height as on a plain board with the
      // matching rowHeight - it is not shrunk to fit the short container.
      expect(parseInt(aligned.style.height, 10)).toBe(
        parseInt(plain.style.height, 10),
      );
    } finally {
      widthSpy.mockRestore();
      heightSpy.mockRestore();
    }
  });

  it('grows an isAutoHeight widget so a squeezed aligned board fits', async () => {
    // Mock offset dimensions so the nested aligned board measures a container
    // that is too short (120px) for its two rows at the parent's 100px row
    // height - which is exactly the deficit isAutoHeight should close.
    const widthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockReturnValue(600);
    const heightSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockReturnValue(120);
    const onLayoutChange = vi.fn();

    try {
      render(
        <Board.Provider>
          <Board
            id="outer"
            width={1212}
            cols={12}
            rowHeight={100}
            margin={[0, 0]}
            containerPadding={[0, 0]}
            onLayoutChange={onLayoutChange}
            defaultLayout={[{ i: 'container', x: 0, y: 0, w: 6, h: 2 }]}
          >
            <Board.Widget id="container" isAutoHeight>
              <Board
                id="inner"
                isAligned
                defaultLayout={[{ i: 'ca', x: 0, y: 0, w: 1, h: 2 }]}
              >
                <Board.Widget id="ca" qa="AutoCell">
                  CA
                </Board.Widget>
              </Board>
            </Board.Widget>
          </Board>
        </Board.Provider>,
      );

      // The container started 2 rows tall but its inner board wants 2 rows at
      // 100px; the reported deficit should grow the container (never shrink it).
      await vi.waitFor(() => {
        expect(onLayoutChange).toHaveBeenCalled();
        const last = onLayoutChange.mock.calls.at(-1)![0] as LayoutItem[];
        const container = last.find((l) => l.i === 'container');
        expect(container && container.h).toBeGreaterThan(2);
      });
    } finally {
      widthSpy.mockRestore();
      heightSpy.mockRestore();
    }
  });

  it('cannot resize an isAutoHeight widget below the height its board needs', async () => {
    // The container is 4 rows tall but its aligned board only needs 2 rows at
    // the parent's 100px row height (mocked container height 400 => two 100px
    // rows plus slack). Dragging the resize handle far up should stop at that
    // 2-row floor instead of collapsing to a single row.
    const widthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockReturnValue(600);
    const heightSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockReturnValue(400);
    const onLayoutChange = vi.fn();

    try {
      render(
        <Board.Provider>
          <Board
            id="outer"
            width={1212}
            cols={12}
            rowHeight={100}
            margin={[0, 0]}
            containerPadding={[0, 0]}
            resizeHandles={['se']}
            onLayoutChange={onLayoutChange}
            defaultLayout={[{ i: 'container', x: 0, y: 0, w: 6, h: 4 }]}
          >
            <Board.Widget id="container" qa="Container" isAutoHeight>
              <Board
                id="inner"
                isAligned
                isResizable={false}
                defaultLayout={[{ i: 'ca', x: 0, y: 0, w: 1, h: 2 }]}
              >
                <Board.Widget id="ca" qa="AutoCell">
                  CA
                </Board.Widget>
              </Board>
            </Board.Widget>
          </Board>
        </Board.Provider>,
      );

      // Only the container is resizable, so this is its south-east handle.
      const handle = screen.getByTestId('BoardResizeHandle');
      // jsdom's PointerEvent drops pageX/pageY passed via init, and React Aria's
      // useMove derives its deltas from them, so build the events by hand.
      const pointerEvent = (type: string, pageX: number, pageY: number) => {
        const event = new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          button: 0,
          pointerId: 1,
          pointerType: 'mouse',
        });
        Object.defineProperty(event, 'pageX', { get: () => pageX });
        Object.defineProperty(event, 'pageY', { get: () => pageY });
        return event;
      };
      // Drag the handle far up (well past two rows) to try to shrink it.
      fireEvent(handle, pointerEvent('pointerdown', 500, 500));
      fireEvent(window, pointerEvent('pointermove', 500, 150));
      fireEvent(window, pointerEvent('pointerup', 500, 150));

      expect(onLayoutChange).toHaveBeenCalled();
      const last = onLayoutChange.mock.calls.at(-1)![0] as LayoutItem[];
      const container = last.find((l) => l.i === 'container');
      // Clamped to the 2-row content floor, not the 1 row the drag asked for.
      expect(container?.h).toBe(2);
    } finally {
      widthSpy.mockRestore();
      heightSpy.mockRestore();
    }
  });

  describe('drag/resize lifecycle callbacks', () => {
    const pointerEvent = (type: string, pageX: number, pageY: number) => {
      const event = new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        pointerId: 1,
        pointerType: 'mouse',
      });
      Object.defineProperty(event, 'pageX', { get: () => pageX });
      Object.defineProperty(event, 'pageY', { get: () => pageY });
      return event;
    };

    it('fires drag lifecycle callbacks during a keyboard drag', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragStop = vi.fn();

      render(
        <Board
          width={1200}
          cols={12}
          onDragStart={onDragStart}
          onDrag={onDrag}
          onDragStop={onDragStop}
          defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}
        >
          <Board.Widget id="a" qa="WidgetA">
            A
          </Board.Widget>
        </Board>,
      );

      const widget = screen.getByTestId('WidgetA');
      widget.focus();
      fireEvent.keyDown(widget, { key: 'ArrowRight' });

      expect(onDragStart).toHaveBeenCalled();
      expect(onDrag).toHaveBeenCalled();
      expect(onDragStop).toHaveBeenCalled();
      // The committed layout reports the moved item and its original position.
      const info = onDragStop.mock.calls.at(-1)![0];
      expect(info.oldItem.x).toBe(0);
      expect(info.item.x).toBe(1);
    });

    it('does not move a widget with arrow keys when focus is inside a nested input', () => {
      // Regression: useMove's onKeyDown sits on the host, so arrow keys from a
      // focused <input>/<textarea> bubble there. They must not start a keyboard
      // drag — only when the widget host itself is focused.
      const onDragStart = vi.fn();
      const onLayoutChange = vi.fn();

      render(
        <Board
          width={1200}
          cols={12}
          onDragStart={onDragStart}
          onLayoutChange={onLayoutChange}
          defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}
        >
          <Board.Widget id="a" qa="WidgetA">
            <input data-qa="Inp" defaultValue="hello" />
          </Board.Widget>
        </Board>,
      );

      const input = screen.getByTestId('Inp');
      input.focus();
      fireEvent.keyDown(input, { key: 'ArrowRight' });

      expect(onDragStart).not.toHaveBeenCalled();
      expect(onLayoutChange).not.toHaveBeenCalled();

      // Focus on the host itself still moves the widget.
      const widget = screen.getByTestId('WidgetA');
      widget.focus();
      fireEvent.keyDown(widget, { key: 'ArrowRight' });
      expect(onDragStart).toHaveBeenCalled();
      expect(onLayoutChange).toHaveBeenCalled();
    });

    it('fires resize lifecycle callbacks during a pointer resize', () => {
      const onResizeStart = vi.fn();
      const onResize = vi.fn();
      const onResizeStop = vi.fn();

      render(
        <Board
          width={1200}
          cols={12}
          rowHeight={100}
          margin={[0, 0]}
          containerPadding={[0, 0]}
          resizeHandles={['se']}
          onResizeStart={onResizeStart}
          onResize={onResize}
          onResizeStop={onResizeStop}
          defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}
        >
          <Board.Widget id="a" qa="WidgetA">
            A
          </Board.Widget>
        </Board>,
      );

      const handle = screen.getByTestId('BoardResizeHandle');
      fireEvent(handle, pointerEvent('pointerdown', 100, 100));
      fireEvent(window, pointerEvent('pointermove', 300, 300));
      fireEvent(window, pointerEvent('pointerup', 300, 300));

      expect(onResizeStart).toHaveBeenCalled();
      expect(onResize).toHaveBeenCalled();
      expect(onResizeStop).toHaveBeenCalled();
    });

    it('resizes width-only from a single edge handle', () => {
      const onResizeStop = vi.fn();

      render(
        <Board
          width={1200}
          cols={12}
          rowHeight={100}
          margin={[0, 0]}
          containerPadding={[0, 0]}
          onResizeStop={onResizeStop}
          defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}
        >
          <Board.Widget id="a" qa="WidgetA" resizeHandles={['e']}>
            A
          </Board.Widget>
        </Board>,
      );

      const handle = screen.getByTestId('BoardResizeHandle');
      // Drag the east handle right by ~200px (2 columns of 100px).
      fireEvent(handle, pointerEvent('pointerdown', 200, 200));
      fireEvent(window, pointerEvent('pointermove', 400, 400));
      fireEvent(window, pointerEvent('pointerup', 400, 400));

      expect(onResizeStop).toHaveBeenCalled();
      const info = onResizeStop.mock.calls.at(-1)![0];
      // Width grew; height stayed the same (edge handle is horizontal-only).
      expect(info.item.w).toBeGreaterThan(2);
      expect(info.item.h).toBe(2);
    });

    it('bounds a resize by a widget-level maxW', () => {
      const onResizeStop = vi.fn();

      render(
        <Board
          width={1200}
          cols={12}
          rowHeight={100}
          margin={[0, 0]}
          containerPadding={[0, 0]}
          onResizeStop={onResizeStop}
          defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}
        >
          <Board.Widget id="a" qa="WidgetA" resizeHandles={['e']} maxW={4}>
            A
          </Board.Widget>
        </Board>,
      );

      const handle = screen.getByTestId('BoardResizeHandle');
      // Drag the east handle far right (well past 4 columns).
      fireEvent(handle, pointerEvent('pointerdown', 200, 200));
      fireEvent(window, pointerEvent('pointermove', 1000, 200));
      fireEvent(window, pointerEvent('pointerup', 1000, 200));

      expect(onResizeStop).toHaveBeenCalled();
      const info = onResizeStop.mock.calls.at(-1)![0];
      // Width is clamped to the widget-level maxW.
      expect(info.item.w).toBe(4);
    });

    it('blocks a resize from overlapping a neighbour in free mode', () => {
      const onResizeStop = vi.fn();

      // `a` and `b` are edge-to-edge (cols 0-1 and 2-3). Growing `a` to the
      // right would immediately overlap `b`, so in `free` mode (no overlap) the
      // resize must be blocked - matching how dragging onto an occupied cell is
      // blocked - rather than the no-op compactor letting the box grow over `b`.
      render(
        <Board
          width={1200}
          cols={12}
          rowHeight={100}
          margin={[0, 0]}
          containerPadding={[0, 0]}
          compact="free"
          onResizeStop={onResizeStop}
          defaultLayout={[
            { i: 'a', x: 0, y: 0, w: 2, h: 2 },
            { i: 'b', x: 2, y: 0, w: 2, h: 2 },
          ]}
        >
          <Board.Widget id="a" qa="WidgetA" resizeHandles={['e']}>
            A
          </Board.Widget>
          <Board.Widget id="b" qa="WidgetB">
            B
          </Board.Widget>
        </Board>,
      );

      const handle = screen.getAllByTestId('BoardResizeHandle')[0];
      // Try to grow `a` far to the right, well into `b`'s cells.
      fireEvent(handle, pointerEvent('pointerdown', 200, 200));
      fireEvent(window, pointerEvent('pointermove', 600, 200));
      fireEvent(window, pointerEvent('pointerup', 600, 200));

      expect(onResizeStop).toHaveBeenCalled();
      const info = onResizeStop.mock.calls.at(-1)![0];
      const a = info.layout.find((l: LayoutItem) => l.i === 'a')!;
      const b = info.layout.find((l: LayoutItem) => l.i === 'b')!;
      // `a` never grew onto `b`; the two widgets do not overlap.
      expect(a.x + a.w).toBeLessThanOrEqual(b.x);
      expect(a.w).toBe(2);
    });

    it('allows a resize to overlap a neighbour when allowOverlap is set', () => {
      const onResizeStop = vi.fn();

      render(
        <Board
          width={1200}
          cols={12}
          rowHeight={100}
          margin={[0, 0]}
          containerPadding={[0, 0]}
          compact="free"
          allowOverlap
          onResizeStop={onResizeStop}
          defaultLayout={[
            { i: 'a', x: 0, y: 0, w: 2, h: 2 },
            { i: 'b', x: 2, y: 0, w: 2, h: 2 },
          ]}
        >
          <Board.Widget id="a" qa="WidgetA" resizeHandles={['e']}>
            A
          </Board.Widget>
          <Board.Widget id="b" qa="WidgetB">
            B
          </Board.Widget>
        </Board>,
      );

      const handle = screen.getAllByTestId('BoardResizeHandle')[0];
      fireEvent(handle, pointerEvent('pointerdown', 200, 200));
      fireEvent(window, pointerEvent('pointermove', 600, 200));
      fireEvent(window, pointerEvent('pointerup', 600, 200));

      expect(onResizeStop).toHaveBeenCalled();
      const info = onResizeStop.mock.calls.at(-1)![0];
      // With overlap allowed the resize is not blocked.
      expect(info.item.w).toBeGreaterThan(2);
    });
  });

  describe('drag cancel / handle', () => {
    const pointerEvent = (type: string, pageX: number, pageY: number) => {
      const event = new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        pointerId: 1,
        pointerType: 'mouse',
      });
      Object.defineProperty(event, 'pageX', { get: () => pageX });
      Object.defineProperty(event, 'pageY', { get: () => pageY });
      return event;
    };

    it('focuses the widget from an eligible pointer drag zone', () => {
      render(
        <Board
          width={1200}
          dragHandle=".handle"
          defaultLayout={[{ i: 'a', x: 0, y: 0, w: 4, h: 2 }]}
        >
          <Board.Widget id="a" qa="WidgetA">
            <div className="handle" data-qa="Handle">
              Grip
            </div>
            <div data-qa="Body">Body</div>
          </Board.Widget>
        </Board>,
      );

      const widget = screen.getByTestId('WidgetA');
      fireEvent(screen.getByTestId('Body'), pointerEvent('pointerdown', 0, 0));
      expect(widget).not.toHaveFocus();

      fireEvent(
        screen.getByTestId('Handle'),
        pointerEvent('pointerdown', 0, 0),
      );
      expect(widget).toHaveFocus();
      expect(widget).not.toHaveAttribute('data-focus-visible');
    });

    it('does not start a drag from an element matching dragCancel', () => {
      const onDragStart = vi.fn();
      render(
        <Board
          width={1200}
          dragCancel="button"
          onDragStart={onDragStart}
          defaultLayout={[{ i: 'a', x: 0, y: 0, w: 4, h: 2 }]}
        >
          <Board.Widget id="a" qa="WidgetA">
            <button data-qa="Btn" type="button">
              Click
            </button>
          </Board.Widget>
        </Board>,
      );

      const btn = screen.getByTestId('Btn');
      fireEvent(btn, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 60, 0));
      fireEvent(window, pointerEvent('pointerup', 60, 0));

      expect(onDragStart).not.toHaveBeenCalled();
    });

    it('lets a dragCancel element still receive its own pointer events', () => {
      // Regression: the gate must not `stopPropagation()` in the capture phase,
      // or React halts the synthetic dispatch before the pressed element (the
      // button) gets its own `onPointerDown`, breaking its press state.
      const onDragStart = vi.fn();
      const onButtonPointerDown = vi.fn();
      render(
        <Board
          width={1200}
          dragCancel="button"
          onDragStart={onDragStart}
          defaultLayout={[{ i: 'a', x: 0, y: 0, w: 4, h: 2 }]}
        >
          <Board.Widget id="a" qa="WidgetA">
            <button
              data-qa="Btn"
              type="button"
              onPointerDown={onButtonPointerDown}
            >
              Click
            </button>
          </Board.Widget>
        </Board>,
      );

      const btn = screen.getByTestId('Btn');
      fireEvent(btn, pointerEvent('pointerdown', 0, 0));

      expect(onButtonPointerDown).toHaveBeenCalledTimes(1);
      expect(onDragStart).not.toHaveBeenCalled();
    });

    it('does not preventDefault on a dragCancel element (keeps native focus)', () => {
      // Regression: the drag must not reach `useMove`'s pointer-down handler for
      // a gated press, because it calls `preventDefault()` - which would cancel
      // a native input's focus-on-pointerdown.
      const onDragStart = vi.fn();
      render(
        <Board
          width={1200}
          dragCancel="input"
          onDragStart={onDragStart}
          defaultLayout={[{ i: 'a', x: 0, y: 0, w: 4, h: 2 }]}
        >
          <Board.Widget id="a" qa="WidgetA">
            <input data-qa="Inp" />
          </Board.Widget>
        </Board>,
      );

      const inp = screen.getByTestId('Inp');
      const evt = pointerEvent('pointerdown', 0, 0);
      fireEvent(inp, evt);

      expect(evt.defaultPrevented).toBe(false);
      expect(onDragStart).not.toHaveBeenCalled();
    });

    it('still starts a drag from a non-cancelled area of the widget', () => {
      const onDragStart = vi.fn();
      render(
        <Board
          width={1200}
          dragCancel="button"
          onDragStart={onDragStart}
          defaultLayout={[{ i: 'a', x: 0, y: 0, w: 4, h: 2 }]}
        >
          <Board.Widget id="a" qa="WidgetA">
            <button data-qa="Btn" type="button">
              Click
            </button>
          </Board.Widget>
        </Board>,
      );

      const widget = screen.getByTestId('WidgetA');
      fireEvent(widget, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 60, 0));
      fireEvent(window, pointerEvent('pointerup', 60, 0));

      expect(onDragStart).toHaveBeenCalled();
    });

    it('only starts a drag from within dragHandle', () => {
      const onDragStart = vi.fn();
      render(
        <Board
          width={1200}
          dragHandle=".handle"
          onDragStart={onDragStart}
          defaultLayout={[{ i: 'a', x: 0, y: 0, w: 4, h: 2 }]}
        >
          <Board.Widget id="a" qa="WidgetA">
            <div className="handle" data-qa="Handle">
              Grip
            </div>
            <div data-qa="Body">Body</div>
          </Board.Widget>
        </Board>,
      );

      // Press outside the handle: no drag.
      const body = screen.getByTestId('Body');
      fireEvent(body, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 60, 0));
      fireEvent(window, pointerEvent('pointerup', 60, 0));
      expect(onDragStart).not.toHaveBeenCalled();

      // Press on the handle: drag starts.
      const handle = screen.getByTestId('Handle');
      fireEvent(handle, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 60, 0));
      fireEvent(window, pointerEvent('pointerup', 60, 0));
      expect(onDragStart).toHaveBeenCalled();
    });
  });

  describe('Board.Responsive', () => {
    const breakpoints = { lg: 800, md: 500, sm: 0 };
    const cols = { lg: 12, md: 6, sm: 2 };
    const layouts = {
      lg: [{ i: 'a', x: 0, y: 0, w: 1, h: 1 }],
      md: [{ i: 'a', x: 0, y: 0, w: 1, h: 1 }],
      sm: [{ i: 'a', x: 0, y: 0, w: 1, h: 1 }],
    };

    it('selects the breakpoint (and column count) from the width', () => {
      render(
        <Board.Responsive
          width={1000}
          margin={[0, 0]}
          containerPadding={[0, 0]}
          breakpoints={breakpoints}
          cols={cols}
          layouts={layouts}
        >
          <Board.Widget id="a" qa="WidgetA">
            A
          </Board.Widget>
        </Board.Responsive>,
      );

      // lg => 12 columns over 1000px => a 1-col-wide widget is ~83px.
      const widget = screen.getByTestId('WidgetA');
      expect(widget.style.width).toBe('83px');
    });

    it('activates a breakpoint at a width exactly equal to its minimum', () => {
      render(
        <Board.Responsive
          width={800}
          margin={[0, 0]}
          containerPadding={[0, 0]}
          breakpoints={breakpoints}
          cols={cols}
          layouts={layouts}
        >
          <Board.Widget id="a" qa="WidgetA">
            A
          </Board.Widget>
        </Board.Responsive>,
      );

      // width === lg minimum (800) => lg => 12 columns over 800px => ~67px.
      const widget = screen.getByTestId('WidgetA');
      expect(widget.style.width).toBe('67px');
    });

    it('honors a forced breakpoint regardless of width', () => {
      render(
        <Board.Responsive
          width={1000}
          breakpoint="sm"
          margin={[0, 0]}
          containerPadding={[0, 0]}
          breakpoints={breakpoints}
          cols={cols}
          layouts={layouts}
        >
          <Board.Widget id="a" qa="WidgetA">
            A
          </Board.Widget>
        </Board.Responsive>,
      );

      // Forced sm => 2 columns over 1000px => a 1-col-wide widget is 500px.
      const widget = screen.getByTestId('WidgetA');
      expect(widget.style.width).toBe('500px');
    });

    it('writes back a committed layout under the active breakpoint', () => {
      const onLayoutChange = vi.fn();
      render(
        <Board.Responsive
          width={1000}
          margin={[0, 0]}
          containerPadding={[0, 0]}
          breakpoints={breakpoints}
          cols={cols}
          layouts={layouts}
          onLayoutChange={onLayoutChange}
        >
          <Board.Widget id="a" qa="WidgetA">
            A
          </Board.Widget>
        </Board.Responsive>,
      );

      const widget = screen.getByTestId('WidgetA');
      widget.focus();
      fireEvent.keyDown(widget, { key: 'ArrowRight' });

      expect(onLayoutChange).toHaveBeenCalled();
      const [current, all] = onLayoutChange.mock.calls.at(-1)!;
      expect((current as LayoutItem[]).find((l) => l.i === 'a')?.x).toBe(1);
      // The active breakpoint (lg) is updated in the returned map.
      expect((all.lg as LayoutItem[]).find((l) => l.i === 'a')?.x).toBe(1);
    });

    it('fires onWidthChange with the measured width and active column count', () => {
      // The default ResizeObserver mock never invokes its callback; use a
      // controllable one so a measurement can be simulated, and spy offsetWidth
      // so the board measures a non-zero width.
      const offsetWidthSpy = vi
        .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
        .mockReturnValue(1000);
      const fires: Array<() => void> = [];
      const RealResizeObserver = global.ResizeObserver;
      global.ResizeObserver = class {
        cb: ResizeObserverCallback;
        constructor(cb: ResizeObserverCallback) {
          this.cb = cb;
        }
        observe(element: Element) {
          // react-aria's useResizeObserver ignores empty entry lists, so pass a
          // non-empty one.
          fires.push(() =>
            this.cb(
              [{ target: element } as ResizeObserverEntry],
              this as unknown as ResizeObserver,
            ),
          );
        }
        unobserve() {}
        disconnect() {}
      } as unknown as typeof ResizeObserver;

      const onWidthChange = vi.fn();

      try {
        render(
          <Board.Responsive
            margin={[0, 0]}
            containerPadding={[0, 0]}
            breakpoints={breakpoints}
            cols={cols}
            layouts={layouts}
            onWidthChange={onWidthChange}
          >
            <Board.Widget id="a" qa="WidgetA">
              A
            </Board.Widget>
          </Board.Responsive>,
        );

        act(() => {
          fires.forEach((fire) => fire());
        });

        expect(onWidthChange).toHaveBeenCalled();
        const [width, colCount] = onWidthChange.mock.calls.at(-1)!;
        expect(width).toBe(1000);
        // width 1000 => lg breakpoint (min 800) => 12 columns.
        expect(colCount).toBe(12);
      } finally {
        offsetWidthSpy.mockRestore();
        global.ResizeObserver = RealResizeObserver;
      }
    });
  });

  describe('cross-board drop target selection', () => {
    // jsdom returns empty rects, so feed the registry deterministic geometry:
    // two 600px-wide boards sitting side by side.
    const mockRect = (
      left: number,
      top: number,
      width: number,
      height: number,
    ): DOMRect =>
      ({
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect;

    // React Aria's useMove derives its deltas from pageX/pageY, which jsdom drops
    // when passed via the PointerEvent init, so define them by hand.
    const pointerEvent = (type: string, pageX: number, pageY: number) => {
      const event = new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        pointerId: 1,
        pointerType: 'mouse',
      });
      Object.defineProperty(event, 'pageX', { get: () => pageX });
      Object.defineProperty(event, 'pageY', { get: () => pageY });
      return event;
    };

    // A wide widget (4 of 6 columns => 400px) starting flush-left on the source
    // board, whose content sits at viewport x:[0,600] and the target at
    // x:[600,1200]. Returns the pieces a test needs to drive a pointer drag.
    function setupSideBySideBoards(onWidgetTransfer: () => void) {
      const utils = render(
        <Board.Provider onWidgetTransfer={onWidgetTransfer}>
          <Board
            id="source"
            width={600}
            cols={6}
            rowHeight={100}
            margin={[0, 0]}
            containerPadding={[0, 0]}
            defaultLayout={[{ i: 'w', x: 0, y: 0, w: 4, h: 1 }]}
          >
            <Board.Widget id="w" qa="Wide">
              W
            </Board.Widget>
          </Board>
          <Board
            id="target"
            width={600}
            cols={6}
            rowHeight={100}
            margin={[0, 0]}
            containerPadding={[0, 0]}
            defaultLayout={[{ i: 'z', x: 5, y: 0, w: 1, h: 1 }]}
          >
            <Board.Widget id="z" qa="Target">
              Z
            </Board.Widget>
          </Board>
        </Board.Provider>,
      );

      const widget = screen.getByTestId('Wide');
      // A widget host is a direct child of its board's content layer.
      const sourceContent = widget.parentElement as HTMLElement;
      const targetContent = screen.getByTestId('Target')
        .parentElement as HTMLElement;

      sourceContent.getBoundingClientRect = () => mockRect(0, 0, 600, 400);
      targetContent.getBoundingClientRect = () => mockRect(600, 0, 600, 400);
      widget.getBoundingClientRect = () => mockRect(0, 0, 400, 100);

      return { ...utils, widget };
    }

    it('does not transfer while the widget center is still over the source', () => {
      const onWidgetTransfer = vi.fn();
      const { widget } = setupSideBySideBoards(onWidgetTransfer);

      // Drag the top-left to x=300: the widget center (500) is still over the
      // source board (x:[0,600]). Selection follows the center, so the widget
      // stays on the source board.
      fireEvent(widget, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 300, 0));
      fireEvent(window, pointerEvent('pointerup', 300, 0));

      expect(onWidgetTransfer).not.toHaveBeenCalled();
    });

    it('transfers once the widget center crosses into the target', () => {
      const onWidgetTransfer = vi.fn();
      const { widget } = setupSideBySideBoards(onWidgetTransfer);

      // Drag the top-left to x=500: the widget center (700) is inside the target
      // board (x:[600,1200]) even though the top-left is still over the source.
      // Selection follows the center, so the widget transfers.
      fireEvent(widget, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 500, 0));
      fireEvent(window, pointerEvent('pointerup', 500, 0));

      expect(onWidgetTransfer).toHaveBeenCalledTimes(1);
      expect(onWidgetTransfer).toHaveBeenCalledWith(
        expect.objectContaining({
          widgetId: 'w',
          fromBoardId: 'source',
          toBoardId: 'target',
        }),
      );
    });
  });

  describe('spring-loaded tab activation', () => {
    // React Aria's useMove derives its deltas from pageX/pageY, which jsdom
    // drops when passed via the PointerEvent init, so define them by hand.
    const pointerEvent = (type: string, pageX: number, pageY: number) => {
      const event = new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        pointerId: 1,
        pointerType: 'mouse',
      });
      Object.defineProperty(event, 'pageX', { get: () => pageX });
      Object.defineProperty(event, 'pageY', { get: () => pageY });
      return event;
    };

    const renderBoardWithTabs = () =>
      renderWithRoot(
        <Board
          width={1200}
          defaultLayout={[
            { i: 'dragme', x: 0, y: 0, w: 2, h: 2 },
            { i: 'tabs', x: 2, y: 0, w: 6, h: 4 },
          ]}
        >
          <Board.Widget id="dragme" qa="DragMe">
            Drag me
          </Board.Widget>
          <Board.Widget id="tabs">
            <Tabs defaultActiveKey="one">
              <Tab key="one" title="One">
                Panel one
              </Tab>
              <Tab key="two" title="Two">
                Panel two
              </Tab>
            </Tabs>
          </Board.Widget>
        </Board>,
      );

    it('opens an inactive tab when a widget is dragged over its header', () => {
      vi.useFakeTimers();
      try {
        renderBoardWithTabs();

        expect(screen.getByText('Panel one')).toBeInTheDocument();
        expect(screen.queryByText('Panel two')).not.toBeInTheDocument();

        // Start a pointer drag: the first move flips the board into "dragging",
        // which is what arms spring-loading in the tabs it contains.
        const widget = screen.getByTestId('DragMe');
        fireEvent(widget, pointerEvent('pointerdown', 0, 0));
        fireEvent(window, pointerEvent('pointermove', 40, 0));

        // Hover the inactive tab; after the delay it spring-loads open.
        fireEvent.pointerEnter(screen.getByTestId('Tab-two'));
        act(() => {
          vi.advanceTimersByTime(600);
        });

        expect(screen.getByText('Panel two')).toBeInTheDocument();
        // The source tab stays mounted during the drag so a widget dragged out
        // of it (and any board owning the gesture) is not unmounted mid-drag.
        expect(screen.getByText('Panel one')).toBeInTheDocument();

        fireEvent(window, pointerEvent('pointerup', 40, 0));
      } finally {
        vi.useRealTimers();
      }
    });

    it('does not switch tabs on hover when no drag is in progress', () => {
      vi.useFakeTimers();
      try {
        renderBoardWithTabs();

        fireEvent.pointerEnter(screen.getByTestId('Tab-two'));
        act(() => {
          vi.advanceTimersByTime(600);
        });

        expect(screen.queryByText('Panel two')).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it('cancels a pending spring-load when the pointer leaves before the delay', () => {
      vi.useFakeTimers();
      try {
        renderBoardWithTabs();

        const widget = screen.getByTestId('DragMe');
        fireEvent(widget, pointerEvent('pointerdown', 0, 0));
        fireEvent(window, pointerEvent('pointermove', 40, 0));

        const tabTwo = screen.getByTestId('Tab-two');
        fireEvent.pointerEnter(tabTwo);
        act(() => {
          vi.advanceTimersByTime(200);
        });
        // Leave before the delay elapses - the tab must not open.
        fireEvent.pointerLeave(tabTwo);
        act(() => {
          vi.advanceTimersByTime(600);
        });

        expect(screen.queryByText('Panel two')).not.toBeInTheDocument();

        fireEvent(window, pointerEvent('pointerup', 40, 0));
      } finally {
        vi.useRealTimers();
      }
    });
  });
  describe('selection', () => {
    // Deterministic geometry for the marquee: a 600px-wide, 6-column board with
    // no margins, so column N starts at x = N * 100 and row N at y = N * 100.
    const mockRect = (
      left: number,
      top: number,
      width: number,
      height: number,
    ): DOMRect =>
      ({
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect;

    /**
     * Additive press. user-event applies modifiers through the keyboard API,
     * and a held key only survives across calls within one `setup()` session.
     */
    const shiftPress = async (el: HTMLElement) => {
      const user = userEvent.setup();
      await user.keyboard('{Shift>}');
      await user.click(el);
      await user.keyboard('{/Shift}');
    };

    const selectionLayout = [
      { i: 'a', x: 0, y: 0, w: 2, h: 1 },
      { i: 'b', x: 2, y: 0, w: 2, h: 1 },
      { i: 'c', x: 0, y: 1, w: 2, h: 1 },
    ];

    function renderSelectableBoard(props: Record<string, unknown> = {}) {
      const utils = render(
        <Board
          width={600}
          cols={6}
          rowHeight={100}
          margin={[0, 0]}
          containerPadding={[0, 0]}
          selectionMode="multiple"
          defaultLayout={selectionLayout}
          {...props}
        >
          <Board.Widget id="a" qa="A" aria-label="Alpha">
            <button type="button">Inner</button>
          </Board.Widget>
          <Board.Widget id="b" qa="B" aria-label="Beta">
            B
          </Board.Widget>
          <Board.Widget id="c" qa="C" aria-label="Gamma">
            C
          </Board.Widget>
        </Board>,
      );

      return { ...utils, widget: (qa: string) => screen.getByTestId(qa) };
    }

    it('selects a widget on a plain press', async () => {
      const onSelectionChange = vi.fn();
      const { widget } = renderSelectableBoard({ onSelectionChange });

      await userEvent.click(widget('B'));

      expect(onSelectionChange).toHaveBeenCalledWith(['b']);
      expect(widget('B')).toHaveAttribute('data-selected');
    });

    it('selects on pointer-down, before any drag begins', () => {
      const onSelectionChange = vi.fn();
      const { widget } = renderSelectableBoard({ onSelectionChange });

      // No pointerup, no click — the selection is already committed, which is
      // what lets the drag that follows know what it is moving.
      fireEvent.pointerDown(widget('B'), { button: 0, pointerId: 1 });

      expect(onSelectionChange).toHaveBeenCalledWith(['b']);
    });

    it('returns keys in layout order, not click order', async () => {
      const onSelectionChange = vi.fn();
      const { widget } = renderSelectableBoard({ onSelectionChange });

      await userEvent.click(widget('C'));
      await shiftPress(widget('A'));

      expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'c']);
    });

    it('toggles a widget on each additive press', async () => {
      const onSelectionChange = vi.fn();
      const { widget } = renderSelectableBoard({ onSelectionChange });

      await userEvent.click(widget('A'));
      await shiftPress(widget('B'));
      expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b']);

      await shiftPress(widget('A'));
      expect(onSelectionChange).toHaveBeenLastCalledWith(['b']);
    });

    it('replaces the selection on a plain press', async () => {
      const onSelectionChange = vi.fn();
      const { widget } = renderSelectableBoard({ onSelectionChange });

      await userEvent.click(widget('A'));
      await shiftPress(widget('B'));
      expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b']);

      await userEvent.click(widget('C'));
      expect(onSelectionChange).toHaveBeenLastCalledWith(['c']);
    });

    it('replaces instead of accumulating in single mode', async () => {
      const onSelectionChange = vi.fn();
      const { widget } = renderSelectableBoard({
        onSelectionChange,
        selectionMode: 'single',
      });

      await userEvent.click(widget('A'));
      await shiftPress(widget('B'));

      expect(onSelectionChange).toHaveBeenLastCalledWith(['b']);
    });

    it('does nothing when selectionMode is none', async () => {
      const onSelectionChange = vi.fn();
      const { widget } = renderSelectableBoard({
        onSelectionChange,
        selectionMode: 'none',
      });

      await userEvent.click(widget('B'));

      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(widget('B')).not.toHaveAttribute('data-selected');
    });

    describe('clearing', () => {
      it('replaces the selection when pressing a widget outside it', async () => {
        const onSelectionChange = vi.fn();
        const { widget } = renderSelectableBoard({ onSelectionChange });

        await userEvent.click(widget('B'));
        onSelectionChange.mockClear();

        fireEvent.pointerDown(widget('C'), { button: 0, pointerId: 1 });

        // The press grabs `c`, so a drag that follows moves exactly that.
        expect(onSelectionChange).toHaveBeenCalledWith(['c']);
        expect(widget('B')).not.toHaveAttribute('data-selected');
      });

      it('drops the selection when pressing an interactive descendant', async () => {
        const onSelectionChange = vi.fn();
        const { widget } = renderSelectableBoard({ onSelectionChange });

        await userEvent.click(widget('A'));
        onSelectionChange.mockClear();

        // Inside the *selected* widget — interacting with its content is still
        // interacting with something other than the selection.
        fireEvent.pointerDown(screen.getByRole('button', { name: 'Inner' }), {
          button: 0,
          pointerId: 1,
        });

        expect(onSelectionChange).toHaveBeenCalledWith([]);
      });

      it('keeps the selection when pressing a widget inside it', async () => {
        const onSelectionChange = vi.fn();
        const { widget } = renderSelectableBoard({ onSelectionChange });

        await userEvent.click(widget('B'));
        onSelectionChange.mockClear();

        // This press is the start of a group drag, not a change of mind.
        fireEvent.pointerDown(widget('B'), { button: 0, pointerId: 1 });

        expect(onSelectionChange).not.toHaveBeenCalled();
      });

      it('does not let a nested widget press select its container', async () => {
        const onOuter = vi.fn();
        const onInner = vi.fn();
        render(
          <Board
            width={600}
            cols={6}
            selectionMode="multiple"
            defaultLayout={[{ i: 'outer', x: 0, y: 0, w: 6, h: 4 }]}
            onSelectionChange={onOuter}
          >
            <Board.Widget id="outer" qa="Outer" aria-label="Outer">
              <Board
                width={400}
                cols={4}
                selectionMode="multiple"
                // Non-draggable: a draggable widget already stops pointer-down
                // from bubbling (`stopBubbleProps`), so the gap this guards is
                // only reachable when dragging is off.
                isDraggable={false}
                defaultLayout={[{ i: 'inner', x: 0, y: 0, w: 2, h: 1 }]}
                onSelectionChange={onInner}
              >
                <Board.Widget id="inner" qa="Inner" aria-label="Inner">
                  inner
                </Board.Widget>
              </Board>
            </Board.Widget>
          </Board>,
        );

        // Pressing the inner widget twice: the second press is a no-op for the
        // inner board, but it must still not bubble out and select the
        // container widget on the outer one.
        fireEvent.pointerDown(screen.getByTestId('Inner'), {
          button: 0,
          pointerId: 1,
        });
        fireEvent.pointerDown(screen.getByTestId('Inner'), {
          button: 0,
          pointerId: 1,
        });

        expect(onInner).toHaveBeenCalledWith(['inner']);
        expect(onOuter).not.toHaveBeenCalled();
        expect(screen.getByTestId('Outer')).not.toHaveAttribute(
          'data-selected',
        );
      });

      it('drops the selection when focus leaves the board', async () => {
        const onSelectionChange = vi.fn();
        render(
          <>
            <button type="button">Outside</button>
            <Board
              width={600}
              cols={6}
              selectionMode="multiple"
              defaultLayout={selectionLayout}
              onSelectionChange={onSelectionChange}
            >
              <Board.Widget id="a" qa="A" aria-label="Alpha">
                A
              </Board.Widget>
              <Board.Widget id="b" qa="B" aria-label="Beta">
                B
              </Board.Widget>
              <Board.Widget id="c" qa="C" aria-label="Gamma">
                C
              </Board.Widget>
            </Board>
          </>,
        );

        await userEvent.click(screen.getByTestId('B'));
        expect(screen.getByTestId('B')).toHaveAttribute('data-selected');
        onSelectionChange.mockClear();

        screen.getByRole('button', { name: 'Outside' }).focus();
        await waitFor(() => expect(onSelectionChange).toHaveBeenCalledWith([]));
        expect(screen.getByTestId('B')).not.toHaveAttribute('data-selected');
      });
    });

    describe('keyboard', () => {
      // No modifier here: focus already says which widget is meant, and Space
      // cannot be mistaken for the start of a drag.
      it('toggles the focused widget with Space', async () => {
        const onSelectionChange = vi.fn();
        const { widget } = renderSelectableBoard({ onSelectionChange });

        widget('B').focus();
        await userEvent.keyboard(' ');
        expect(onSelectionChange).toHaveBeenLastCalledWith(['b']);

        await userEvent.keyboard(' ');
        expect(onSelectionChange).toHaveBeenLastCalledWith([]);
      });

      it('leaves Space alone inside a nested control', async () => {
        const onSelectionChange = vi.fn();
        renderSelectableBoard({ onSelectionChange });

        screen.getByRole('button', { name: 'Inner' }).focus();
        await userEvent.keyboard(' ');

        expect(onSelectionChange).not.toHaveBeenCalled();
      });

      it('clears the selection on Escape', async () => {
        const onSelectionChange = vi.fn();
        const { widget } = renderSelectableBoard({ onSelectionChange });

        await userEvent.click(widget('B'));
        await userEvent.keyboard('{Escape}');

        expect(onSelectionChange).toHaveBeenLastCalledWith([]);
        expect(widget('B')).not.toHaveAttribute('data-selected');
      });

      it('reports a delete request without touching the layout', async () => {
        const onWidgetsDelete = vi.fn();
        const onLayoutChange = vi.fn();
        const { widget } = renderSelectableBoard({
          onWidgetsDelete,
          onLayoutChange,
        });

        await userEvent.click(widget('B'));
        onLayoutChange.mockClear();
        await userEvent.keyboard('{Delete}');

        expect(onWidgetsDelete).toHaveBeenCalledWith(['b']);
        // Board reports; the consumer owns the data.
        expect(onLayoutChange).not.toHaveBeenCalled();
        expect(screen.getByTestId('B')).toBeInTheDocument();
      });

      it('does not delete while focus is in a text field', async () => {
        const onWidgetsDelete = vi.fn();
        render(
          <Board
            width={600}
            cols={6}
            selectionMode="multiple"
            defaultSelectedKeys={['a']}
            defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 1 }]}
            onWidgetsDelete={onWidgetsDelete}
          >
            <Board.Widget id="a" qa="A">
              <input aria-label="Field" />
            </Board.Widget>
          </Board>,
        );

        screen.getByLabelText('Field').focus();
        await userEvent.keyboard('{Delete}');

        expect(onWidgetsDelete).not.toHaveBeenCalled();
      });
    });

    describe('accessibility', () => {
      it('names each widget as a group with a valid roledescription', () => {
        renderSelectableBoard();

        const host = screen.getByRole('group', { name: 'Alpha' });
        // `aria-roledescription` is invalid on a role-less element, so the host
        // must carry a real role for it to mean anything.
        expect(host).toHaveAttribute(
          'aria-roledescription',
          'Draggable widget',
        );
        expect(host).toHaveAttribute('aria-keyshortcuts', 'Space');
      });

      it('prefers aria-label over qa and the layout id for the name', () => {
        render(
          <Board
            width={600}
            defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 1 }]}
          >
            <Board.Widget id="a" qa="QaName">
              A
            </Board.Widget>
          </Board>,
        );

        expect(
          screen.getByRole('group', { name: 'QaName' }),
        ).toBeInTheDocument();
      });

      it('describes a selected widget as selected', async () => {
        const { widget } = renderSelectableBoard();

        expect(widget('B')).not.toHaveAttribute('aria-describedby');
        await userEvent.click(widget('B'));

        const describedBy = widget('B').getAttribute('aria-describedby');
        expect(describedBy).toBeTruthy();
        expect(document.getElementById(describedBy!)).toHaveTextContent(
          'Selected',
        );
      });

      it('announces the selection through a live region', async () => {
        const { widget } = renderSelectableBoard();
        const status = screen.getByRole('status');

        await userEvent.click(widget('B'));
        expect(status).toHaveTextContent('Beta selected');

        await shiftPress(widget('A'));
        expect(status).toHaveTextContent('2 widgets selected');

        await userEvent.keyboard('{Escape}');
        expect(status).toHaveTextContent('Selection cleared');
      });

      it('exposes no live region or hint when selection is off', () => {
        renderSelectableBoard({ selectionMode: 'none' });

        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    describe('marquee', () => {
      const pointer = (
        type: string,
        clientX: number,
        clientY: number,
        modifiers: { ctrlKey?: boolean; shiftKey?: boolean } = {},
      ) => {
        const event = new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          button: 0,
          pointerId: 1,
          pointerType: 'mouse',
          clientX,
          clientY,
          ...modifiers,
        });
        Object.defineProperty(event, 'clientX', { get: () => clientX });
        Object.defineProperty(event, 'clientY', { get: () => clientY });
        return event;
      };

      function setupMarquee(props: Record<string, unknown> = {}) {
        const utils = renderSelectableBoard(props);
        const content = screen.getByTestId('A').parentElement as HTMLElement;
        content.getBoundingClientRect = () => mockRect(0, 0, 600, 400);

        return { ...utils, content };
      }

      it('selects every widget the band intersects', () => {
        const onSelectionChange = vi.fn();
        const { content } = setupMarquee({ onSelectionChange });

        // Band over x:[0,250], y:[0,50] — covers `a` (0-200) and `b` (200-400).
        fireEvent(content, pointer('pointerdown', 0, 0));
        fireEvent(window, pointer('pointermove', 250, 50));
        fireEvent(window, pointer('pointerup', 250, 50));

        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(onSelectionChange).toHaveBeenCalledWith(['a', 'b']);
      });

      it('commits once per gesture, not once per pointer frame', () => {
        const onSelectionChange = vi.fn();
        const { content } = setupMarquee({ onSelectionChange });

        fireEvent(content, pointer('pointerdown', 0, 0));
        fireEvent(window, pointer('pointermove', 100, 50));
        fireEvent(window, pointer('pointermove', 150, 50));
        fireEvent(window, pointer('pointermove', 250, 50));
        fireEvent(window, pointer('pointerup', 250, 50));

        expect(onSelectionChange).toHaveBeenCalledTimes(1);
      });

      it('renders the band while dragging and removes it on release', () => {
        const { content } = setupMarquee();

        fireEvent(content, pointer('pointerdown', 0, 0));
        fireEvent(window, pointer('pointermove', 250, 50));
        expect(screen.getByTestId('BoardMarquee')).toBeInTheDocument();

        fireEvent(window, pointer('pointerup', 250, 50));
        expect(screen.queryByTestId('BoardMarquee')).not.toBeInTheDocument();
      });

      it('ignores a press below the movement threshold and clears instead', async () => {
        const onSelectionChange = vi.fn();
        const { content, widget } = setupMarquee({ onSelectionChange });

        await userEvent.click(widget('B'));
        onSelectionChange.mockClear();

        fireEvent(content, pointer('pointerdown', 0, 300));
        fireEvent(window, pointer('pointermove', 1, 300));
        fireEvent(window, pointer('pointerup', 1, 300));

        expect(screen.queryByTestId('BoardMarquee')).not.toBeInTheDocument();
        expect(onSelectionChange).toHaveBeenCalledWith([]);
      });

      it('adds to the existing selection with Shift', async () => {
        const onSelectionChange = vi.fn();
        const { content, widget } = setupMarquee({ onSelectionChange });

        await userEvent.click(widget('C'));

        fireEvent(content, pointer('pointerdown', 0, 0, { shiftKey: true }));
        fireEvent(window, pointer('pointermove', 250, 50));
        fireEvent(window, pointer('pointerup', 250, 50));

        expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b', 'c']);
      });

      it('never starts on a widget — that press is a drag', () => {
        const { widget } = setupMarquee();

        fireEvent(widget('A'), pointer('pointerdown', 0, 0));
        fireEvent(window, pointer('pointermove', 250, 50));

        expect(screen.queryByTestId('BoardMarquee')).not.toBeInTheDocument();
      });

      // Dragging is off while the modifier is held, so the whole board — widgets
      // included — becomes one selection surface.
      it('adds to the selection from the platform modifier flag', async () => {
        const onSelectionChange = vi.fn();
        const { content } = setupMarquee({ onSelectionChange });

        fireEvent(content, pointer('pointerdown', 0, 0, { ctrlKey: true }));
        fireEvent(window, pointer('pointermove', 250, 50));
        fireEvent(window, pointer('pointerup', 250, 50));

        expect(onSelectionChange).toHaveBeenCalledWith(['a', 'b']);
      });

      it('re-announces two consecutive selections that read the same', () => {
        const { content } = setupMarquee();
        const status = screen.getByRole('status');

        // Band over a + b.
        fireEvent(content, pointer('pointerdown', 0, 0));
        fireEvent(window, pointer('pointermove', 250, 50));
        fireEvent(window, pointer('pointerup', 250, 50));
        const first = status.textContent;

        // Band over a + c — a different selection that renders the same text.
        fireEvent(content, pointer('pointerdown', 0, 0));
        fireEvent(window, pointer('pointermove', 50, 150));
        fireEvent(window, pointer('pointerup', 50, 150));

        // A screen reader skips a live-region update whose text is
        // byte-identical to the one before it, so these must differ.
        expect(first).toContain('2 widgets selected');
        expect(status).toHaveTextContent('2 widgets selected');
        expect(status.textContent).not.toBe(first);
      });

      it('is disabled by allowMarqueeSelection={false}', () => {
        const { content } = setupMarquee({ allowMarqueeSelection: false });

        fireEvent(content, pointer('pointerdown', 0, 0));
        fireEvent(window, pointer('pointermove', 250, 50));

        expect(screen.queryByTestId('BoardMarquee')).not.toBeInTheDocument();
      });
    });

    describe('controlled selection', () => {
      it('renders the controlled keys and does not self-update', async () => {
        const onSelectionChange = vi.fn();
        renderSelectableBoard({ selectedKeys: ['a'], onSelectionChange });

        expect(screen.getByTestId('A')).toHaveAttribute('data-selected');

        await userEvent.click(screen.getByTestId('B'));

        // A plain press replaces, so the reported selection is just `b`.
        expect(onSelectionChange).toHaveBeenLastCalledWith(['b']);
        // The consumer owns the state; nothing moved without them.
        expect(screen.getByTestId('A')).toHaveAttribute('data-selected');
        expect(screen.getByTestId('B')).not.toHaveAttribute('data-selected');
      });

      it('ignores a key with no matching widget', () => {
        renderSelectableBoard({ selectedKeys: ['ghost', 'b'] });

        expect(screen.getByTestId('B')).toHaveAttribute('data-selected');
        expect(screen.getByTestId('A')).not.toHaveAttribute('data-selected');
      });
    });
  });

  describe('group move', () => {
    const mockRect = (
      left: number,
      top: number,
      width: number,
      height: number,
    ): DOMRect =>
      ({
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect;

    const pointerEvent = (type: string, pageX: number, pageY: number) => {
      const event = new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        pointerId: 1,
        pointerType: 'mouse',
      });
      Object.defineProperty(event, 'pageX', { get: () => pageX });
      Object.defineProperty(event, 'pageY', { get: () => pageY });
      return event;
    };

    /**
     * A 12-column, 100px-per-cell board with no margins, so grid cell N starts
     * at exactly N * 100 px on both axes.
     */
    function setupGroupBoard(props: Record<string, unknown> = {}) {
      const layout = (props.defaultLayout as LayoutItem[]) ?? [
        { i: 'a', x: 0, y: 0, w: 2, h: 1 },
        { i: 'b', x: 6, y: 0, w: 2, h: 1 },
        { i: 'far', x: 0, y: 4, w: 2, h: 1 },
      ];
      const utils = render(
        <Board
          width={1200}
          cols={12}
          rowHeight={100}
          margin={[0, 0]}
          containerPadding={[0, 0]}
          compact={null}
          selectionMode="multiple"
          defaultSelectedKeys={['a', 'b']}
          {...props}
          defaultLayout={layout}
        >
          {layout.map((item) => (
            <Board.Widget key={item.i} id={item.i} qa={item.i.toUpperCase()}>
              {item.i}
            </Board.Widget>
          ))}
        </Board>,
      );

      const grabbed = screen.getByTestId('A');
      const content = grabbed.parentElement as HTMLElement;
      content.getBoundingClientRect = () => mockRect(0, 0, 1200, 800);
      for (const item of layout) {
        const el = screen.getByTestId(item.i.toUpperCase());
        el.getBoundingClientRect = () =>
          mockRect(item.x * 100, item.y * 100, item.w * 100, item.h * 100);
      }

      return { ...utils, grabbed };
    }

    /** Positions keyed by id, e.g. `{ a: '2,0' }`. */
    const positions = (layout: LayoutItem[]) =>
      Object.fromEntries(layout.map((it) => [it.i, `${it.x},${it.y}`]));

    it('moves every selected widget by the same delta', () => {
      const onLayoutChange = vi.fn();
      const { grabbed } = setupGroupBoard({ onLayoutChange });

      fireEvent(grabbed, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 200, 100));
      fireEvent(window, pointerEvent('pointerup', 200, 100));

      const committed = onLayoutChange.mock.lastCall![0] as LayoutItem[];
      expect(positions(committed)).toMatchObject({ a: '2,1', b: '8,1' });
    });

    it('commits exactly once, before onDragStop', () => {
      const calls: string[] = [];
      const { grabbed } = setupGroupBoard({
        onLayoutChange: () => calls.push('layout'),
        onDragStop: () => calls.push('stop'),
      });

      fireEvent(grabbed, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 200, 0));
      fireEvent(window, pointerEvent('pointerup', 200, 0));

      expect(calls.filter((c) => c === 'layout')).toHaveLength(1);
      expect(calls).toEqual(['layout', 'stop']);
    });

    // The live bug in the app-level version this replaces: clamping each item
    // separately collapses the group against the wall and it never recovers.
    it('keeps the group shape when dragged into an edge', () => {
      const onLayoutChange = vi.fn();
      const { grabbed } = setupGroupBoard({ onLayoutChange });

      fireEvent(grabbed, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', -400, 0));
      fireEvent(window, pointerEvent('pointerup', -400, 0));

      const committed = onLayoutChange.mock.lastCall![0] as LayoutItem[];
      const a = committed.find((it) => it.i === 'a')!;
      const b = committed.find((it) => it.i === 'b')!;
      expect(b.x - a.x).toBe(6);
      expect(a.x).toBe(0);
    });

    it('never leaves a widget pinned after a group drop', () => {
      const onLayoutChange = vi.fn();
      const { grabbed } = setupGroupBoard({
        onLayoutChange,
        compact: 'vertical',
      });

      fireEvent(grabbed, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 200, 100));
      fireEvent(window, pointerEvent('pointerup', 200, 100));

      const committed = onLayoutChange.mock.lastCall![0] as LayoutItem[];
      // A leaked pin would freeze the widget forever — and consumers persist
      // layouts, so it would survive a reload.
      expect(committed.every((it) => !it.static)).toBe(true);
    });

    it('reports every mover through the drag callbacks', () => {
      const onDragStart = vi.fn();
      const { grabbed } = setupGroupBoard({ onDragStart });

      fireEvent(grabbed, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 100, 0));
      fireEvent(window, pointerEvent('pointerup', 100, 0));

      const info = onDragStart.mock.lastCall![0];
      expect(info.items.map((it: LayoutItem) => it.i)).toEqual(['a', 'b']);
      expect(info.item).toBe(info.items[0]);
      expect(info.placeholders).toHaveLength(2);
    });

    // Reported: dragging a group down on a compacting board shoved the widgets
    // below it further down, and the board only caught up on the *next* pointer
    // step. The group was being held in place while everything reflowed around
    // it — something a single widget is never allowed to do under vertical
    // compaction, which is why a single drag felt natural and a group did not.
    it('compacts the group during the drag, like a single widget', () => {
      const frames: LayoutItem[][] = [];
      const { grabbed } = setupGroupBoard({
        compact: 'vertical',
        defaultLayout: [
          { i: 'a', x: 0, y: 0, w: 2, h: 1 },
          { i: 'b', x: 2, y: 0, w: 2, h: 1 },
          { i: 'far', x: 0, y: 3, w: 2, h: 1 },
        ],
        onDrag: (info: { layout: LayoutItem[] }) =>
          frames.push(info.layout.map((it) => ({ ...it }))),
      });

      fireEvent(grabbed, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 0, 600));

      expect(frames.length).toBeGreaterThan(0);
      for (const frame of frames) {
        // `far` rises to the top, and the group packs in beneath it instead of
        // hanging six rows down where the pointer is.
        expect(positions(frame)).toEqual({ far: '0,0', a: '0,1', b: '2,0' });
      }
    });

    it('renders one placeholder per moving widget', () => {
      const { grabbed } = setupGroupBoard();

      fireEvent(grabbed, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 100, 0));

      expect(screen.getAllByTestId('BoardPlaceholder')).toHaveLength(2);
    });

    it('moves the whole group with the arrow keys', () => {
      const onLayoutChange = vi.fn();
      const { grabbed } = setupGroupBoard({ onLayoutChange });

      grabbed.focus();
      fireEvent.keyDown(grabbed, { key: 'ArrowRight' });
      fireEvent.keyUp(grabbed, { key: 'ArrowRight' });

      const committed = onLayoutChange.mock.lastCall![0] as LayoutItem[];
      expect(positions(committed)).toMatchObject({ a: '1,0', b: '7,0' });
    });

    it('leaves unselected widgets where they are', () => {
      const onLayoutChange = vi.fn();
      const { grabbed } = setupGroupBoard({ onLayoutChange });

      fireEvent(grabbed, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 100, 0));
      fireEvent(window, pointerEvent('pointerup', 100, 0));

      const committed = onLayoutChange.mock.lastCall![0] as LayoutItem[];
      expect(positions(committed).far).toBe('0,4');
    });

    it('drags only the grabbed widget when it is outside the selection', () => {
      const onLayoutChange = vi.fn();
      const onSelectionChange = vi.fn();
      render(
        <Board
          width={1200}
          cols={12}
          rowHeight={100}
          margin={[0, 0]}
          containerPadding={[0, 0]}
          compact={null}
          selectionMode="multiple"
          defaultSelectedKeys={['b']}
          defaultLayout={[
            { i: 'a', x: 0, y: 0, w: 2, h: 1 },
            { i: 'b', x: 6, y: 0, w: 2, h: 1 },
          ]}
          onLayoutChange={onLayoutChange}
          onSelectionChange={onSelectionChange}
        >
          <Board.Widget id="a" qa="A">
            a
          </Board.Widget>
          <Board.Widget id="b" qa="B">
            b
          </Board.Widget>
        </Board>,
      );

      const grabbed = screen.getByTestId('A');
      (grabbed.parentElement as HTMLElement).getBoundingClientRect = () =>
        mockRect(0, 0, 1200, 800);
      grabbed.getBoundingClientRect = () => mockRect(0, 0, 200, 100);

      fireEvent(grabbed, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 100, 0));
      fireEvent(window, pointerEvent('pointerup', 100, 0));

      const committed = onLayoutChange.mock.lastCall![0] as LayoutItem[];
      // The press grabbed `a`, so `a` became the selection and `b` stayed put.
      expect(positions(committed)).toMatchObject({ a: '1,0', b: '6,0' });
      expect(onSelectionChange).toHaveBeenCalledWith(['a']);
      expect(screen.getByTestId('B')).not.toHaveAttribute('data-selected');
    });

    it('grabs the pressed widget as the new selection', () => {
      const onSelectionChange = vi.fn();
      render(
        <Board
          width={1200}
          cols={12}
          rowHeight={100}
          margin={[0, 0]}
          containerPadding={[0, 0]}
          compact={null}
          selectionMode="multiple"
          defaultSelectedKeys={['b']}
          defaultLayout={[
            { i: 'a', x: 0, y: 0, w: 2, h: 1 },
            { i: 'b', x: 6, y: 0, w: 2, h: 1 },
          ]}
          onSelectionChange={onSelectionChange}
        >
          <Board.Widget id="a" qa="A">
            a
          </Board.Widget>
          <Board.Widget id="b" qa="B">
            b
          </Board.Widget>
        </Board>,
      );

      fireEvent.pointerDown(screen.getByTestId('A'), {
        button: 0,
        pointerId: 1,
      });

      expect(onSelectionChange).toHaveBeenCalledWith(['a']);
      expect(screen.getByTestId('B')).not.toHaveAttribute('data-selected');
    });

    it.each([
      ['no prop', undefined],
      ['an empty selection', [] as string[]],
      ['a single selected widget', ['a']],
    ])('drags identically with %s', (_label, keys) => {
      const onLayoutChange = vi.fn();
      const { grabbed } = setupGroupBoard(
        keys === undefined
          ? { onLayoutChange, selectionMode: 'none' }
          : { onLayoutChange, selectedKeys: keys },
      );

      fireEvent(grabbed, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 100, 0));
      fireEvent(window, pointerEvent('pointerup', 100, 0));

      const committed = onLayoutChange.mock.lastCall![0] as LayoutItem[];
      expect(positions(committed)).toMatchObject({
        a: '1,0',
        b: '6,0',
        far: '0,4',
      });
    });
  });
});
