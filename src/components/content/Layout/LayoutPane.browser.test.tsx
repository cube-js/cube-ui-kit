import { renderWithRoot, screen } from '../../../test';

import { Layout } from './index';

function ShortColumn({
  height,
  minSize,
}: {
  height: number;
  minSize?: number;
}) {
  return (
    <div style={{ height, display: 'flex', flexDirection: 'column' }}>
      <Layout.Pane
        qa="short-pane"
        resizeEdge="bottom"
        defaultSize={250}
        minSize={minSize}
      >
        Pane
      </Layout.Pane>
      <div data-qa="beside" style={{ flex: '1 1 0', minHeight: 180 }} />
    </div>
  );
}

// Flex sizing needs real layout, which jsdom does not do.
describe('Layout.Pane in a short flex container', () => {
  it('gives way so the content beside it keeps its room', () => {
    renderWithRoot(<ShortColumn height={300} minSize={80} />);

    expect(screen.getByTestId('short-pane').offsetHeight).toBe(120);
    expect(screen.getByTestId('beside').offsetHeight).toBe(180);
  });

  it('shrinks no further than its minSize', () => {
    renderWithRoot(<ShortColumn height={200} minSize={80} />);

    expect(screen.getByTestId('short-pane').offsetHeight).toBe(80);
  });

  it('does not take its minimum from an enclosing pane', () => {
    renderWithRoot(
      <Layout.Pane resizeEdge="bottom" defaultSize={400} minSize={150}>
        <ShortColumn height={200} />
      </Layout.Pane>,
    );

    expect(screen.getByTestId('short-pane').offsetHeight).toBeLessThan(150);
  });
});
