import { render, screen } from '../../test';

import { Panel } from './Panel';

describe('<Panel />', () => {
  it('updates its modifiers when isFloating and isFlex change after mount', () => {
    const { rerender } = render(<Panel qa="panel" />);

    expect(screen.getByTestId('panel')).not.toHaveAttribute('data-floating');
    expect(screen.getByTestId('panel')).not.toHaveAttribute('data-flex');

    rerender(<Panel isFloating isFlex qa="panel" />);

    expect(screen.getByTestId('panel')).toHaveAttribute('data-floating');
    expect(screen.getByTestId('panel')).toHaveAttribute('data-flex');
  });
});
