import { userEvent } from 'vitest/browser';

import {
  act,
  userEvent as pointerUserEvent,
  renderWithRoot,
  screen,
  waitFor,
} from '../../../test';

import { Layout } from './index';

function ShortColumn({
  columnHeight,
  minSize,
  flexShrink,
  isResizable,
}: {
  columnHeight: number;
  minSize?: number;
  flexShrink?: number;
  isResizable?: boolean;
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
      >
        Pane
      </Layout.Pane>
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
    await userEvent.keyboard('{ArrowUp}');

    await waitFor(() => expect(pane.offsetHeight).toBe(110));
  });

  it('grows no further than the room left beside it', async () => {
    renderWithRoot(
      <ShortColumn
        columnHeight={300}
        minSize={80}
        flexShrink={1}
        isResizable
      />,
    );
    const pane = screen.getByTestId('short-pane');

    await act(async () =>
      screen.getByRole('separator', { name: 'Resize pane bottom' }).focus(),
    );
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowUp}');

    await waitFor(() => expect(pane.offsetHeight).toBe(110));
    expect(screen.getByTestId('beside').offsetHeight).toBe(190);
  });

  it('grows past a short container when it holds its size', async () => {
    renderWithRoot(<ShortColumn isResizable columnHeight={300} />);
    const pane = screen.getByTestId('short-pane');

    await act(async () =>
      screen.getByRole('separator', { name: 'Resize pane bottom' }).focus(),
    );
    await userEvent.keyboard('{ArrowDown}');

    await waitFor(() => expect(pane.offsetHeight).toBe(260));
  });
});

// Two panes that both give way: 300px each above 200px of results in a
// 600px column, so each is drawn at 200px.
function ShrunkPanes({
  onBelowSizeChange,
}: {
  onBelowSizeChange?: (size: number) => void;
}) {
  return (
    <div style={{ height: 600, display: 'flex', flexDirection: 'column' }}>
      {(['above', 'below'] as const).map((qa) => (
        <Layout.Pane
          key={qa}
          isResizable
          qa={qa}
          resizeEdge="bottom"
          defaultSize={300}
          minSize={80}
          flexShrink={1}
          onSizeChange={qa === 'below' ? onBelowSizeChange : undefined}
        >
          {qa}
        </Layout.Pane>
      ))}
      <div data-qa="results" style={{ flex: '1 1 0', minHeight: 200 }} />
    </div>
  );
}

function heights() {
  return ['above', 'below', 'results'].map(
    (qa) => screen.getByTestId(qa).offsetHeight,
  );
}

// Short enough for a failure to report the heights instead of timing out.
function expectHeights(expected: number[]) {
  return waitFor(() => expect(heights()).toEqual(expected), { timeout: 2000 });
}

function aboveGrip() {
  return screen.getAllByRole('separator', { name: 'Resize pane bottom' })[0];
}

async function pressGrip(grip: HTMLElement) {
  const rect = grip.getBoundingClientRect();
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  const pointer = pointerUserEvent.setup();
  const at = (dy: number) => ({
    target: grip,
    coords: { clientX: x, clientY: y + dy, pageX: x, pageY: y + dy },
  });

  await act(async () => {
    await pointer.pointer({ keys: '[MouseLeft>]', ...at(0) });
  });

  return {
    moveTo: (dy: number) =>
      act(async () => {
        await pointer.pointer(at(dy));
      }),
    release: (dy: number) =>
      act(async () => {
        await pointer.pointer({ keys: '[/MouseLeft]', ...at(dy) });
      }),
  };
}

describe('Layout.Pane beside another pane that gives way', () => {
  it('moves by whole keyboard steps', async () => {
    renderWithRoot(<ShrunkPanes />);

    expect(heights()).toEqual([200, 200, 200]);

    await act(async () => aboveGrip().focus());
    await userEvent.keyboard('{ArrowDown}');
    await expectHeights([210, 190, 200]);
    await userEvent.keyboard('{ArrowDown}');
    await expectHeights([220, 180, 200]);
    // The pane below keeps the size it was left at; the room goes to the
    // results.
    await userEvent.keyboard('{ArrowUp}');
    await expectHeights([210, 180, 210]);
  });

  it('follows the pointer and stays where it is dropped', async () => {
    const onBelowSizeChange = vi.fn();

    renderWithRoot(<ShrunkPanes onBelowSizeChange={onBelowSizeChange} />);

    const drag = await pressGrip(aboveGrip());

    await drag.moveTo(20);
    await drag.moveTo(50);
    await expectHeights([250, 150, 200]);

    await drag.release(50);
    await waitFor(() => expect(onBelowSizeChange).toHaveBeenCalledWith(150));
    expect(heights()).toEqual([250, 150, 200]);
  });

  it('stops growing once the pane beside it reaches its minimum', async () => {
    renderWithRoot(<ShrunkPanes />);

    const drag = await pressGrip(aboveGrip());

    await drag.moveTo(100);
    await drag.moveTo(200);
    await expectHeights([320, 80, 200]);

    await drag.moveTo(150);
    await expectHeights([270, 130, 200]);

    await drag.release(150);
    expect(heights()).toEqual([270, 130, 200]);
  });

  it('gives room back to the results, as with the keyboard', async () => {
    renderWithRoot(<ShrunkPanes />);

    const drag = await pressGrip(aboveGrip());

    await drag.moveTo(50);
    await expectHeights([250, 150, 200]);

    // The pane below grows back no larger than it was when the drag started.
    await drag.moveTo(-10);
    await expectHeights([190, 200, 210]);

    await drag.release(-10);
    expect(heights()).toEqual([190, 200, 210]);
  });
});
