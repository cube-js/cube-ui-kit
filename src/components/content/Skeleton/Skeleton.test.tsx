import { render, screen } from '../../../test';

import { Skeleton } from './Skeleton';

const placeholders = () =>
  screen.queryAllByRole('region', { name: 'Content is loading' });

describe('<Skeleton />', () => {
  it.each([
    ['page', 2], // the header row stays
    ['content', 0],
    ['tabs', 5], // the tab strip stays
  ] as const)(
    'renders children in place of the body in the %s layout',
    (layout, kept) => {
      render(
        <Skeleton layout={layout} tabs={5}>
          <div>Custom body</div>
        </Skeleton>,
      );

      expect(screen.getByText('Custom body')).toBeInTheDocument();
      expect(placeholders()).toHaveLength(kept);
    },
  );

  it('renders the placeholder body without children', () => {
    render(<Skeleton layout="content" lines={3} />);

    expect(placeholders()).toHaveLength(3);
  });
});
