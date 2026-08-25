import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

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

import type { ReactNode } from 'react';
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

  describe('resizeGripPlacement', () => {
    const layout = [{ i: 'a', x: 0, y: 0, w: 2, h: 2 }];

    it('keeps corner grips inside the widget by default', () => {
      render(
        <Board width={1200} defaultLayout={layout}>
          <Board.Widget id="a" qa="WidgetA">
            A
          </Board.Widget>
        </Board>,
      );

      const grip = screen.getByTestId('BoardResizeGrip');
      expect(grip).toHaveAttribute('data-placement', 'inside');
      expect(screen.getByTestId('WidgetA')).toContainElement(grip);
      // No extra layer for the default placement.
      expect(
        screen.queryByTestId('BoardResizeGripLayer'),
      ).not.toBeInTheDocument();
    });

    it('moves the corner hit-zone out with the grip', () => {
      render(
        <Board width={1200} resizeGripPlacement="corner" defaultLayout={layout}>
          <Board.Widget id="a" qa="WidgetA">
            A
          </Board.Widget>
        </Board>,
      );

      // The half of the grip that hangs outside the widget has to be grabbable and
      // has to keep the grip revealed, so the hit-zone goes with it rather than
      // staying behind inside the clip.
      const handle = screen.getByTestId('BoardResizeHandle');
      expect(screen.getByTestId('BoardResizeGripLayer')).toContainElement(
        handle,
      );
      expect(handle).toHaveAttribute('data-placement', 'corner');
    });

    it('leaves edge hit-zones inside the widget under corner placement', () => {
      render(
        <Board
          width={1200}
          resizeHandles={['se', 'e']}
          resizeGripPlacement="corner"
          defaultLayout={layout}
        >
          <Board.Widget id="a" qa="WidgetA">
            A
          </Board.Widget>
        </Board>,
      );

      const layer = screen.getByTestId('BoardResizeGripLayer');
      const handles = screen.getAllByTestId('BoardResizeHandle');
      expect(handles.length).toBe(2);
      const byAxis = Object.fromEntries(
        handles.map((h) => [h.getAttribute('data-axis'), h]),
      );
      expect(layer).toContainElement(byAxis.se!);
      expect(layer).not.toContainElement(byAxis.e!);
    });

    it('draws a corner grip outside the widget so its clip cannot cut it', () => {
      render(
        <Board width={1200} resizeGripPlacement="corner" defaultLayout={layout}>
          <Board.Widget id="a" qa="WidgetA">
            A
          </Board.Widget>
        </Board>,
      );

      const grip = screen.getByTestId('BoardResizeGrip');
      const layer = screen.getByTestId('BoardResizeGripLayer');
      expect(grip).toHaveAttribute('data-placement', 'corner');
      expect(layer).toContainElement(grip);
      // The whole point: a grip centred on the corner half-overhangs the widget,
      // whose own `overflow: hidden` would clip it. The layer is a sibling.
      expect(screen.getByTestId('WidgetA')).not.toContainElement(grip);
    });

    it('mirrors the widget rect on the grip layer', () => {
      render(
        <Board
          width={600}
          cols={6}
          rowHeight={100}
          margin={[0, 0]}
          containerPadding={[0, 0]}
          resizeGripPlacement="corner"
          defaultLayout={[{ i: 'a', x: 1, y: 2, w: 2, h: 1 }]}
        >
          <Board.Widget id="a" qa="WidgetA">
            A
          </Board.Widget>
        </Board>,
      );

      const layer = screen.getByTestId('BoardResizeGripLayer');
      const widget = screen.getByTestId('WidgetA');
      for (const prop of ['left', 'top', 'width', 'height'] as const) {
        expect(layer.style[prop]).toBe(widget.style[prop]);
      }
    });

    it('takes the placement from a single widget over the board default', () => {
      render(
        <Board
          width={1200}
          defaultLayout={[
            { i: 'a', x: 0, y: 0, w: 2, h: 2 },
            { i: 'b', x: 2, y: 0, w: 2, h: 2 },
          ]}
        >
          <Board.Widget id="a" qa="WidgetA" resizeGripPlacement="corner">
            A
          </Board.Widget>
          <Board.Widget id="b" qa="WidgetB">
            B
          </Board.Widget>
        </Board>,
      );

      expect(screen.getAllByTestId('BoardResizeGripLayer').length).toBe(1);
      const placements = screen
        .getAllByTestId('BoardResizeGrip')
        .map((grip) => grip.getAttribute('data-placement'));
      expect(placements.sort()).toEqual(['corner', 'inside']);
    });

    it('leaves the dotted edge grips inside the widget', () => {
      render(
        <Board
          width={1200}
          resizeHandles={['se', 'e']}
          resizeGripPlacement="corner"
          defaultLayout={layout}
        >
          <Board.Widget id="a" qa="WidgetA">
            A
          </Board.Widget>
        </Board>,
      );

      // Only the corner grip is hoisted; an edge grip sits along an edge, so it is
      // never clipped and has no reason to leave the widget.
      const edgeGrip = screen.getByTestId('BoardResizeEdgeGrip');
      expect(screen.getByTestId('WidgetA')).toContainElement(edgeGrip);
      expect(screen.getByTestId('BoardResizeGripLayer')).not.toContainElement(
        edgeGrip,
      );
    });

    it('renders no grip layer when resizing is disabled', () => {
      render(
        <Board
          width={1200}
          isResizable={false}
          resizeGripPlacement="corner"
          defaultLayout={layout}
        >
          <Board.Widget id="a" qa="WidgetA">
            A
          </Board.Widget>
        </Board>,
      );

      expect(
        screen.queryByTestId('BoardResizeGripLayer'),
      ).not.toBeInTheDocument();
    });
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

  describe('collisionMode', () => {
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
     * One free-grid board with 100px cells, `a` grabbed by its top-left corner.
     * jsdom has no layout, so the board's content box and the widget's own rect
     * are fed in by hand - the registry works entirely off those.
     */
    function setupBoard(
      collisionMode: 'revert' | 'downscale' | 'swap',
      layout: LayoutItem[],
      widgetSize: { w: number; h: number },
    ) {
      const onLayoutChange = vi.fn();
      render(
        <Board
          width={600}
          cols={6}
          rowHeight={100}
          margin={[0, 0]}
          containerPadding={[0, 0]}
          compact="free"
          collisionMode={collisionMode}
          defaultLayout={layout}
          onLayoutChange={onLayoutChange}
        >
          {layout.map((it) => (
            <Board.Widget key={it.i} id={it.i} qa={`Widget-${it.i}`}>
              {it.i}
            </Board.Widget>
          ))}
        </Board>,
      );

      const widget = screen.getByTestId('Widget-a');
      const content = widget.parentElement as HTMLElement;
      content.getBoundingClientRect = () => mockRect(0, 0, 600, 600);
      widget.getBoundingClientRect = () =>
        mockRect(0, 0, widgetSize.w * 100, widgetSize.h * 100);

      /** Drag `a`'s top-left through each offset in turn, then release. */
      const drag = (...steps: Array<[number, number]>) => {
        fireEvent(widget, pointerEvent('pointerdown', 0, 0));
        for (const [x, y] of steps) {
          fireEvent(window, pointerEvent('pointermove', x, y));
        }
        const last = steps.at(-1)!;
        fireEvent(window, pointerEvent('pointerup', last[0], last[1]));
      };

      const rectOf = (id: string) => {
        const committed = onLayoutChange.mock.calls.at(-1)![0] as LayoutItem[];
        const it = committed.find((l) => l.i === id)!;
        return `${it.x},${it.y} ${it.w}x${it.h}`;
      };

      return { drag, rectOf, onLayoutChange };
    }

    // `a` is 4 wide; the row below has only 3 free columns.
    const gapLayout: LayoutItem[] = [
      { i: 'a', x: 0, y: 0, w: 4, h: 1 },
      { i: 'b', x: 3, y: 1, w: 3, h: 1 },
    ];

    it('snaps back on collision by default', () => {
      const { drag, rectOf } = setupBoard('revert', gapLayout, { w: 4, h: 1 });

      drag([0, 100]);

      expect(rectOf('a')).toBe('0,0 4x1');
    });

    it('shrinks the widget into the free space at the drop cell', () => {
      const { drag, rectOf } = setupBoard('downscale', gapLayout, {
        w: 4,
        h: 1,
      });

      drag([0, 100]);

      // Only 3 columns are free in row 1, so the 4-wide widget lands 3 wide.
      expect(rectOf('a')).toBe('0,1 3x1');
      expect(rectOf('b')).toBe('3,1 3x1');
    });

    it('restores the full size when the drag reaches free space again', () => {
      const { drag, rectOf } = setupBoard('downscale', gapLayout, {
        w: 4,
        h: 1,
      });

      // Over the gap (shrinks), then past it into an empty row.
      drag([0, 100], [0, 200]);

      // Back to its original width - a shrunken frame must never become the next
      // frame's starting size.
      expect(rectOf('a')).toBe('0,2 4x1');
    });

    it('trades places with the widget under the drop', () => {
      const { drag, rectOf } = setupBoard(
        'swap',
        [
          { i: 'a', x: 0, y: 0, w: 2, h: 1 },
          { i: 'b', x: 2, y: 0, w: 2, h: 1 },
        ],
        { w: 2, h: 1 },
      );

      drag([200, 0]);

      expect(rectOf('a')).toBe('2,0 2x1');
      expect(rectOf('b')).toBe('0,0 2x1');
    });

    it('trades with one widget when the drop covers two', () => {
      const { drag, rectOf } = setupBoard(
        'swap',
        [
          { i: 'a', x: 0, y: 0, w: 6, h: 1 },
          { i: 'b', x: 2, y: 1, w: 2, h: 1 },
          { i: 'c', x: 4, y: 1, w: 2, h: 1 },
        ],
        { w: 6, h: 1 },
      );

      drag([0, 100]);

      // Covers `b` and `c` equally; the tie goes to `b`. Only one widget is ever
      // displaced, and `c` stays exactly where it was.
      expect(rectOf('a')).toBe('2,1 2x1');
      expect(rectOf('b')).toBe('0,0 2x1');
      expect(rectOf('c')).toBe('4,1 2x1');
    });

    // Sweeping a widget along a row crosses a band where the drop covers two
    // neighbours at once. Refusing those frames used to snap the placeholder back
    // to the origin, so the swap blinked away mid-drag and then reappeared against
    // the far neighbour. Every landing cell must resolve to *some* swap.
    it.each([1, 2, 3, 4])(
      'shows a swap at every step of a sweep (landing column %i)',
      (col) => {
        const { drag, rectOf } = setupBoard(
          'swap',
          [
            { i: 'a', x: 0, y: 0, w: 2, h: 1 },
            { i: 'b', x: 2, y: 0, w: 2, h: 1 },
            { i: 'c', x: 4, y: 0, w: 2, h: 1 },
          ],
          { w: 2, h: 1 },
        );

        drag([col * 100, 0]);

        // Landed somewhere other than where it started, and one neighbour took the
        // vacated slot - never the un-swapped original arrangement.
        expect(rectOf('a')).not.toBe('0,0 2x1');
        expect([rectOf('b'), rectOf('c')]).toContain('0,0 2x1');
      },
    );

    it('exchanges once across a sweep, not with every widget passed over', () => {
      const { drag, rectOf } = setupBoard(
        'swap',
        [
          { i: 'a', x: 0, y: 0, w: 2, h: 1 },
          { i: 'b', x: 2, y: 0, w: 2, h: 1 },
          { i: 'c', x: 4, y: 0, w: 2, h: 1 },
        ],
        { w: 2, h: 1 },
      );

      // Sweep past `b` and onto `c`, the way a real pointer emits many frames.
      drag([100, 0], [200, 0], [300, 0], [400, 0]);

      // Only the widget under the drop is displaced. Resolving each frame from the
      // previous one instead would exchange with `b` on the way and again with
      // `c`, leaving widgets shuffling under the pointer.
      expect(rectOf('a')).toBe('4,0 2x1');
      expect(rectOf('c')).toBe('0,0 2x1');
      expect(rectOf('b')).toBe('2,0 2x1');
    });

    it('retraces exactly when the drag comes back', () => {
      const { drag, rectOf } = setupBoard(
        'swap',
        [
          { i: 'a', x: 0, y: 0, w: 2, h: 1 },
          { i: 'b', x: 2, y: 0, w: 2, h: 1 },
          { i: 'c', x: 4, y: 0, w: 2, h: 1 },
        ],
        { w: 2, h: 1 },
      );

      drag([100, 0], [300, 0], [400, 0], [200, 0], [0, 0]);

      // Back where it started, with nothing displaced and nothing resized: a frame
      // is a pure function of the landing cell, so a gesture leaves no residue.
      expect(rectOf('a')).toBe('0,0 2x1');
      expect(rectOf('b')).toBe('2,0 2x1');
      expect(rectOf('c')).toBe('4,0 2x1');
    });

    it('leaves a widget that already fits untouched', () => {
      const { drag, rectOf } = setupBoard('downscale', gapLayout, {
        w: 4,
        h: 1,
      });

      drag([0, 200]);

      expect(rectOf('a')).toBe('0,2 4x1');
    });

    describe('cross-board swap', () => {
      function setupCrossBoardSwap(
        incoming: LayoutItem,
        targetLayout: LayoutItem[],
      ) {
        const onSourceLayoutChange = vi.fn();
        const onTargetLayoutChange = vi.fn();
        const onWidgetTransfer = vi.fn();
        const onDragStop = vi.fn();

        render(
          <Board.Provider onWidgetTransfer={onWidgetTransfer}>
            <Board
              id="source"
              width={600}
              cols={6}
              rowHeight={100}
              margin={[0, 0]}
              containerPadding={[0, 0]}
              compact="free"
              collisionMode="swap"
              defaultLayout={[incoming]}
              onLayoutChange={onSourceLayoutChange}
              onDragStop={onDragStop}
            >
              <Board.Widget id={incoming.i} qa="Incoming">
                Incoming
              </Board.Widget>
            </Board>
            <Board
              id="target"
              width={600}
              cols={6}
              rowHeight={100}
              margin={[0, 0]}
              containerPadding={[0, 0]}
              compact="free"
              collisionMode="swap"
              defaultLayout={targetLayout}
              onLayoutChange={onTargetLayoutChange}
            >
              {targetLayout.map((it) => (
                <Board.Widget key={it.i} id={it.i} qa={`Target-${it.i}`}>
                  {it.i}
                </Board.Widget>
              ))}
            </Board>
          </Board.Provider>,
        );

        const widget = screen.getByTestId('Incoming');
        const sourceContent = widget.parentElement as HTMLElement;
        const firstTarget = targetLayout[0];
        const targetContent = firstTarget
          ? (screen.getByTestId(`Target-${firstTarget.i}`)
              .parentElement as HTMLElement)
          : (document.querySelector(
              '[data-board-id="target"] [data-qa="BoardContent"]',
            ) as HTMLElement);

        sourceContent.getBoundingClientRect = () => mockRect(0, 0, 600, 600);
        targetContent.getBoundingClientRect = () => mockRect(600, 0, 600, 600);
        widget.getBoundingClientRect = () =>
          mockRect(0, 0, incoming.w * 100, incoming.h * 100);

        const start = () =>
          fireEvent(widget, pointerEvent('pointerdown', 0, 0));
        const moveTo = (x: number, y: number) =>
          fireEvent(
            window,
            pointerEvent('pointermove', 600 + x * 100, y * 100),
          );
        const endAt = (x: number, y: number) =>
          fireEvent(window, pointerEvent('pointerup', 600 + x * 100, y * 100));
        const dragTo = (x: number, y: number) => {
          start();
          moveTo(x, y);
          endAt(x, y);
        };

        return {
          start,
          moveTo,
          endAt,
          dragTo,
          onSourceLayoutChange,
          onTargetLayoutChange,
          onWidgetTransfer,
          onDragStop,
        };
      }

      it('inserts at full size when the requested target space is empty', () => {
        const targetLayout = [{ i: 'b', x: 4, y: 0, w: 2, h: 1 }];
        const { dragTo, onTargetLayoutChange, onWidgetTransfer } =
          setupCrossBoardSwap({ i: 'a', x: 0, y: 0, w: 2, h: 1 }, targetLayout);

        dragTo(0, 0);

        const committed = onTargetLayoutChange.mock
          .calls[0]![0] as LayoutItem[];
        expect(committed).toEqual([
          expect.objectContaining(targetLayout[0]),
          expect.objectContaining({ i: 'a', x: 0, y: 0, w: 2, h: 1 }),
        ]);
        expect(onWidgetTransfer).toHaveBeenCalledWith(
          expect.objectContaining({
            fromBoardId: 'source',
            toBoardId: 'target',
            item: expect.objectContaining({ x: 0, y: 0, w: 2, h: 1 }),
          }),
        );
      });

      it('downscales at an empty anchor without moving target widgets', () => {
        const targetLayout = [{ i: 'b', x: 3, y: 0, w: 3, h: 1 }];
        const { dragTo, onTargetLayoutChange, onWidgetTransfer } =
          setupCrossBoardSwap({ i: 'a', x: 0, y: 0, w: 4, h: 1 }, targetLayout);

        dragTo(0, 0);

        const committed = onTargetLayoutChange.mock
          .calls[0]![0] as LayoutItem[];
        expect(committed.find((it) => it.i === 'a')).toEqual(
          expect.objectContaining({ x: 0, y: 0, w: 3, h: 1 }),
        );
        expect(committed.find((it) => it.i === 'b')).toEqual(
          expect.objectContaining(targetLayout[0]),
        );
        expect(onWidgetTransfer.mock.calls[0]![0].item).toEqual(
          expect.objectContaining({ x: 0, y: 0, w: 3, h: 1 }),
        );
      });

      it('cancels the transfer when the anchor cell is occupied', () => {
        const {
          dragTo,
          onSourceLayoutChange,
          onTargetLayoutChange,
          onWidgetTransfer,
          onDragStop,
        } = setupCrossBoardSwap({ i: 'a', x: 0, y: 0, w: 2, h: 1 }, [
          { i: 'b', x: 0, y: 0, w: 2, h: 1 },
        ]);

        dragTo(0, 0);

        expect(onSourceLayoutChange).not.toHaveBeenCalled();
        expect(onTargetLayoutChange).not.toHaveBeenCalled();
        expect(onWidgetTransfer).not.toHaveBeenCalled();
        expect(onDragStop).toHaveBeenCalledWith(
          expect.objectContaining({
            item: expect.objectContaining({ i: 'a', x: 0, y: 0 }),
            layout: [expect.objectContaining({ i: 'a', x: 0, y: 0 })],
          }),
        );
      });

      it('cancels when the available space is below the minimum size', () => {
        const {
          dragTo,
          onSourceLayoutChange,
          onTargetLayoutChange,
          onWidgetTransfer,
        } = setupCrossBoardSwap({ i: 'a', x: 0, y: 0, w: 4, h: 1, minW: 4 }, [
          { i: 'b', x: 3, y: 0, w: 3, h: 1 },
        ]);

        dragTo(0, 0);

        expect(onSourceLayoutChange).not.toHaveBeenCalled();
        expect(onTargetLayoutChange).not.toHaveBeenCalled();
        expect(onWidgetTransfer).not.toHaveBeenCalled();
      });

      it('cancels instead of committing the last valid preview', () => {
        const {
          start,
          moveTo,
          endAt,
          onSourceLayoutChange,
          onTargetLayoutChange,
          onWidgetTransfer,
        } = setupCrossBoardSwap({ i: 'a', x: 0, y: 0, w: 2, h: 1 }, [
          { i: 'b', x: 2, y: 0, w: 2, h: 1 },
        ]);

        start();
        moveTo(0, 0);
        expect(screen.getAllByTestId('BoardPlaceholder')).toHaveLength(1);
        moveTo(2, 0);
        expect(
          screen.queryByTestId('BoardPlaceholder'),
        ).not.toBeInTheDocument();
        endAt(2, 0);

        expect(onSourceLayoutChange).not.toHaveBeenCalled();
        expect(onTargetLayoutChange).not.toHaveBeenCalled();
        expect(onWidgetTransfer).not.toHaveBeenCalled();
      });

      it('uses the same insertion rule when dragging from a nested board to its parent', () => {
        const onParentLayoutChange = vi.fn();
        const onChildLayoutChange = vi.fn();
        const onWidgetTransfer = vi.fn();

        render(
          <Board.Provider onWidgetTransfer={onWidgetTransfer}>
            <Board
              id="parent"
              width={600}
              cols={6}
              rowHeight={100}
              margin={[0, 0]}
              containerPadding={[0, 0]}
              compact="free"
              collisionMode="swap"
              defaultLayout={[{ i: 'container', x: 0, y: 0, w: 3, h: 2 }]}
              onLayoutChange={onParentLayoutChange}
            >
              <Board.Widget id="container" qa="Container">
                <Board
                  id="child"
                  width={300}
                  cols={3}
                  rowHeight={100}
                  margin={[0, 0]}
                  containerPadding={[0, 0]}
                  compact="free"
                  collisionMode="swap"
                  defaultLayout={[{ i: 'a', x: 0, y: 0, w: 1, h: 1 }]}
                  onLayoutChange={onChildLayoutChange}
                >
                  <Board.Widget id="a" qa="NestedIncoming">
                    A
                  </Board.Widget>
                </Board>
              </Board.Widget>
            </Board>
          </Board.Provider>,
        );

        const widget = screen.getByTestId('NestedIncoming');
        const childContent = widget.parentElement as HTMLElement;
        const container = screen.getByTestId('Container');
        const parentContent = container.parentElement as HTMLElement;
        childContent.getBoundingClientRect = () => mockRect(0, 0, 300, 200);
        parentContent.getBoundingClientRect = () => mockRect(0, 0, 600, 400);
        container.getBoundingClientRect = () => mockRect(0, 0, 300, 200);
        widget.getBoundingClientRect = () => mockRect(0, 0, 100, 100);

        fireEvent(widget, pointerEvent('pointerdown', 0, 0));
        fireEvent(window, pointerEvent('pointermove', 400, 0));
        fireEvent(window, pointerEvent('pointerup', 400, 0));

        const committed = onParentLayoutChange.mock
          .calls[0]![0] as LayoutItem[];
        expect(committed.find((it) => it.i === 'container')).toEqual(
          expect.objectContaining({ x: 0, y: 0, w: 3, h: 2 }),
        );
        expect(committed.find((it) => it.i === 'a')).toEqual(
          expect.objectContaining({ x: 4, y: 0, w: 1, h: 1 }),
        );
        // The child board empties, and says why: the widget left for another
        // board rather than the user rearranging this one.
        expect(onChildLayoutChange).toHaveBeenCalledWith([], {
          reason: 'transfer',
        });
        expect(onWidgetTransfer).toHaveBeenCalledWith(
          expect.objectContaining({
            widgetId: 'a',
            fromBoardId: 'child',
            toBoardId: 'parent',
          }),
        );
      });
    });

    describe('keyboard', () => {
      function setupKeyboardBoard(
        collisionMode: 'downscale' | 'swap',
        layout: LayoutItem[],
      ) {
        const onLayoutChange = vi.fn();
        render(
          <Board
            width={600}
            cols={6}
            rowHeight={100}
            margin={[0, 0]}
            containerPadding={[0, 0]}
            compact="free"
            collisionMode={collisionMode}
            defaultLayout={layout}
            onLayoutChange={onLayoutChange}
          >
            {layout.map((it) => (
              <Board.Widget key={it.i} id={it.i} qa={`Widget-${it.i}`}>
                {it.i}
              </Board.Widget>
            ))}
          </Board>,
        );

        const widget = screen.getByTestId('Widget-a');
        widget.focus();

        return {
          press: (key: string) => fireEvent.keyDown(widget, { key }),
          rectOf: (id: string) => {
            const committed = onLayoutChange.mock.calls.at(-1)?.[0] as
              | LayoutItem[]
              | undefined;
            const it = (committed ?? layout).find((l) => l.i === id)!;
            return `${it.x},${it.y} ${it.w}x${it.h}`;
          },
        };
      }

      it('never resizes a widget to make an arrow key fit', () => {
        const { press, rectOf } = setupKeyboardBoard('downscale', [
          { i: 'a', x: 0, y: 0, w: 2, h: 1 },
          { i: 'b', x: 2, y: 0, w: 1, h: 1 },
        ]);

        press('ArrowRight');

        // Each press is its own gesture, so a press that shrank the widget would
        // become the next press's starting size and ratchet it down for good.
        expect(rectOf('a').endsWith('2x1')).toBe(true);
        expect(rectOf('b')).toBe('2,0 1x1');
      });

      it('still exchanges two widgets that fit each other outright', () => {
        const { press, rectOf } = setupKeyboardBoard('swap', [
          { i: 'a', x: 0, y: 0, w: 2, h: 1 },
          { i: 'b', x: 2, y: 0, w: 2, h: 1 },
        ]);

        press('ArrowRight');

        // No resize needed here, so the keyboard reaches the same arrangement a
        // drop would.
        expect(rectOf('a')).toBe('2,0 2x1');
        expect(rectOf('b')).toBe('0,0 2x1');
      });
    });
  });

  describe('drag grid lines', () => {
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

    // Two 600px boards side by side under one provider, so a single drag can be
    // over one board while the other only shares the provider.
    function setupBoards(showGridLines: 'drag' | 'any-drag') {
      render(
        <Board.Provider>
          <Board
            id="source"
            width={600}
            cols={6}
            rowHeight={100}
            margin={[0, 0]}
            containerPadding={[0, 0]}
            showGridLines={showGridLines}
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
            showGridLines={showGridLines}
            defaultLayout={[{ i: 'z', x: 5, y: 0, w: 1, h: 1 }]}
          >
            <Board.Widget id="z" qa="Target">
              Z
            </Board.Widget>
          </Board>
        </Board.Provider>,
      );

      const widget = screen.getByTestId('Wide');
      const sourceContent = widget.parentElement as HTMLElement;
      const targetContent = screen.getByTestId('Target')
        .parentElement as HTMLElement;
      sourceContent.getBoundingClientRect = () => mockRect(0, 0, 600, 400);
      targetContent.getBoundingClientRect = () => mockRect(600, 0, 600, 400);
      widget.getBoundingClientRect = () => mockRect(0, 0, 400, 100);

      const hasGrid = (boardId: string) => {
        const board = document.querySelector(
          `[data-board-id="${boardId}"]`,
        ) as HTMLElement;
        return !!board.querySelector('[data-qa="BoardGridOverlay"]');
      };

      return { widget, hasGrid };
    }

    it('shows no grid until something is dragged', () => {
      const { hasGrid } = setupBoards('drag');

      expect(hasGrid('source')).toBe(false);
      expect(hasGrid('target')).toBe(false);
    });

    it('lights up only the board owning the drag', () => {
      const { widget, hasGrid } = setupBoards('drag');

      // Centre stays at x=500, inside the source board (x:[0,600]).
      fireEvent(widget, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 300, 0));

      expect(hasGrid('source')).toBe(true);
      // The whole point of scoping: a board the widget cannot land in stays quiet
      // instead of lighting up because *something* somewhere is being dragged.
      expect(hasGrid('target')).toBe(false);

      fireEvent(window, pointerEvent('pointerup', 300, 0));
    });

    it('lights up a board the widget is dragged into', () => {
      const { widget, hasGrid } = setupBoards('drag');

      // Centre reaches x=700, inside the target board (x:[600,1200]).
      fireEvent(widget, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 500, 0));

      expect(hasGrid('target')).toBe(true);
      // The source keeps its grid: releasing there is still a valid drop.
      expect(hasGrid('source')).toBe(true);

      fireEvent(window, pointerEvent('pointerup', 500, 0));
    });

    it('lights up every board under the provider with any-drag', () => {
      const { widget, hasGrid } = setupBoards('any-drag');

      fireEvent(widget, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 300, 0));

      // Opt-in noise: every board advertises itself as somewhere to land.
      expect(hasGrid('source')).toBe(true);
      expect(hasGrid('target')).toBe(true);

      fireEvent(window, pointerEvent('pointerup', 300, 0));
    });

    it('clears the grid again once the drag ends', () => {
      const { widget, hasGrid } = setupBoards('any-drag');

      fireEvent(widget, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 300, 0));
      fireEvent(window, pointerEvent('pointerup', 300, 0));

      expect(hasGrid('source')).toBe(false);
      expect(hasGrid('target')).toBe(false);
    });

    it('inherits the drag scope into a nested board', () => {
      render(
        <Board
          id="root"
          width={600}
          cols={6}
          rowHeight={100}
          margin={[0, 0]}
          containerPadding={[0, 0]}
          showGridLines="any-drag"
          defaultLayout={[
            { i: 'container', x: 0, y: 0, w: 6, h: 2 },
            { i: 'other', x: 0, y: 2, w: 2, h: 1 },
          ]}
        >
          <Board.Widget id="container">
            <Board
              id="nested"
              width={600}
              cols={6}
              rowHeight={100}
              margin={[0, 0]}
              containerPadding={[0, 0]}
              defaultLayout={[{ i: 'n', x: 0, y: 0, w: 1, h: 1 }]}
            >
              <Board.Widget id="n">N</Board.Widget>
            </Board>
          </Board.Widget>
          <Board.Widget id="other" qa="Other">
            O
          </Board.Widget>
        </Board>,
      );

      const other = screen.getByTestId('Other');
      fireEvent(other, pointerEvent('pointerdown', 0, 200));
      fireEvent(window, pointerEvent('pointermove', 100, 200));

      // The nested board sets no `showGridLines` of its own, so it inherits the
      // root's scope - `any-drag`, not a downgrade to the drag-owner default.
      const nested = document.querySelector(
        '[data-board-id="nested"]',
      ) as HTMLElement;
      expect(
        nested.querySelector('[data-qa="BoardGridOverlay"]'),
      ).toBeInTheDocument();

      fireEvent(window, pointerEvent('pointerup', 100, 200));
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

    // Regression: on a selectable board an `input` inside a widget could not be
    // focused or typed into unless `dragCancel` was also configured, because
    // `useMove`'s pointer-down calls `preventDefault()` and only `dragCancel`
    // gated it. `selectionCancel` already declares which descendants are
    // interactive, so it gates the drag too.
    it('keeps native focus on an interactive descendant without dragCancel', () => {
      const onDragStart = vi.fn();
      render(
        <Board
          width={600}
          cols={6}
          selectionMode="multiple"
          defaultLayout={[{ i: 'a', x: 0, y: 0, w: 4, h: 2 }]}
          onDragStart={onDragStart}
        >
          <Board.Widget id="a" qa="A">
            <input data-qa="Field" />
          </Board.Widget>
        </Board>,
      );

      const field = screen.getByTestId('Field');
      const event = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        button: 0,
        pointerId: 1,
        pointerType: 'mouse',
      });
      fireEvent(field, event);

      // `preventDefault()` here is what cancels the browser's focus-on-press.
      expect(event.defaultPrevented).toBe(false);
      expect(onDragStart).not.toHaveBeenCalled();
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

      // Regression (CUB-3827): the reset used to ride on the host's bubble-phase
      // `onPointerDown`, so a control that never let the press through kept the
      // selection standing — which is why a widget's gear button dropped it and
      // the chart's own toolbar button did not. Three ways a press can miss the
      // host, all of which must still drop the selection.
      describe('however the press reaches the widget', () => {
        const twoWidgetLayout = [
          { i: 'a', x: 0, y: 0, w: 2, h: 1 },
          { i: 'b', x: 2, y: 0, w: 2, h: 1 },
        ];

        /** Selects `b`, then presses `content`'s control inside widget `a`. */
        const pressInsideA = async (content: ReactNode) => {
          const onSelectionChange = vi.fn();

          render(
            <Board
              width={600}
              cols={6}
              rowHeight={100}
              margin={[0, 0]}
              containerPadding={[0, 0]}
              selectionMode="multiple"
              defaultLayout={twoWidgetLayout}
              onSelectionChange={onSelectionChange}
            >
              <Board.Widget id="a" qa="A">
                {content}
              </Board.Widget>
              <Board.Widget id="b" qa="B">
                B
              </Board.Widget>
            </Board>,
          );

          await userEvent.click(screen.getByTestId('B'));
          expect(onSelectionChange).toHaveBeenLastCalledWith(['b']);
          onSelectionChange.mockClear();

          fireEvent.pointerDown(screen.getByRole('button', { name: 'Ctl' }), {
            button: 0,
            pointerId: 1,
          });

          return onSelectionChange;
        };

        // What React Aria's `usePress` does by default.
        it('drops it when the control stops the React press', async () => {
          const onSelectionChange = await pressInsideA(
            <button type="button" onPointerDown={(e) => e.stopPropagation()}>
              Ctl
            </button>,
          );

          expect(onSelectionChange).toHaveBeenCalledWith([]);
        });

        // What a charting or mapping library does with its own listeners: the
        // native event never reaches React, so no React handler on the host runs.
        it('drops it when the control stops the native press', async () => {
          function NativeStopButton() {
            const ref = useRef<HTMLButtonElement>(null);

            useEffect(() => {
              const node = ref.current;
              if (!node) return;

              const stop = (event: Event) => event.stopPropagation();

              node.addEventListener('pointerdown', stop);

              return () => node.removeEventListener('pointerdown', stop);
            }, []);

            return (
              <button ref={ref} type="button">
                Ctl
              </button>
            );
          }

          const onSelectionChange = await pressInsideA(<NativeStopButton />);

          expect(onSelectionChange).toHaveBeenCalledWith([]);
        });

        // A menu opened from a widget renders outside the host's DOM subtree,
        // but still inside its React tree — so the React capture handler is the
        // only one that can see this press.
        it('drops it when a portaled control stops the press', async () => {
          const onSelectionChange = await pressInsideA(
            createPortal(
              <button type="button" onPointerDown={(e) => e.stopPropagation()}>
                Ctl
              </button>,
              document.body,
            ) as ReactNode,
          );

          expect(onSelectionChange).toHaveBeenCalledWith([]);
        });
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

      it('parks focus on the board without making it a tab stop', async () => {
        const onWidgetsDelete = vi.fn();
        const { widget } = renderSelectableBoard({ onWidgetsDelete });

        await userEvent.click(widget('B'));
        await userEvent.keyboard('{Delete}');

        // Focus has to land somewhere the board's own Escape/Delete handler can
        // still see, since the widget that had it is about to unmount...
        const board = screen.getByTestId('Board');
        expect(board).toHaveFocus();
        // ...but the board is never reachable by Tab, so this is a parking spot
        // rather than a control, and it draws no focus ring.
        expect(board).toHaveAttribute('tabindex', '-1');
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

    // `extraRows` keeps a band of empty board below the content, so a full grid
    // still has somewhere to start a lasso. Only the sizing arithmetic belongs
    // here. Every marquee gesture — which widgets a band covers, the movement
    // threshold, the modifiers — is decided by measured rectangles, and lives
    // in `Board.browser.test.tsx` rather than being asserted against a mock.
    describe('extraRows sizing', () => {
      // Two content rows at 100px, no margins or padding.
      const contentHeight = 200;

      const boardHeight = (props: Record<string, unknown>) => {
        renderSelectableBoard(props);

        return screen.getByTestId('Board').style.minHeight;
      };

      it('clamps the band to maxRows', () => {
        expect(boardHeight({ extraRows: 5, maxRows: 3 })).toBe('300px');
      });

      it('paints grid cells over the band, so it reads as board', () => {
        renderSelectableBoard({ extraRows: 3, showGridLines: true });

        expect(screen.getByTestId('BoardGridOverlay').style.height).toBe(
          `${contentHeight + 300}px`,
        );
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

    // Pointer group-drags live in `Board.browser.test.tsx`: the arrangement a
    // drag produces is decided by measured geometry, and mocking every rect to
    // assert it in jsdom only proves the mocks agree with each other. The
    // keyboard path has no geometry in it at all, so it belongs here.
    const stackLayout = () => [
      { i: 'a', x: 0, y: 0, w: 12, h: 1 },
      { i: 'b', x: 0, y: 1, w: 12, h: 1 },
      { i: 'c', x: 0, y: 2, w: 12, h: 1 },
      { i: 'd', x: 0, y: 3, w: 12, h: 1 },
    ];

    it('moves a group up with the arrow keys without splitting it', () => {
      const onLayoutChange = vi.fn();
      setupGroupBoard({
        compact: 'vertical',
        defaultSelectedKeys: ['c', 'd'],
        defaultLayout: stackLayout(),
        onLayoutChange,
      });

      const grabbed = screen.getByTestId('C');
      grabbed.focus();
      for (let step = 0; step < 2; step++) {
        fireEvent.keyDown(grabbed, { key: 'ArrowUp' });
        fireEvent.keyUp(grabbed, { key: 'ArrowUp' });
      }

      const committed = onLayoutChange.mock.lastCall![0] as LayoutItem[];
      const order = [...committed].sort((x, y) => x.y - y.y).map((it) => it.i);
      expect(Math.abs(order.indexOf('c') - order.indexOf('d'))).toBe(1);
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

  describe('corner chrome', () => {
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

    it('renders chrome outside the widget, so its own clip cannot crop it', () => {
      render(
        <Board width={1200} defaultLayout={baseLayout}>
          <Board.Widget
            id="a"
            qa="WidgetA"
            cornerChrome={<button type="button">Settings</button>}
          >
            A
          </Board.Widget>
        </Board>,
      );

      const chrome = screen.getByRole('button', { name: 'Settings' });
      expect(chrome).toBeInTheDocument();
      // The widget host clips its content (`overflow: hidden`), which is the
      // whole reason this slot exists — so the chrome must NOT be inside it.
      expect(screen.getByTestId('WidgetA').contains(chrome)).toBe(false);
    });

    it('keeps chrome reachable by assistive tech', () => {
      // The grip layer is `aria-hidden` for the grips' sake. Chrome is real UI,
      // so a layer holding chrome must not inherit that.
      render(
        <Board width={1200} defaultLayout={baseLayout}>
          <Board.Widget
            id="a"
            cornerChrome={<button type="button">Settings</button>}
          >
            A
          </Board.Widget>
        </Board>,
      );

      expect(
        screen
          .getByRole('button', { name: 'Settings' })
          .closest('[aria-hidden="true"]'),
      ).toBeNull();
    });

    it('does not start a drag when the chrome is pressed', () => {
      const onLayoutChange = vi.fn();
      render(
        <Board
          width={1200}
          defaultLayout={baseLayout}
          onLayoutChange={onLayoutChange}
        >
          <Board.Widget
            id="a"
            cornerChrome={<button type="button">Settings</button>}
          >
            A
          </Board.Widget>
        </Board>,
      );

      const chrome = screen.getByRole('button', { name: 'Settings' });
      fireEvent(chrome, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 200, 200));
      fireEvent(window, pointerEvent('pointerup', 200, 200));

      // Chrome lives outside the widget host, so `useMove` is not even attached
      // to it — no `dragCancel` entry needed to protect it.
      expect(onLayoutChange).not.toHaveBeenCalled();
    });
  });

  describe('custom widget modifiers', () => {
    it('resolves a style map against an app-defined modifier', () => {
      render(
        <Board width={1200} defaultLayout={baseLayout}>
          <Board.Widget
            id="a"
            qa="WidgetA"
            mods={{ editing: true }}
            // Deliberately no `''` entry: that is what keeps this in tasty's
            // EXTEND mode, so the board's own `selected` / `drag` treatments
            // survive. The rule cannot see that a widget `styles` prop is always
            // merged onto a parent map.
            // oxlint-disable-next-line tasty/require-default-state
            styles={{ shadow: { editing: '0 0 0 1bw #primary' } }}
          >
            A
          </Board.Widget>
        </Board>,
      );

      expect(screen.getByTestId('WidgetA')).toHaveAttribute('data-editing');
    });

    it('accepts board-wide modifiers via widgetProps, letting a widget override', () => {
      render(
        <Board
          width={1200}
          defaultLayout={baseLayout}
          widgetProps={{ mods: { compact: true } }}
        >
          <Board.Widget id="a" qa="WidgetA">
            A
          </Board.Widget>
          <Board.Widget id="b" qa="WidgetB" mods={{ compact: false }}>
            B
          </Board.Widget>
        </Board>,
      );

      // The board-level default reaches a widget that sets nothing...
      expect(screen.getByTestId('WidgetA')).toHaveAttribute('data-compact');
      // ...and a widget's own value wins over it.
      expect(screen.getByTestId('WidgetB')).not.toHaveAttribute('data-compact');
    });

    it('accepts corner chrome via widgetProps', () => {
      render(
        <Board
          width={1200}
          defaultLayout={baseLayout}
          widgetProps={{
            cornerChrome: <button type="button">Shared</button>,
            cornerChromePlacement: 'sw',
          }}
        >
          <Board.Widget id="a">A</Board.Widget>
        </Board>,
      );

      // Typed as a widget default, so it has to behave like one — being silently
      // dropped is worse than not accepting it at all.
      expect(
        screen.getAllByRole('button', { name: 'Shared' }),
      ).not.toHaveLength(0);
    });

    it('keeps app modifiers on the clone that floats during a pointer drag', () => {
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

      render(
        <Board width={1200} defaultLayout={baseLayout}>
          <Board.Widget id="a" qa="WidgetA" mods={{ editing: true }}>
            A
          </Board.Widget>
        </Board>,
      );

      fireEvent(
        screen.getByTestId('WidgetA'),
        pointerEvent('pointerdown', 0, 0),
      );
      fireEvent(window, pointerEvent('pointermove', 120, 0));

      // While a pointer drag is in flight the clone IS the widget — the in-grid
      // host is hidden — so a custom state must not blink off for the gesture.
      const floating = document.querySelector('[data-floating]');
      expect(floating).not.toBeNull();
      expect(floating).toHaveAttribute('data-editing');

      fireEvent(window, pointerEvent('pointerup', 120, 0));
    });

    it('never lets an app modifier shadow one of the board own states', () => {
      render(
        <Board width={1200} defaultLayout={baseLayout} selectionMode="single">
          <Board.Widget id="a" qa="WidgetA" mods={{ selected: true }}>
            A
          </Board.Widget>
        </Board>,
      );

      // Nothing is selected, so the board's own `selected: false` has to win over
      // the app's claim — the selection styling and the a11y wiring both read it.
      expect(screen.getByTestId('WidgetA')).not.toHaveAttribute(
        'data-selected',
      );
    });
  });

  describe('layout change reason', () => {
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

    it('reports a resize as a gesture, not a normalization', () => {
      const onLayoutChange = vi.fn();
      render(
        <Board
          width={1200}
          rowHeight={100}
          margin={[0, 0]}
          containerPadding={[0, 0]}
          defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}
          onLayoutChange={onLayoutChange}
        >
          <Board.Widget id="a" qa="WidgetA">
            A
          </Board.Widget>
        </Board>,
      );

      const handle = document.querySelector(
        '[data-qa="BoardResizeHandle"]',
      ) as HTMLElement;
      fireEvent(handle, pointerEvent('pointerdown', 0, 0));
      fireEvent(window, pointerEvent('pointermove', 200, 0));
      fireEvent(window, pointerEvent('pointerup', 200, 0));

      expect(onLayoutChange).toHaveBeenCalled();
      expect(onLayoutChange.mock.lastCall![1]).toEqual({ reason: 'resize' });
    });
  });
});
