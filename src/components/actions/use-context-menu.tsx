import { Pressable } from '@react-aria/interactions';
import {
  ComponentProps,
  ComponentType,
  MouseEvent,
  PointerEvent,
  ReactElement,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { VisuallyHidden } from 'react-aria';
import { createPortal } from 'react-dom';

import { useEvent } from '../../_internal';
import { useI18n } from '../../i18n';
import { generateRandomId } from '../../utils/random';
import { mergeProps } from '../../utils/react';
import { usePopoverSync } from '../../utils/react/usePopoverSync';

import { MenuTrigger } from './Menu';

type NativeMouseEvent = globalThis.MouseEvent;
type NativePointerEvent = globalThis.PointerEvent;

export interface UseContextMenuReturn<
  E extends HTMLElement = HTMLElement,
  P extends object = {},
  T = ComponentProps<typeof MenuTrigger>,
> {
  /** Container element that receives context menu events. Attach this ref to your target element. */
  targetRef: RefObject<E | null>;

  /**
   * Programmatically opens the menu at the specified coordinates or element center.
   * Runtime props are merged with the CURRENT `defaultMenuProps` on every render
   * (runtime props take precedence), so defaults that change while the menu is
   * open reach it without an `update()` call.
   *
   * @param props - Props to pass to the menu component (optional, defaults to defaultMenuProps)
   * @param triggerProps - Additional props for MenuTrigger (merged with defaultTriggerProps)
   * @param event - The pointer/mouse event containing coordinates for positioning (optional, centers on element if not provided)
   */
  open(
    props?: P,
    triggerProps?: T,
    event?: NativeMouseEvent | NativePointerEvent | MouseEvent | PointerEvent,
  ): void;

  /**
   * Updates the RUNTIME props of the currently open menu without repositioning.
   * Props are merged over the current `defaultMenuProps`. Only needed for props
   * the caller owns — `defaultMenuProps` is re-read on every render.
   */
  update(props: P, triggerProps?: T): void;

  /** Closes the menu programmatically. */
  close(): void;

  /** Current open/closed state of the menu. */
  isOpen: boolean;

  /**
   * JSX element that must be rendered in your component tree.
   * Contains the MenuTrigger and positioning logic.
   * IMPORTANT: Must be placed directly inside the target container (the element with targetRef).
   */
  get rendered(): ReactElement | null;
}

/**
 * Generic hook to manage a context menu component that opens at pointer coordinates.
 *
 * @param Component - A React component that represents the menu content (Menu or CommandMenu).
 * @param defaultTriggerProps - Default props to pass to the MenuTrigger.
 * @param defaultMenuProps - Default props to pass to the Menu component.
 * @returns An object with `targetRef` to attach to the container element, `open` function to open the menu at event coordinates, `close` function to close the menu, and `rendered` JSX element to include in your component tree.
 */
export function useContextMenu<
  E extends HTMLElement = HTMLElement,
  P extends object = {},
  T = ComponentProps<typeof MenuTrigger>,
>(
  Component: ComponentType<P>,
  defaultTriggerProps?: Omit<
    ComponentProps<typeof MenuTrigger>,
    'children' | 'isOpen' | 'onOpenChange' | 'targetRef'
  >,
  defaultMenuProps?: P,
): UseContextMenuReturn<E, P, T> {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  /**
   * The props the CALLER passed to `open()`/`update()`, on their own — never
   * pre-merged with `defaultMenuProps`.
   *
   * Merging at open time snapshotted the defaults, so a consumer that keeps its
   * menu content IN the defaults (`Tree`'s row menu does: `children` is part of
   * the third argument) had a menu that was frozen the moment it opened. Items
   * appearing, disappearing or flipping `isDisabled` while it was open stayed
   * invisible until it was closed and reopened, and the only workaround was to
   * mirror every render into an `update()` call. Keeping the overrides alone
   * lets the merge happen at RENDER time, against the current defaults, while
   * runtime props still win.
   */
  const [runtimeProps, setRuntimeProps] = useState<P | null>(null);
  const [triggerProps, setTriggerProps] = useState<T | null>(null);
  const [anchorPosition, setAnchorPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const targetRef = useRef<E>(null);
  const invisibleAnchorRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const setupRef = useRef(false);

  // Mark the container as a popover trigger so that other open menus' close-on-
  // outside predicates treat clicks inside it (including programmatic
  // open buttons rendered alongside a context-menu target) as a legitimate
  // trigger interaction instead of a generic outside click. This mirrors the
  // pattern in `useAnchoredMenu`.
  useEffect(() => {
    const el = targetRef.current;
    if (el) {
      el.dataset.popoverTrigger = '';
      return () => {
        delete el.dataset.popoverTrigger;
      };
    }
  }, []);

  // Generate a unique ID for this menu instance
  const menuId = useMemo(() => generateRandomId(), []);

  // Feed both the context-menu target (`triggerRef`) and the popover
  // container (`containerRef`) into the sync. The container ref is shared with
  // the rendered `MenuTrigger` via its `popoverRef` prop — the dummy
  // `MenuTrigger` opts out of `usePopoverSync` (`enabled: !isDummy`), so
  // without this the nested-popover guard would have no container to match
  // against and a `SubMenuTrigger` opened inside this menu would close the
  // whole menu.
  usePopoverSync({
    menuId,
    isOpen,
    onClose: () => {
      setIsOpen(false);
      setAnchorPosition(null);
    },
    triggerRef: targetRef as RefObject<HTMLElement | null>,
    containerRef: popoverRef,
  });

  function setupCheck() {
    if (!setupRef.current) {
      throw new Error(
        'useContextMenu: MenuTrigger must be rendered. Use `rendered` property to include it in your component tree.',
      );
    }
  }

  /**
   * Where to put the invisible anchor, in **viewport** coordinates.
   *
   * Viewport rather than container-relative on purpose. The anchor is rendered
   * into a fixed-position host pinned to the viewport origin (see
   * `renderedMenu`), so the two agree by construction. Computing coordinates
   * against the target element while the anchor's containing block was
   * whichever positioned ancestor happened to enclose `rendered` is what used
   * to open the menu one ancestor-origin away from the pointer.
   */
  const calculatePosition = (
    event?: NativeMouseEvent | NativePointerEvent | MouseEvent | PointerEvent,
  ) => {
    if (event) {
      const { clientX = 0, clientY = 0 } = event;

      return { x: clientX, y: clientY };
    }

    // No event — a keyboard opening, which has no coordinates. Anchor on the
    // target element's centre instead.
    const container = targetRef.current;

    if (!container) return { x: 0, y: 0 };

    const rect = container.getBoundingClientRect();

    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };

  // 'open' accepts props, trigger props, and optional event for positioning, then opens the menu
  const open = useEvent(
    (
      props: P = {} as P,
      triggerProps?: T,
      event?: NativeMouseEvent | NativePointerEvent | MouseEvent | PointerEvent,
    ) => {
      setupCheck();

      // Ensure the target element can serve as a positioning context for the
      // invisible target element. If the consumer hasn't explicitly set
      // `position: relative | absolute | fixed | sticky` we switch it to
      // `relative` so that absolutely-positioned children are laid out correctly.
      if (targetRef.current) {
        const computedStyle = window.getComputedStyle(targetRef.current);

        if (computedStyle.position === 'static') {
          targetRef.current.style.position = 'relative';
        }
      }

      // Prevent default context menu if it's a context menu event
      if (
        event &&
        'preventDefault' in event &&
        typeof event.preventDefault === 'function'
      ) {
        event.preventDefault();
      }

      const { x, y } = calculatePosition(event);
      setAnchorPosition({ x, y });

      // Overrides only — `defaultMenuProps` is merged in on render.
      setRuntimeProps(props);
      setTriggerProps(triggerProps ?? null);
      setIsOpen(true);
    },
  );

  const update = useEvent((props: P, triggerProps?: T) => {
    setupCheck();

    setRuntimeProps(props);
    setTriggerProps(triggerProps ?? null);
  });

  const close = useEvent(() => {
    setIsOpen(false);
    setAnchorPosition(null);
  });

  // Context menu event handler
  const onContextMenu = useEvent(
    (event: MouseEvent | PointerEvent | MouseEvent | PointerEvent) => {
      event.preventDefault();
      if (isOpen) {
        const pos = calculatePosition(event);
        setAnchorPosition(pos);
      } else {
        // No overrides: the defaults are merged in on every render, so
        // passing them here would freeze the version this right-click saw.
        open(undefined, undefined, event);
      }
    },
  );

  // Bind the onContextMenu event to targetRef
  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    element.addEventListener('contextmenu', onContextMenu as any);

    return () => {
      element.removeEventListener('contextmenu', onContextMenu as any);
    };
  }, [onContextMenu]);

  // Render the menu only when it has been opened at least once
  const renderedMenu = useMemo(() => {
    if (!runtimeProps || !anchorPosition) return null;

    // Merged here rather than at open time, so the defaults an open menu
    // renders are the CURRENT ones. Runtime props still take precedence.
    const componentProps = defaultMenuProps
      ? { ...defaultMenuProps, ...runtimeProps }
      : runtimeProps;

    return (
      <>
        {/*
          Invisible anchor at the click coordinates.

          Two things make those coordinates mean what they say:

          1. A `fixed` host, so the containing block's origin is the viewport
             rather than whichever positioned ancestor encloses `rendered` — the
             table root, the tree row — which is what used to open the menu one
             ancestor-origin away from the pointer.
          2. A portal to `body`, because `position: fixed` is captured by any
             ancestor carrying a transform, filter or `will-change`. A
             virtualized row is usually translated, so the `fixed` host alone
             would still be anchored to the row.
        */}
        {createPortal(
          <div
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: 0,
              height: 0,
            }}
          >
            <span
              ref={invisibleAnchorRef}
              style={{
                position: 'absolute',
                left: `${anchorPosition.x}px`,
                top: `${anchorPosition.y}px`,
                width: '0px',
                height: '0px',
                lineHeight: '0',
                pointerEvents: 'none',
                visibility: 'hidden',
              }}
            />
          </div>,
          document.body,
        )}
        <MenuTrigger
          offset={0}
          placement={
            (triggerProps as ComponentProps<typeof MenuTrigger>)?.placement ||
            defaultTriggerProps?.placement ||
            'bottom start'
          }
          {...mergeProps(defaultTriggerProps, triggerProps || undefined)}
          isDummy
          isOpen={isOpen}
          targetRef={invisibleAnchorRef}
          popoverRef={popoverRef}
          onOpenChange={setIsOpen}
        >
          <VisuallyHidden>
            <Pressable>
              <button
                aria-label={t(
                  'contextMenu.openContextMenu',
                  'Open context menu',
                )}
              />
            </Pressable>
          </VisuallyHidden>
          <Component {...componentProps} />
        </MenuTrigger>
      </>
    );
  }, [
    runtimeProps,
    defaultMenuProps,
    triggerProps,
    isOpen,
    defaultTriggerProps,
    anchorPosition,
    t,
  ]);

  return {
    targetRef,
    open,
    update,
    close,
    isOpen,
    get rendered() {
      setupRef.current = true;

      return renderedMenu;
    },
  };
}
