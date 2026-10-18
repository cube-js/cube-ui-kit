import { render, screen } from '../../../test';

import { Switch } from './Switch';

vi.mock('../../../_internal/hooks/use-warn');

describe('<Switch /> name', () => {
  it('joins a field label and the inline text', () => {
    render(<Switch label="Notifications">Send me texts</Switch>);

    expect(
      screen.getByRole('switch', { name: 'Notifications Send me texts' }),
    ).toBeInTheDocument();
  });

  // React Aria warns about a switch without children or `aria-label`, though
  // the field `<label for>` names it.
  it('is named by a field label alone without warning about it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      render(<Switch label="Wifi" />);

      expect(screen.getByRole('switch', { name: 'Wifi' })).toBeInTheDocument();
      expect(warn).not.toHaveBeenCalledWith(
        expect.stringContaining('must specify an aria-label'),
      );
    } finally {
      warn.mockRestore();
    }
  });
});

describe('<Switch /> null value', () => {
  it('clears when a controlled isSelected is set to null', () => {
    const { rerender } = render(
      <Switch isSelected onChange={() => {}}>
        Notify
      </Switch>,
    );

    expect(screen.getByRole('switch')).toBeChecked();

    rerender(
      <Switch isSelected={null} onChange={() => {}}>
        Notify
      </Switch>,
    );

    expect(screen.getByRole('switch')).not.toBeChecked();
  });
});
