import { userEvent } from 'vitest/browser';

import {
  act,
  userEvent as pointerUserEvent,
  renderWithRoot,
  screen,
  waitFor,
} from '../../../test';

import { Layout } from './index';

// vitest/browser's keyboard is not wrapped in act, and each key renders.
function press(keys: string) {
  return act(async () => {
    await userEvent.keyboard(keys);
  });
}

// The flex container of the panes under test.
function setColumnHeight(height: number) {
  return act(async () => {
    (
      screen.getByTestId(/^(beside|results)$/).parentElement as HTMLElement
    ).style.height = `${height}px`;
  });
}

function ShortColumn({
  columnHeight,
  minSize,
  flexShrink,
  isResizable,
  withHiddenPane,
  onSizeChange,
}: {
  columnHeight: number;
  minSize?: number;
  flexShrink?: number;
  isResizable?: boolean;
  withHiddenPane?: boolean;
  onSizeChange?: (size: number) => void;
}) {
  return (
    <div
      style={{ height: columnHeight, display: 'flex', flexDirection: 'column' }}
    >
      <Layout.Pane
        qa="short-pane"
        resizeEdge="bottom"
        defaultSize={250}
        minSize={minSize}
        flexShrink={flexShrink}
        isResizable={isResizable}
        onSizeChange={onSizeChange}
      >
        Pane
      </Layout.Pane>
      {withHiddenPane && (
        <Layout.Pane
          resizeEdge="bottom"
          defaultSize={250}
          flexShrink={1}
          styles={{ hide: true }}
        />
      )}
      <div data-qa="beside" style={{ flex: '1 1 0', minHeight: 180 }} />
    </div>
  );
}

// Flex sizing needs real layout, which jsdom does not do.
describe('Layout.Pane in a short flex container', () => {
  it('holds its size by default', () => {
    renderWithRoot(<ShortColumn columnHeight={300} minSize={80} />);

    expect(screen.getByTestId('short-pane').offsetHeight).toBe(250);
  });

  it('gives way with flexShrink so the content beside it keeps its room', () => {
    renderWithRoot(
      <ShortColumn columnHeight={300} minSize={80} flexShrink={1} />,
    );

    expect(screen.getByTestId('short-pane').offsetHeight).toBe(120);
    expect(screen.getByTestId('beside').offsetHeight).toBe(180);
  });

  it('shrinks no further than its minSize', () => {
    renderWithRoot(
      <ShortColumn columnHeight={200} minSize={80} flexShrink={1} />,
    );

    expect(screen.getByTestId('short-pane').offsetHeight).toBe(80);
  });

  it('does not take its minimum from an enclosing pane', () => {
    renderWithRoot(
      <Layout.Pane resizeEdge="bottom" defaultSize={400} minSize={150}>
        <ShortColumn columnHeight={200} flexShrink={1} />
      </Layout.Pane>,
    );

    expect(screen.getByTestId('short-pane').offsetHeight).toBeLessThan(150);
  });

  it('resizes from the size it is drawn at', async () => {
    renderWithRoot(
      <ShortColumn
        columnHeight={300}
        minSize={80}
        flexShrink={1}
        isResizable
      />,
    );
    const pane = screen.getByTestId('short-pane');

    expect(pane.offsetHeight).toBe(120);

    await act(async () =>
      screen.getByRole('separator', { name: 'Resize pane bottom' }).focus(),
    );
    await press('{ArrowUp}');

    await waitFor(() => expect(pane.offsetHeight).toBe(110));
  });

  it('follows the pointer back from past the room left beside it', async () => {
    renderWithRoot(
      <ShortColumn
        columnHeight={300}
        minSize={80}
        flexShrink={1}
        isResizable
      />,
    );
    const pane = screen.getByTestId('short-pane');
    const drag = await pressGrip(
      screen.getByRole('separator', { name: 'Resize pane bottom' }),
    );

    await drag.moveTo(50);
    await drag.moveTo(20);
    await waitFor(() => expect(pane.offsetHeight).toBe(120));

    await drag.moveTo(-10);
    await waitFor(() => expect(pane.offsetHeight).toBe(110));

    await drag.release(-10);
    expect(screen.getByTestId('beside').offsetHeight).toBe(190);
  });

  it.each([
    ['', false],
    [', also beside a hidden pane', true],
  ])(
    'takes the size it is dragged to once it has the room%s',
    async (_, withHiddenPane) => {
      renderWithRoot(
        <ShortColumn
          columnHeight={300}
          minSize={80}
          flexShrink={1}
          withHiddenPane={withHiddenPane}
          isResizable
        />,
      );
      const pane = screen.getByTestId('short-pane');
      const drag = await pressGrip(
        screen.getByRole('separator', { name: 'Resize pane bottom' }),
      );

      await drag.moveTo(50);
      await drag.release(50);
      expect(pane.offsetHeight).toBe(120);

      await setColumnHeight(500);
      await waitFor(() => expect(pane.offsetHeight).toBe(170), {
        timeout: 2000,
      });
    },
  );

  it('adds an arrow key pressed mid-drag to the drag', async () => {
    const onSizeChange = vi.fn();

    renderWithRoot(
      <ShortColumn
        isResizable
        columnHeight={600}
        flexShrink={1}
        onSizeChange={onSizeChange}
      />,
    );
    const grip = screen.getByRole('separator', { name: 'Resize pane bottom' });

    await act(async () => grip.focus());

    const drag = await pressGrip(grip);

    await drag.moveTo(20);
    await press('{ArrowDown}');
    await drag.moveTo(40);
    await drag.release(40);

    expect(onSizeChange.mock.calls).toEqual([[280], [300]]);
  });

  it('grows past a short container when it holds its size', async () => {
    renderWithRoot(<ShortColumn isResizable columnHeight={300} />);
    const pane = screen.getByTestId('short-pane');
    const grip = screen.getByRole('separator', { name: 'Resize pane bottom' });

    await act(async () => grip.focus());
    await press('{ArrowDown}');
    await waitFor(() => expect(pane.offsetHeight).toBe(260));

    const drag = await pressGrip(grip);

    await drag.moveTo(30);
    await drag.release(30);
    await waitFor(() => expect(pane.offsetHeight).toBe(290));
  });
});

// Panes that all give way: 300px each above 200px of results, in a column
// 200px per item tall, so each pane is drawn at 200px.
function ShrunkPanes({
  count = 2,
  height = 200 * (count + 1),
  defaultSize = 300,
  maxSize,
  onSizeChange,
}: {
  count?: number;
  height?: number;
  defaultSize?: number;
  maxSize?: number;
  onSizeChange?: (qa: string, size: number) => void;
}) {
  return (
    <div style={{ height, display: 'flex', flexDirection: 'column' }}>
      {Array.from({ length: count }, (_, index) => `pane-${index}`).map(
        (qa) => (
          <Layout.Pane
            key={qa}
            isResizable
            qa={qa}
            resizeEdge="bottom"
            defaultSize={defaultSize}
            minSize={80}
            maxSize={maxSize}
            flexShrink={1}
            onSizeChange={(size) => onSizeChange?.(qa, size)}
          >
            {qa}
          </Layout.Pane>
        ),
      )}
      <div data-qa="results" style={{ flex: '1 1 0', minHeight: 200 }} />
    </div>
  );
}

function heights() {
  return [
    ...screen.getAllByTestId(/^pane-/),
    screen.getByTestId('results'),
  ].map((item) => item.offsetHeight);
}

// Short enough for a failure to report the heights instead of timing out.
function expectHeights(expected: number[]) {
  return waitFor(() => expect(heights()).toEqual(expected), { timeout: 2000 });
}

function grip(index: number) {
  return screen.getAllByRole('separator', { name: 'Resize pane bottom' })[
    index
  ];
}

async function pressGrip(target: HTMLElement) {
  const rect = target.getBoundingClientRect();
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  const pointer = pointerUserEvent.setup();
  const at = (dy: number) => ({
    target,
    coords: { clientX: x, clientY: y + dy, pageX: x, pageY: y + dy },
  });

  // Testing Library's user-event wraps each event in act itself; an outer act
  // would see the updates in between outside an act environment.
  await pointer.pointer({ keys: '[MouseLeft>]', ...at(0) });

  return {
    moveTo: (dy: number) => pointer.pointer(at(dy)),
    release: (dy: number) =>
      pointer.pointer({ keys: '[/MouseLeft]', ...at(dy) }),
  };
}

describe('Layout.Pane beside another pane that gives way', () => {
  it('moves by whole keyboard steps', async () => {
    renderWithRoot(<ShrunkPanes />);

    expect(heights()).toEqual([200, 200, 200]);

    await act(async () => grip(0).focus());
    await press('{ArrowDown}');
    await expectHeights([210, 190, 200]);
    await press('{ArrowDown}');
    await expectHeights([220, 180, 200]);
    // The pane below keeps the size it was left at; the room goes to the
    // results.
    await press('{ArrowUp}');
    await expectHeights([210, 180, 210]);
  });

  it('ignores a key across its grip, also mid-drag', async () => {
    const onSizeChange = vi.fn();

    renderWithRoot(<ShrunkPanes onSizeChange={onSizeChange} />);

    await act(async () => grip(0).focus());
    await press('{ArrowRight}');

    expect(onSizeChange).not.toHaveBeenCalled();
    expect(heights()).toEqual([200, 200, 200]);

    const drag = await pressGrip(grip(0));

    await drag.moveTo(200);
    await expectHeights([320, 80, 200]);
    onSizeChange.mockClear();
    await press('{ArrowRight}');
    expect(onSizeChange).not.toHaveBeenCalled();

    // The grip still waits at the stop for the pointer.
    await drag.moveTo(150);
    await expectHeights([320, 80, 200]);
    await drag.release(150);
  });

  it('follows the pointer and stays where it is dropped', async () => {
    const onSizeChange = vi.fn();

    renderWithRoot(<ShrunkPanes onSizeChange={onSizeChange} />);

    const drag = await pressGrip(grip(0));

    await drag.moveTo(20);
    await drag.moveTo(50);
    await expectHeights([250, 150, 200]);

    await drag.release(50);
    await waitFor(() =>
      expect(onSizeChange).toHaveBeenCalledWith('pane-1', 150),
    );
    expect(heights()).toEqual([250, 150, 200]);
  });

  it('stops growing once the pane beside it reaches its minimum', async () => {
    renderWithRoot(<ShrunkPanes maxSize={400} />);

    const drag = await pressGrip(grip(0));

    await drag.moveTo(100);
    await drag.moveTo(300);
    await expectHeights([320, 80, 200]);

    // The grip waits at the stop until the pointer comes back to it, also
    // from past the pane's maxSize.
    await drag.moveTo(200);
    await expectHeights([320, 80, 200]);
    await drag.moveTo(100);
    await expectHeights([300, 100, 200]);

    await drag.release(100);
    expect(heights()).toEqual([300, 100, 200]);
  });

  it('gives room back to the results, as with the keyboard', async () => {
    renderWithRoot(<ShrunkPanes />);

    const drag = await pressGrip(grip(0));

    await drag.moveTo(50);
    await expectHeights([250, 150, 200]);

    // The pane below grows back no larger than it was when the drag started.
    await drag.moveTo(-10);
    await expectHeights([190, 200, 210]);

    await drag.release(-10);
    expect(heights()).toEqual([190, 200, 210]);
  });

  it('takes no room from the pane above its grip', async () => {
    renderWithRoot(<ShrunkPanes />);

    await act(async () => grip(1).focus());
    await press('{ArrowUp}');
    await expectHeights([200, 190, 210]);

    const drag = await pressGrip(grip(1));

    await drag.moveTo(50);
    await expectHeights([200, 200, 200]);
    await drag.release(50);
    expect(heights()).toEqual([200, 200, 200]);
  });

  it('changes nothing when a move ends where it began', async () => {
    const onSizeChange = vi.fn();

    renderWithRoot(<ShrunkPanes onSizeChange={onSizeChange} />);

    // The results are at their minimum, so the grip cannot move down.
    await act(async () => grip(1).focus());
    await press('{ArrowDown}');
    expect(heights()).toEqual([200, 200, 200]);

    const drag = await pressGrip(grip(0));

    await drag.moveTo(40);
    await expectHeights([240, 160, 200]);
    await drag.moveTo(0);
    await drag.release(0);
    await expectHeights([200, 200, 200]);
    expect(onSizeChange).not.toHaveBeenCalled();

    // The panes still have their own sizes once there is room.
    await setColumnHeight(1000);
    await expectHeights([300, 300, 400]);
  });

  it('changes nothing when a key at the stop meets half pixels', async () => {
    const onSizeChange = vi.fn();

    // Each pane is drawn at 200.5px.
    renderWithRoot(<ShrunkPanes height={601} onSizeChange={onSizeChange} />);

    await act(async () => grip(1).focus());
    await press('{ArrowDown}');
    expect(onSizeChange).not.toHaveBeenCalled();

    await setColumnHeight(1000);
    await expectHeights([300, 300, 400]);
  });

  it('keeps whole sizes under zoom', async () => {
    const onSizeChange = vi.fn();

    // Zoom draws whole sizes a fraction of a pixel short.
    renderWithRoot(
      <div style={{ zoom: 0.9 }}>
        <ShrunkPanes
          height={1000}
          defaultSize={333}
          onSizeChange={onSizeChange}
        />
      </div>,
    );

    await act(async () => grip(0).focus());
    await press('{ArrowDown}');
    await press('{ArrowDown}');
    await press('{ArrowDown}');

    expect(onSizeChange.mock.calls).toEqual([
      ['pane-0', 343],
      ['pane-0', 353],
      ['pane-0', 363],
    ]);
  });

  it('gives the panes beside it back when it unmounts mid-drag', async () => {
    const { rerender } = renderWithRoot(<ShrunkPanes height={600} />);
    const drag = await pressGrip(grip(1));

    await drag.moveTo(-40);
    await expectHeights([200, 160, 240]);

    rerender(<ShrunkPanes height={600} count={1} />);
    await expectHeights([300, 300]);
  });

  it('moves between three panes that give way', async () => {
    renderWithRoot(<ShrunkPanes count={3} />);

    expect(heights()).toEqual([200, 200, 200, 200]);

    await act(async () => grip(0).focus());
    await press('{ArrowDown}');
    await expectHeights([210, 195, 195, 200]);

    const drag = await pressGrip(grip(1));

    await drag.moveTo(30);
    await expectHeights([210, 225, 165, 200]);
    await drag.release(30);
    expect(heights()).toEqual([210, 225, 165, 200]);
  });

  it('lets go of its size after an arrow key pressed mid-drag', async () => {
    renderWithRoot(<ShrunkPanes />);

    await act(async () => grip(0).focus());

    const drag = await pressGrip(grip(0));

    await drag.moveTo(20);
    await expectHeights([220, 180, 200]);
    await press('{ArrowDown}');
    await expectHeights([230, 170, 200]);
    await drag.moveTo(40);
    await expectHeights([250, 150, 200]);
    await drag.release(40);

    // Both give way again once the column runs shorter.
    await setColumnHeight(500);
    await waitFor(
      () => {
        const [above, below] = heights();

        expect(above).toBeLessThan(250);
        expect(below).toBeLessThan(150);
      },
      { timeout: 2000 },
    );
  });
});
