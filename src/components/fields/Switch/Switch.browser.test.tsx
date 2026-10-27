import { userEvent } from 'vitest/browser';

import { renderWithRoot, screen, waitFor } from '../../../test';
import { Text } from '../../content/Text';

import { Switch } from './Switch';

const LONG_LABEL =
  'Clear the data it wrote into Quarterly Revenue Detail A1 through C6';

/**
 * Children used to go through `<Text nowrap>`, and `white-space: nowrap`
 * inherits: no label could wrap, so a long one ran out of its container. A
 * layout fact, so it needs a real browser.
 */
describe('Switch label', () => {
  it.each([
    ['string', LONG_LABEL],
    ['custom node', <Text key="label">{LONG_LABEL}</Text>],
  ])('wraps a long %s label instead of overflowing', async (_, label) => {
    renderWithRoot(
      <div style={{ width: 300 }}>
        <Switch>{label}</Switch>
      </div>,
    );

    const wrapper = await screen.findByTestId('SwitchWrapper');

    expect(wrapper.getBoundingClientRect().width).toBeLessThanOrEqual(300);
    expect(wrapper.getBoundingClientRect().height).toBeGreaterThan(30);
  });
});

/**
 * A disabled switch with a tooltip stays focusable, so the keyboard can read
 * why it is disabled. It must stay as inert as a natively disabled one, and a
 * cancelled click is the browser's own: jsdom toggles the input once more after
 * React has restored it.
 */
describe('Disabled Switch with a tooltip', () => {
  beforeAll(async () => {
    await userEvent.hover(document.body);
  });

  it('is reached by the keyboard and never toggled', async () => {
    const onChange = vi.fn();

    renderWithRoot(
      <>
        <button type="button">Before</button>
        <Switch isDisabled tooltip="Runs nightly" onChange={onChange}>
          Schedule
        </Switch>
      </>,
    );

    const input = screen.getByRole('switch');

    screen.getByRole('button', { name: 'Before' }).focus();
    await userEvent.keyboard('{Tab}');

    expect(input).toHaveFocus();
    await waitFor(() =>
      expect(
        Array.from(document.querySelectorAll('[role="tooltip"]')).map(
          (tip) => tip.textContent,
        ),
      ).toEqual(['Runs nightly']),
    );

    await userEvent.keyboard(' ');
    // Forced: Playwright waits for an `aria-disabled` element to become
    // enabled before clicking it, and a user's click does not.
    await userEvent.click(input, { force: true });
    await userEvent.click(screen.getByText('Schedule'), { force: true });

    expect(input).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });
});
