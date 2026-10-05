import { render, screen, userEvent } from '../../test';

import { useFocus } from './interactions';

type FocusLoss = 'fieldset' | 'tabIndex';

function Probe({ loss, isOff }: { loss: FocusLoss; isOff: boolean }) {
  const { focusProps, isFocused } = useFocus(true);

  const props = {
    'data-qa': 'probe',
    'data-focused': isFocused || undefined,
    ...focusProps,
  };

  return loss === 'fieldset' ? (
    <fieldset disabled={isOff}>
      <button {...props}>probe</button>
    </fieldset>
  ) : (
    <div {...props} tabIndex={isOff ? undefined : 0}>
      probe
    </div>
  );
}

/**
 * A browser moves focus off an element that stops being focusable without a
 * blur React sees. jsdom keeps the focus there, so only a real browser shows
 * whether `useFocus` drops it.
 */
describe.each<FocusLoss>(['fieldset', 'tabIndex'])(
  'useFocus when a %s change takes its focus',
  (loss) => {
    it('drops focus in the same render', async () => {
      const { rerender } = render(<Probe loss={loss} isOff={false} />);

      await userEvent.tab();
      expect(screen.getByTestId('probe')).toHaveAttribute('data-focused');

      rerender(<Probe loss={loss} isOff />);

      expect(screen.getByTestId('probe')).not.toHaveFocus();
      expect(screen.getByTestId('probe')).not.toHaveAttribute('data-focused');
    });
  },
);
