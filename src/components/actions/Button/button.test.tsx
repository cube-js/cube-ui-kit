import { render, screen } from '../../../test';
import { Button } from './Button';

describe('<Button />', () => {
  it('should add data-qa', () => {
    render(<Button data-qa="test">label</Button>);

    expect(screen.getByTestId('test')).toBeInTheDocument();
  });

  it('should have data-is-loading', () => {
    render(
      <Button isLoading data-qa="ApplyDbConnection">
        Apply
      </Button>,
    );

    expect(screen.getByTestId('ApplyDbConnection')).toHaveAttribute(
      'data-is-loading',
      '',
    );
  });

  it('should have data-is-loading after rerender', () => {
    const { rerender } = render(
      <Button isLoading={false} data-qa="ApplyDbConnection">
        Apply
      </Button>,
    );

    rerender(
      <Button isLoading data-qa="ApplyDbConnection">
        Apply
      </Button>,
    );

    expect(screen.getByTestId('ApplyDbConnection')).toHaveAttribute(
      'data-is-loading',
      '',
    );
  });
});
