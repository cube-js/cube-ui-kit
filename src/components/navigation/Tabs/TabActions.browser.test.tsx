import { cdp } from 'vitest/browser';

import { act, renderWithRoot, screen, userEvent, waitFor } from '../../../test';
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

function centerOf(element: Element) {
  const rect = element.getBoundingClientRect();

  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

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

/** Chromium's coordinates for a point in the test iframe, which Vitest can scale. */
function nativePosition(x: number, y: number) {
  const frame = window.frameElement as HTMLElement | null;
  const bounds = frame?.getBoundingClientRect();
  const scaleX = bounds && frame ? bounds.width / frame.offsetWidth : 1;
  const scaleY = bounds && frame ? bounds.height / frame.offsetHeight : 1;

  return {
    x: (bounds?.left ?? 0) + (x + (frame?.clientLeft ?? 0)) * scaleX,
    y: (bounds?.top ?? 0) + (y + (frame?.clientTop ?? 0)) * scaleY,
  };
}

/** A trusted touch tap, which Chromium turns into pointer events and a click. */
async function tapAt({ x, y }: { x: number; y: number }) {
  await act(async () => {
    await cdp().send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [nativePosition(x, y)],
    });
    await cdp().send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
  });
}

describe('tab actions run on a touch screen', () => {
  beforeEach(async () => {
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: true });
  });

  afterEach(async () => {
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: false });
  });

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
});
