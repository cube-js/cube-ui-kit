import { renderWithRoot, screen, userEvent } from '../../../test';

import { ListBox } from './ListBox';

/**
 * What the list lets out, and what it keeps (CUB-4839).
 *
 * `Escape` has to leave so a surrounding overlay can close on it. Nothing else
 * may follow it out: ancestors run shortcuts off plain keys, and a list that
 * leaked `Enter` into a surrounding form would submit it.
 *
 * In a browser rather than jsdom because the bug this guards is a property of
 * React Aria's real handler. `createEventHandler` keeps its propagation
 * decision for the LIFE of the handler rather than per event, so an opt-out
 * taken for `Escape` silently released every later key until the next render —
 * which only shows up when real keys are dispatched in sequence against a list
 * that does not re-render between them.
 */
describe('ListBox key propagation', () => {
  const user = userEvent.setup();

  function setup() {
    const seen: string[] = [];

    renderWithRoot(
      <div onKeyDown={(event) => seen.push(event.key)}>
        <ListBox qa="LB" aria-label="Colours">
          <ListBox.Item key="blue">Blue</ListBox.Item>
          <ListBox.Item key="red">Red</ListBox.Item>
        </ListBox>
      </div>,
    );

    const host = screen.getByTestId('LB');

    (host.querySelector('[role="listbox"]') ?? host).focus();

    return seen;
  }

  it('lets Escape out', async () => {
    const seen = setup();

    await user.keyboard('{Escape}');

    expect(seen).toContain('Escape');
  });

  it('still holds a key pressed AFTER Escape', async () => {
    const seen = setup();

    await user.keyboard('{Escape}');
    await user.keyboard('z');

    expect(seen).not.toContain('z');
  });

  it('holds an ordinary key', async () => {
    const seen = setup();

    await user.keyboard('z');

    expect(seen).not.toContain('z');
  });
});
