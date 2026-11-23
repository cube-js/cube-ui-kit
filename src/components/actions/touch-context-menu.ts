/** React Aria's `useLongPress` threshold. */
const LONG_PRESS_DELAY = 500;

/**
 * How long after a long press its own `click` can still arrive. React Aria's
 * `useLongPress` waits the same.
 */
const LATE_CLICK_WINDOW = 100;

/**
 * Marks an element whose touch long press opens its context menu. `GlobalStyles`
 * turns iOS's own long-press callout off on it.
 */
export const TOUCH_CONTEXT_MENU_ATTRIBUTE = 'data-context-menu';

interface Press {
  down: PointerEvent;
  timer?: ReturnType<typeof setTimeout>;
  /** A menu opened: the long press owns the rest of the gesture. */
  isClaimed: boolean;
}

/**
 * Opens context menus on a touch long press, on every platform.
 *
 * iOS fires no `contextmenu` on a long press (WebKit bug 213953), so a menu that
 * only answers that event can't be opened there at all. Inside `container`, a
 * touch held still for 500 ms on an element marked `data-context-menu` fires
 * one at the touch point, and the menu opens through the same handler as a
 * right-click. Android fires its own earlier (~400 ms); that one claims the
 * press instead, so the menu opens once.
 *
 * Once a menu opens, the long press owns the gesture, as React Aria's
 * `useLongPress` does: a bubbling `pointercancel` ends every `usePress` in and
 * around the element, and the `click` some platforms still fire on release is
 * swallowed, so lifting the finger does not also activate the row. A text
 * selection can't start during the press.
 *
 * Returns the cleanup.
 */
export function bindTouchContextMenu(container: HTMLElement): () => void {
  const doc = container.ownerDocument;
  let press: Press | null = null;
  let isSwallowingClick = false;
  let clickTimer: ReturnType<typeof setTimeout> | undefined;

  function release(event?: Event) {
    if (!press) return;
    if (event instanceof PointerEvent) {
      // Another pointer's release, such as a mouse's, doesn't end this touch.
      if (event.pointerId !== press.down.pointerId) return;
      // A synthetic `pointercancel`, ours included, ends somebody's press, not
      // the finger's contact: only the browser cancels that.
      if (event.type === 'pointercancel' && !event.isTrusted) return;
    }

    clearTimeout(press.timer);
    if (press.isClaimed) {
      isSwallowingClick = true;
      clickTimer = setTimeout(() => {
        isSwallowingClick = false;
      }, LATE_CLICK_WINDOW);
    }
    press = null;
    doc.removeEventListener('pointerup', release, true);
    doc.removeEventListener('pointercancel', release, true);
  }

  function claim(current: Press) {
    current.isClaimed = true;
    current.down.target?.dispatchEvent(
      new PointerEvent('pointercancel', { bubbles: true }),
    );
  }

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType !== 'touch' || !event.isPrimary) return;

    const target =
      event.target instanceof Element
        ? event.target.closest(`[${TOUCH_CONTEXT_MENU_ATTRIBUTE}]`)
        : null;

    if (!target || !container.contains(target)) return;

    release();
    clearTimeout(clickTimer);
    isSwallowingClick = false;

    const current: Press = { down: event, isClaimed: false };

    current.timer = setTimeout(() => {
      const origin = event.target;

      if (!(origin instanceof Element) || !origin.isConnected) return;

      const { clientX, clientY, screenX, screenY } = event;
      const isOpened = !origin.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX,
          clientY,
          screenX,
          screenY,
        }),
      );

      if (isOpened && press === current) claim(current);
    }, LONG_PRESS_DELAY);
    press = current;
    doc.addEventListener('pointerup', release, true);
    doc.addEventListener('pointercancel', release, true);
  }

  function onContextMenu(event: MouseEvent) {
    if (!press) return;

    // The platform's own long-press menu, after one has already opened.
    if (press.isClaimed) {
      event.preventDefault();
      event.stopImmediatePropagation();

      return;
    }

    // This press has its `contextmenu` now: ours, a nested binding's, or the
    // platform's. A native one is the platform's long press; when no handler
    // takes it, the browser shows its own menu and ends the touch anyway.
    clearTimeout(press.timer);
    if (event.isTrusted) claim(press);
  }

  function onClick(event: MouseEvent) {
    if (!isSwallowingClick) return;

    isSwallowingClick = false;
    event.preventDefault();
    event.stopPropagation();
  }

  function onSelectStart(event: Event) {
    if (press) event.preventDefault();
  }

  container.addEventListener('pointerdown', onPointerDown, true);
  container.addEventListener('contextmenu', onContextMenu, true);
  container.addEventListener('click', onClick, true);
  container.addEventListener('selectstart', onSelectStart);
  // A native drag takes the press over: reorderable tabs and columns start one
  // on a touch long press too.
  container.addEventListener('dragstart', release);

  return () => {
    release();
    clearTimeout(clickTimer);
    container.removeEventListener('pointerdown', onPointerDown, true);
    container.removeEventListener('contextmenu', onContextMenu, true);
    container.removeEventListener('click', onClick, true);
    container.removeEventListener('selectstart', onSelectStart);
    container.removeEventListener('dragstart', release);
  };
}
