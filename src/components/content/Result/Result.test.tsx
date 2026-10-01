import { render, renderWithRoot, screen } from '../../../test';
import { Button } from '../../actions/Button/Button';
import { Dialog } from '../../overlays/Dialog/Dialog';
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

  it('exposes the size, layout and status as modifiers', () => {
    const { rerender } = render(<Result qa="Result" title="Done" />);

    expect(screen.getByTestId('Result')).toHaveAttribute('data-size', 'medium');
    expect(screen.getByTestId('Result')).toHaveAttribute(
      'data-layout',
      'default',
    );
    expect(screen.getByTestId('Result')).toHaveAttribute('data-status', 'info');

    rerender(
      <Result
        qa="Result"
        size="large"
        layout="stacked"
        status="success"
        title="Done"
      />,
    );

    expect(screen.getByTestId('Result')).toHaveAttribute('data-size', 'large');
    expect(screen.getByTestId('Result')).toHaveAttribute(
      'data-layout',
      'stacked',
    );
    expect(screen.getByTestId('Result')).toHaveAttribute(
      'data-status',
      'success',
    );
  });

  it('drops size and layout in the compact presentation', () => {
    render(
      <Result
        isCompact
        qa="Result"
        size="large"
        layout="stacked"
        title="Done"
      />,
    );

    expect(screen.getByTestId('Result')).toHaveAttribute('data-compact');
    expect(screen.getByTestId('Result')).toHaveAttribute('data-size', 'medium');
    expect(screen.getByTestId('Result')).toHaveAttribute(
      'data-layout',
      'default',
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
              layout="stacked"
              status="success"
              title="Payment complete"
              subtitle="Charged $1,234.00 to Visa"
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
