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

/**
 * `listGap` spaces the options however the list lays them out. In a browser
 * because two of the three layouts are the virtualizer's arithmetic, not CSS:
 * a flat list positions its options absolutely, so their margins space
 * nothing, and the virtualizer has to add the gap itself.
 */
describe('ListBox listGap', () => {
  const COLORS = ['Red', 'Green', 'Blue'];

  function gaps() {
    const options = screen.getAllByRole('option');

    return options
      .slice(1)
      .map((option, index) =>
        Math.round(
          option.getBoundingClientRect().top -
            options[index].getBoundingClientRect().bottom,
        ),
      );
  }

  const layouts = {
    flat: (gap?: number) => (
      <ListBox aria-label="Colors" listGap={gap}>
        {COLORS.map((color) => (
          <ListBox.Item key={color}>{color}</ListBox.Item>
        ))}
      </ListBox>
    ),
    sectioned: (gap?: number) => (
      <ListBox aria-label="Colors" listGap={gap}>
        <ListBox.Section>
          {COLORS.map((color) => (
            <ListBox.Item key={color}>{color}</ListBox.Item>
          ))}
        </ListBox.Section>
      </ListBox>
    ),
    reorderable: (gap?: number) => (
      <ListBox isReorderable aria-label="Colors" listGap={gap}>
        {COLORS.map((color) => (
          <ListBox.Item key={color}>{color}</ListBox.Item>
        ))}
      </ListBox>
    ),
  };

  it.each(Object.keys(layouts) as (keyof typeof layouts)[])(
    'spaces a %s list by listGap',
    async (layout) => {
      renderWithRoot(layouts[layout](6));

      await vi.waitFor(() => expect(gaps()).toEqual([6, 6]));
    },
  );

  it.each(Object.keys(layouts) as (keyof typeof layouts)[])(
    'keeps a hairline between the options of a %s list by default',
    async (layout) => {
      renderWithRoot(layouts[layout]());

      await vi.waitFor(() => expect(gaps()).toEqual([1, 1]));
    },
  );
});
