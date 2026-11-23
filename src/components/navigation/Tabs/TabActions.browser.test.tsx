import { act, renderWithRoot, screen, userEvent, waitFor } from '../../../test';
import { centerOf, tapAt, useTouchEmulation } from '../../../test/touch';
import { Menu } from '../../actions/Menu/Menu';

import { Tab, Tabs } from './Tabs';

/**
 * A tab's actions are rendered as a SIBLING of the tab `<button>`, laid over its
 * trailing end — the same run `ItemButton` and the field triggers use. The two
 * things that behaviour buys are only observable in a real browser: jsdom
 * implements neither `pointer-events` nor hit testing, so it would report a
 * press landing on whichever element the test handed it rather than whichever
 * one the browser paints there.
 */

/**
 * The sibling run for a tab.
 *
 * Scoped to a DIRECT child on purpose: `Item` keeps its own placeholder column
 * under the same element name INSIDE the button, and an unscoped query finds
 * that one first.
 */
function runOf(tabQa: string) {
  return screen
    .getByTestId(tabQa)
    .parentElement!.querySelector(':scope > [data-element="Actions"]')!;
}

/** The delete button has no `qa` of its own; it is the last control in the run. */
function closeButtonOf(tabQa: string) {
  const buttons = runOf(tabQa).querySelectorAll('button');

  return buttons[buttons.length - 1];
}

function renderTabs(props: Record<string, unknown> = {}) {
  return renderWithRoot(
    <Tabs aria-label="tabs" type="file" defaultActiveKey="a" {...props}>
      <Tab key="a" title="One">
        one
      </Tab>
      <Tab key="b" title="Two">
        two
      </Tab>
    </Tabs>,
  );
}

describe('tab actions run', () => {
  it('lets a press in the run’s padding select the tab underneath', async () => {
    renderTabs({ onDelete: () => {} });

    const tab = screen.getByTestId('Tab-b');
    const run = runOf('Tab-b');
    const rect = run.getBoundingClientRect();

    // Guard the guard: an empty run is still `2 * $side-padding` wide, so a
    // width check alone would pass against a run with nothing in it.
    expect(run.childElementCount).toBeGreaterThan(0);
    expect(rect.width).toBeGreaterThan(0);

    // 2px inside the run's right edge — its `$side-padding`, which the run used
    // to swallow because it was opaque to the pointer.
    const target = document.elementFromPoint(
      rect.right - 2,
      rect.top + rect.height / 2,
    );

    expect(target && tab.contains(target)).toBe(true);
  });

  it('keeps the delete action pressable, without selecting the tab', async () => {
    const onDelete = vi.fn();

    renderTabs({ onDelete });

    const close = closeButtonOf('Tab-b');
    const { x, y } = centerOf(close);
    const target = document.elementFromPoint(x, y)!;

    // The action opts back into pointer events, so it — not the tab — is what
    // the browser finds at its centre.
    expect(close.contains(target) || close === target).toBe(true);

    await userEvent.click(target);

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('b'));
    // Pressing an action must not also activate the tab it sits on.
    expect(screen.getByTestId('Tab-a')).toHaveAttribute('data-active');
  });

  it('renders the actions outside the tab button', () => {
    renderTabs({ onDelete: () => {} });

    const tab = screen.getByTestId('Tab-b');
    const close = closeButtonOf('Tab-b');

    expect(tab.tagName).toBe('BUTTON');
    expect(close.tagName).toBe('BUTTON');
    expect(tab.contains(close)).toBe(false);
  });

  it('reserves the run’s width even while the actions are hidden', () => {
    renderTabs({ onDelete: () => {}, autoHideActions: true });

    // `preserveActionsSpace`: the run stays mounted and its width stays
    // published, so the bar does not reflow as the pointer crosses it.
    const tab = screen.getByTestId('Tab-b');
    const wrapper = tab.parentElement!;

    expect(wrapper.style.getPropertyValue('--actions-width')).not.toBe('0px');
    expect(runOf('Tab-b').childElementCount).toBeGreaterThan(0);
  });
});

describe('tab actions run on a touch screen', () => {
  useTouchEmulation();

  /**
   * React Aria ends a touch press from a `pointerup` listener on the document,
   * which also marks the finger as off the button before the `pointerleave`
   * that follows the lift. The run stopped `pointerup` on its way there, so
   * that leave ended the press as a miss and the menu never opened.
   */
  it.each([false, true])(
    'opens a tab’s menu on a tap, without selecting the tab (reorderable: %s)',
    async (isReorderable) => {
      const onChange = vi.fn();

      renderWithRoot(
        <Tabs
          aria-label="tabs"
          type="file"
          defaultActiveKey="a"
          isReorderable={isReorderable}
          menu={<Menu.Item key="rename">Rename</Menu.Item>}
          onChange={onChange}
        >
          <Tab key="a" title="One" />
          <Tab key="b" title="Two" menuTriggerProps={{ qa: 'TabMenu-b' }} />
        </Tabs>,
      );

      await tapAt(centerOf(screen.getByTestId('TabMenu-b')));

      // Bounded below the test timeout, so a menu that never opens reports
      // the missing menu rather than a timeout.
      expect(
        await screen.findByRole('menu', {}, { timeout: 2000 }),
      ).toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByTestId('Tab-a')).toHaveAttribute('data-active');
    },
  );

  it('deletes a tab on a tap on its close button, without selecting it', async () => {
    const onDelete = vi.fn();

    renderTabs({ onDelete });

    await tapAt(centerOf(closeButtonOf('Tab-b')));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('b'), {
      timeout: 2000,
    });
    expect(screen.getByTestId('Tab-a')).toHaveAttribute('data-active');
  });

  /**
   * The menu renders in a portal but inside the run's React tree, so a tap on
   * one of its items passed the same stop and ended as a miss too.
   */
  describe('the tab’s menu, by tap', () => {
    function MenuTabs(props: {
      onTitleChange?: (key: string, title: string) => void;
      onAction?: (action: string, tabKey: string) => void;
    }) {
      return (
        <Tabs
          isEditable
          isReorderable
          aria-label="tabs"
          type="file"
          defaultActiveKey="a"
          menu={
            <>
              <Menu.Item key="rename">Rename</Menu.Item>
              <Menu.Item key="duplicate">Duplicate</Menu.Item>
            </>
          }
          {...props}
        >
          <Tab key="a" title="One" menuTriggerProps={{ qa: 'TabMenu-a' }} />
          <Tab key="b" title="Two" />
        </Tabs>
      );
    }

    async function tapMenuItem(name: string) {
      await tapAt(centerOf(screen.getByTestId('TabMenu-a')));
      await tapAt(
        centerOf(
          await screen.findByRole('menuitem', { name }, { timeout: 2000 }),
        ),
      );
    }

    it('renames the tab, keeping the caret in the input past the menu’s exit', async () => {
      const onTitleChange = vi.fn();

      renderWithRoot(<MenuTabs onTitleChange={onTitleChange} />);
      await tapMenuItem('Rename');

      const input = await screen.findByRole(
        'textbox',
        { name: 'Edit tab title' },
        { timeout: 2000 },
      );

      await waitFor(() => expect(input).toHaveFocus(), { timeout: 2000 });
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 600));
      });
      expect(input).toHaveFocus();
      expect(onTitleChange).not.toHaveBeenCalled();
    });

    it('runs an item’s action once, for its own tab', async () => {
      const onAction = vi.fn();

      renderWithRoot(<MenuTabs onAction={onAction} />);
      await tapMenuItem('Duplicate');

      await waitFor(() => expect(onAction).toHaveBeenCalled(), {
        timeout: 2000,
      });
      // Past the click Aria synthesizes 80 ms after a lift with no click.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
      });
      expect(onAction.mock.calls).toEqual([['duplicate', 'a']]);
      // The menu closes, once its exit transition ends.
      await waitFor(
        () => expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
        { timeout: 2000 },
      );
    });
  });
});
