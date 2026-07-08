import { fireEvent, render, screen } from '../../../test/render';

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

  it('positions widgets using CSS transforms', () => {
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
    expect(widget.style.transform).toBe('translate(10px, 10px)');
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

  it('renders grips only for corner handles, not edges', () => {
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

    // 4 handles total, but only the two corners (se, nw) get a visible grip.
    expect(screen.getAllByTestId('BoardResizeHandle').length).toBe(4);
    expect(screen.getAllByTestId('BoardResizeGrip').length).toBe(2);
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
    expect(screen.getByTestId('WidgetA').style.transform).toBe(
      'translate(10px, 10px)',
    );
    const widgetB = screen.getByTestId('WidgetB');
    expect(widgetB.style.transform).not.toBe('translate(10px, 10px)');
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

  it('shrinks aligned row height to fit a constrained container', () => {
    // jsdom reports 0 for offset dimensions; mock them so a nested board can
    // measure the height it is given (and derive a column count from its width).
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
      // The aligned board fits its rows into the 120px it measures, so the same
      // widget renders shorter than on a board keeping the full parent row
      // height.
      expect(parseInt(aligned.style.height, 10)).toBeLessThan(
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
});
