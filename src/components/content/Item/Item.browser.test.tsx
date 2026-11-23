import { userEvent } from 'vitest/browser';

import { act, renderWithRoot, screen, waitFor } from '../../../test';
import { centerOf, setTouchEmulation, tapAt } from '../../../test/touch';
import { Menu } from '../../actions/Menu/Menu';
import { MenuTrigger } from '../../actions/Menu/MenuTrigger';
import { Text } from '../Text';

import { Item } from './Item';

/**
 * `Item`'s grid sets `gap: 0`, and `Label` drops its own inline padding for ANY
 * start or end content. So a `prefix` / `suffix` sits flush against the label,
 * while the same glyph in the `icon` slot looks spaced — that slot is a
 * `$size`-wide square which centres a smaller glyph.
 *
 * Flush is right for most content, because a prefix or suffix is usually a box
 * that carries its own presence: a checkbox in a `Tree` node, a kbd chip, a
 * badge. It is wrong for a BARE GLYPH, which is what CUB-4616 reports. Rather
 * than pick one and break the other, the spacing is a token the call site sets.
 *
 * jsdom lays nothing out, so this is only observable in a real browser.
 */
describe('Item start/end slot spacing', () => {
  function gapBetween(left: Element, right: Element) {
    return (
      right.getBoundingClientRect().left - left.getBoundingClientRect().right
    );
  }

  it('leaves no prefix gap by default', async () => {
    renderWithRoot(
      <Item qa="Default" prefix={<Text qa="Glyph">#</Text>}>
        <Text qa="Label">Revenue</Text>
      </Item>,
    );

    const gap = gapBetween(
      await screen.findByTestId('Glyph'),
      await screen.findByTestId('Label'),
    );

    expect(gap).toBe(0);
  });

  it('applies $prefix-gap when the call site sets it', async () => {
    renderWithRoot(
      <Item
        qa="Opted"
        styles={{ '$prefix-gap': '1x' }}
        prefix={<Text qa="Glyph">#</Text>}
      >
        <Text qa="Label">Revenue</Text>
      </Item>,
    );

    const gap = gapBetween(
      await screen.findByTestId('Glyph'),
      await screen.findByTestId('Label'),
    );

    expect(gap).toBeGreaterThan(0);
  });

  it('applies $prefix-gap next to an icon too, where the leading padding is dropped', async () => {
    renderWithRoot(
      <Item
        qa="WithIcon"
        styles={{ '$prefix-gap': '1x' }}
        icon={<Text>@</Text>}
        prefix={<Text qa="Glyph">#</Text>}
      >
        <Text qa="Label">Revenue</Text>
      </Item>,
    );

    const gap = gapBetween(
      await screen.findByTestId('Glyph'),
      await screen.findByTestId('Label'),
    );

    expect(gap).toBeGreaterThan(0);
  });

  it('leaves no suffix gap by default', async () => {
    renderWithRoot(
      <Item qa="DefaultSuffix" suffix={<Text qa="Glyph">42</Text>}>
        <Text qa="Label">Revenue</Text>
      </Item>,
    );

    const gap = gapBetween(
      await screen.findByTestId('Label'),
      await screen.findByTestId('Glyph'),
    );

    expect(gap).toBe(0);
  });

  it('applies $suffix-gap when the call site sets it', async () => {
    renderWithRoot(
      <Item
        qa="OptedSuffix"
        styles={{ '$suffix-gap': '1x' }}
        suffix={<Text qa="Glyph">42</Text>}
      >
        <Text qa="Label">Revenue</Text>
      </Item>,
    );

    const gap = gapBetween(
      await screen.findByTestId('Label'),
      await screen.findByTestId('Glyph'),
    );

    expect(gap).toBeGreaterThan(0);
  });

  it('keeps the outer gutters the tokens must not disturb', async () => {
    renderWithRoot(
      <Item
        qa="Gutters"
        styles={{ '$prefix-gap': '1x', '$suffix-gap': '1x' }}
        prefix={<Text qa="Pfx">#</Text>}
        suffix={<Text qa="Sfx">42</Text>}
      >
        <Text>Revenue</Text>
      </Item>,
    );

    const item = (await screen.findByTestId('Gutters')).getBoundingClientRect();
    const prefix = (await screen.findByTestId('Pfx')).getBoundingClientRect();
    const suffix = (await screen.findByTestId('Sfx')).getBoundingClientRect();

    expect(prefix.left - item.left).toBeGreaterThan(0);
    expect(item.right - suffix.right).toBeGreaterThan(0);
  });
});

/**
 * The description truncates exactly like the label, and used to be the one
 * part a hover could never reveal: an email cut off in a fixed-width cell had
 * no way to be read (CUB-4254). The row has one tooltip, and it shows only
 * what is cut off — repeating text the row already shows in full is noise.
 *
 * jsdom lays nothing out, so truncation is only observable in a real browser.
 */
describe('Item auto tooltip', () => {
  const NAME = 'Jane Doe';
  const LONG_NAME = 'Jane Doe-Smith of the Very Long Family Name';
  const EMAIL = 'participant.with.a.long.address@example-company.com';

  /** Renders a row, hovers it and returns its open tooltip. */
  async function hoverRow(label: string, description: string) {
    // The verdict lands in a microtask after the commit, and turning it on
    // remounts the row under `TooltipProvider`. Let both happen before looking
    // the row up, or the hover lands on a detached node.
    await act(async () => {
      renderWithRoot(
        <Item qa="Row" description={description} styles={{ width: '200px' }}>
          {label}
        </Item>,
      );
    });

    const row = screen.getByTestId('Row');

    // React Aria ignores a hover until a pointer move sets the modality.
    await userEvent.hover(document.body);
    await userEvent.hover(row);

    return screen.findByRole('tooltip');
  }

  it('shows a truncated description on its own when the label fits', async () => {
    const tooltip = await hoverRow(NAME, EMAIL);

    expect(tooltip.textContent).toBe(EMAIL);
  });

  it('leaves out a description that fits', async () => {
    const tooltip = await hoverRow(LONG_NAME, 'Admin');

    expect(tooltip.textContent).toBe(LONG_NAME);
  });

  it('shows both when both are cut off, the description as secondary text', async () => {
    const tooltip = await hoverRow(LONG_NAME, EMAIL);
    const description = tooltip.querySelector('[data-element="Description"]')!;

    expect(tooltip.textContent).toBe(`${LONG_NAME}${EMAIL}`);
    expect(description.textContent).toBe(EMAIL);

    const style = getComputedStyle(description);

    expect(style.display).toBe('block');
    expect(style.fontWeight).toBe('400');
    expect(style.opacity).toBe('0.75');
  });
});

describe('Item actions', () => {
  function MenuRow(props: {
    onPress: () => void;
    onAction: (key: unknown) => void;
  }) {
    return (
      <Menu aria-label="Rows" onAction={props.onAction}>
        <Menu.Item
          key="row"
          actions={
            <Menu.Item.Action qa="RowAction" onPress={props.onPress}>
              Settings
            </Menu.Item.Action>
          }
        >
          Row
        </Menu.Item>
      </Menu>
    );
  }

  /** Past the click React Aria synthesizes 80 ms after a lift with no click. */
  function settle() {
    return act(() => new Promise((resolve) => setTimeout(resolve, 300)));
  }

  describe('on a touch screen', () => {
    beforeEach(() => setTouchEmulation(true));
    afterEach(() => setTouchEmulation(false));

    /**
     * React Aria ends a touch press from a `pointerup` listener on the
     * document, which also marks the finger as off the action before the
     * `pointerleave` that follows the lift. The actions slot stopped
     * `pointerup` on its way there, so that leave ended the press as a miss.
     */
    it('runs an action on a tap', async () => {
      const onPress = vi.fn();

      renderWithRoot(
        <Item
          actions={
            <Item.Action qa="RowAction" onPress={onPress}>
              Settings
            </Item.Action>
          }
        >
          Name
        </Item>,
      );

      await tapAt(centerOf(screen.getByTestId('RowAction')));

      await waitFor(() => expect(onPress).toHaveBeenCalledTimes(1), {
        timeout: 2000,
      });
    });

    it('opens an action’s menu on a tap', async () => {
      renderWithRoot(
        <Item
          actions={
            <MenuTrigger>
              <Item.Action qa="RowAction">More</Item.Action>
              <Menu>
                <Menu.Item key="rename">Rename</Menu.Item>
              </Menu>
            </MenuTrigger>
          }
        >
          Name
        </Item>,
      );

      await tapAt(centerOf(screen.getByTestId('RowAction')));

      // Bounded below the test timeout, so a menu that never opens reports
      // the missing menu rather than a timeout.
      expect(
        await screen.findByRole('menu', {}, { timeout: 2000 }),
      ).toBeInTheDocument();
    });

    it('runs a menu item’s action on a tap, not the item', async () => {
      const onPress = vi.fn();
      const onAction = vi.fn();

      renderWithRoot(<MenuRow onPress={onPress} onAction={onAction} />);

      await tapAt(centerOf(screen.getByTestId('RowAction')));

      await waitFor(() => expect(onPress).toHaveBeenCalled(), {
        timeout: 2000,
      });
      await settle();
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onAction).not.toHaveBeenCalled();
    });
  });

  /**
   * A menu item runs on a mouse release it was not pressed on, so a press can
   * start on its trigger and end on it. The slot keeps such a release from an
   * action off the row.
   */
  it('runs a menu item’s action on a click, not the item', async () => {
    const onPress = vi.fn();
    const onAction = vi.fn();

    renderWithRoot(<MenuRow onPress={onPress} onAction={onAction} />);

    await userEvent.click(screen.getByTestId('RowAction'));
    await settle();

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onAction).not.toHaveBeenCalled();
  });
});
