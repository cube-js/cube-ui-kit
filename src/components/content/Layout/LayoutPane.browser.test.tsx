import { userEvent } from 'vitest/browser';

import { act, renderWithRoot, screen, waitFor } from '../../../test';

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
});
