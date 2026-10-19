import { useState } from 'react';
import { userEvent } from 'vitest/browser';

import { act, renderWithRoot, screen, waitFor } from '../../../test';

import { Button } from './Button';

const LONG_LABEL = 'A label far too long to ever fit inside this narrow box';

/** Lets the auto tooltip's queued overflow check and its commit run. */
function settle() {
  return act(async () => {
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
}

describe('<Button /> disabled focusability', () => {
  /**
   * A truncated label turns the automatic tooltip on, and an active tooltip
   * used to keep a disabled button focusable. The same button was then a Tab
   * stop in a narrow window and skipped in a wide one.
   */
  it('stays natively disabled whether or not its label is truncated', async () => {
    const content = (width: number) => (
      <div style={{ width }}>
        <Button isDisabled>{LONG_LABEL}</Button>
      </div>
    );
    const { rerender } = renderWithRoot(content(80));

    await settle();

    const label = screen
      .getByRole('button')
      .querySelector('[data-element="Label"]') as HTMLElement;

    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    expect(screen.getByRole('button')).toBeDisabled();

    rerender(content(1000));
    await settle();

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('keeps an explicit tooltip reachable while disabled', async () => {
    renderWithRoot(
      <Button isDisabled tooltip="Not enough permissions">
        Save
      </Button>,
    );

    await userEvent.keyboard('{Tab}');

    expect(screen.getByRole('button')).toHaveFocus();
    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveTextContent(
        'Not enough permissions',
      ),
    );
  });

  /**
   * `isLoading` used to set the native `disabled` attribute, which drops
   * focus to the page the moment a keyboard press starts the work.
   */
  it('keeps focus when a keyboard press starts loading', async () => {
    function Save() {
      const [isLoading, setIsLoading] = useState(false);

      return (
        <Button isLoading={isLoading} onPress={() => setIsLoading(true)}>
          Save
        </Button>
      );
    }

    renderWithRoot(<Save />);

    await userEvent.keyboard('{Tab}');
    await userEvent.keyboard('{Enter}');
    await settle();

    const button = screen.getByRole('button', { name: 'Save' });

    expect(button).toHaveAttribute('data-loading');
    expect(document.activeElement).toBe(button);
  });
});
