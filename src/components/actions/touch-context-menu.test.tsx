import { act, fireEvent, renderWithRoot, screen, userEvent } from '../../test';

import { ItemButton } from './ItemButton/ItemButton';
import { Menu } from './Menu/Menu';
import { TOUCH_CONTEXT_MENU_ATTRIBUTE } from './touch-context-menu';
import { useContextMenu } from './use-context-menu';

function ContextMenu() {
  return (
    <Menu aria-label="Row actions">
      <Menu.Item key="edit">Edit</Menu.Item>
    </Menu>
  );
}

function Row({
  onPress,
  onPressEnd,
}: {
  onPress: () => void;
  onPressEnd?: () => void;
}) {
  const { targetRef, rendered } = useContextMenu<HTMLDivElement>(ContextMenu);

  return (
    <div ref={targetRef}>
      {rendered}
      <ItemButton qa="Row" onPress={onPress} onPressEnd={onPressEnd}>
        Row title
      </ItemButton>
    </div>
  );
}

/**
 * `GlobalStyles` writes the marker literally, so `Root`'s import graph stays
 * free of the helper. This keeps the two spellings from drifting: Chromium
 * can't observe `-webkit-touch-callout`, so nothing else would notice.
 */
it('turns iOS’s callout off on the elements a long press opens a menu on', () => {
  renderWithRoot(<div />);

  const rules = Array.from(document.styleSheets).flatMap((sheet) =>
    Array.from(sheet.cssRules),
  );
  const rule = rules.find(
    (candidate) =>
      candidate instanceof CSSStyleRule &&
      candidate.selectorText === `[${TOUCH_CONTEXT_MENU_ATTRIBUTE}]`,
  );

  // jsdom's CSSOM drops `-webkit-touch-callout` as unknown and keeps the rule,
  // so the selector is what this can check.
  expect(rule).toBeDefined();
});

describe('a touch long press', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // A finger has a contact size: React Aria reads a zero-size pointer as a
  // screen reader's virtual press and ignores it.
  const TOUCH = {
    pointerType: 'touch',
    pointerId: 2,
    isPrimary: true,
    button: 0,
    width: 10,
    height: 10,
    pressure: 0.5,
    clientX: 10,
    clientY: 10,
  };

  it('still lets a tap with no click press the row', () => {
    vi.useFakeTimers();
    const onPress = vi.fn();

    renderWithRoot(<Row onPress={onPress} />);
    const row = screen.getByTestId('Row');

    fireEvent.pointerDown(row, TOUCH);
    act(() => vi.advanceTimersByTime(100));
    fireEvent.pointerUp(row, TOUCH);
    act(() => vi.advanceTimersByTime(200));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  /**
   * iOS fires no click after a long press, so React Aria's `usePress` clicks
   * the row itself 80 ms after the lift; Chromium's emulation sends a real
   * click instead, so only jsdom shows this path.
   */
  it('ends the row’s press when the menu opens, and the lift does not press it', () => {
    vi.useFakeTimers();
    const onPress = vi.fn();
    const onPressEnd = vi.fn();

    renderWithRoot(<Row onPress={onPress} onPressEnd={onPressEnd} />);
    const row = screen.getByTestId('Row');

    fireEvent.pointerDown(row, TOUCH);
    act(() => vi.advanceTimersByTime(500));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    // The finger is still down, but the row no longer looks pressed under the
    // menu: the long press's `pointercancel` ended its press.
    expect(onPressEnd).toHaveBeenCalledTimes(1);

    fireEvent.pointerUp(row, TOUCH);
    act(() => vi.advanceTimersByTime(200));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('is off where there is no PointerEvent, as in jsdom 26', async () => {
    const { PointerEvent } = globalThis;

    // @ts-expect-error -- simulating an environment without the global
    delete globalThis.PointerEvent;

    try {
      const { unmount } = renderWithRoot(<Row onPress={() => {}} />);

      // user-event dispatches touch pointer events with its own class there.
      await userEvent.pointer([
        { keys: '[TouchA>]', target: screen.getByTestId('Row') },
        { keys: '[/TouchA]' },
      ]);
      unmount();
    } finally {
      globalThis.PointerEvent = PointerEvent;
    }

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
