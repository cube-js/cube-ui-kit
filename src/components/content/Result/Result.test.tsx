import { render, renderWithRoot, screen } from '../../../test';
import { Button } from '../../actions/Button';
import { Dialog } from '../../overlays/Dialog';
import { DialogContainer } from '../../overlays/Dialog/DialogContainer';
import { Content } from '../Content';

import { Result } from './Result';

/** `a` precedes `b` in the DOM. */
function precedes(a: Element, b: Element) {
  return Boolean(
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
}

describe('<Result />', () => {
  it('renders the title and subtitle as headings', () => {
    render(<Result title="Payment complete" subtitle="Charged to Visa" />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Payment complete' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Charged to Visa' }),
    ).toBeInTheDocument();
  });

  it('renders the value between the title and the subtitle', () => {
    render(
      <Result
        title="Payment complete"
        value="$1,234.00"
        subtitle="Charged to Visa"
      />,
    );

    const title = screen.getByText('Payment complete');
    const value = screen.getByText('$1,234.00');
    const subtitle = screen.getByText('Charged to Visa');

    expect(precedes(title, value)).toBe(true);
    expect(precedes(value, subtitle)).toBe(true);
  });

  it('renders the value without a title or subtitle', () => {
    render(<Result value="$1,234.00" />);

    expect(screen.getByText('$1,234.00')).toBeInTheDocument();
  });

  it('renders actions after the free content', () => {
    render(
      <Result title="Payment failed" actions={<Button>Update card</Button>}>
        <p>Nothing was charged.</p>
      </Result>,
    );

    const content = screen.getByText('Nothing was charged.');
    const action = screen.getByRole('button', { name: 'Update card' });

    expect(precedes(content, action)).toBe(true);
  });

  it('exposes the size and status as modifiers', () => {
    const { rerender } = render(<Result qa="Result" title="Done" />);

    expect(screen.getByTestId('Result')).toHaveAttribute('data-size', 'medium');
    expect(screen.getByTestId('Result')).toHaveAttribute('data-status', 'info');

    rerender(<Result qa="Result" size="large" status="success" title="Done" />);

    expect(screen.getByTestId('Result')).toHaveAttribute('data-size', 'large');
    expect(screen.getByTestId('Result')).toHaveAttribute(
      'data-status',
      'success',
    );
  });

  it('replaces the status icon with a custom one', () => {
    render(<Result title="Locked" icon={<span data-qa="CustomIcon" />} />);

    expect(screen.getByTestId('CustomIcon')).toBeInTheDocument();
  });

  it('labels a dialog with its title when the dialog has no header', () => {
    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <Dialog size="S">
          <Content>
            <Result
              size="large"
              status="success"
              title="Payment complete"
              value="$1,234.00"
              subtitle="Charged to Visa"
              actions={<Button type="primary">Done</Button>}
            />
          </Content>
        </Dialog>
      </DialogContainer>,
    );

    const dialog = screen.getByRole('dialog');

    expect(dialog).toHaveAccessibleName('Payment complete');

    // The dialog `title` slot must reach the title only, never the subtitle
    const labelId = dialog.getAttribute('aria-labelledby');

    expect(document.querySelectorAll(`[id="${labelId}"]`)).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 3 })).not.toHaveAttribute(
      'id',
      labelId,
    );
  });
});
