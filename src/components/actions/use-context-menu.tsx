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

import { useEvent } from '../../_internal';
import { generateRandomId } from '../../utils/random';
import { mergeProps } from '../../utils/react';
import { useEventBus } from '../../utils/react/useEventBus';

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
   * Runtime props are merged with defaultMenuProps (runtime props take precedence).
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
   * Updates the props of the currently open menu without repositioning.
   * Props are merged with defaultMenuProps.
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
  const [isOpen, setIsOpen] = useState(false);
  const [componentProps, setComponentProps] = useState<P | null>(null);
  const [triggerProps, setTriggerProps] = useState<T | null>(null);
  const [anchorPosition, setAnchorPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const targetRef = useRef<E>(null);
  const invisibleAnchorRef = useRef<HTMLSpanElement>(null);
  const setupRef = useRef(false);

  // Generate a unique ID for this menu instance
  const menuId = useMemo(() => generateRandomId(), []);

  // Get event bus for menu synchronization
  const { emit, on } = useEventBus();

  // Listen for other menus opening and close this one if needed
  useEffect(() => {
    const unsubscribe = on('menu:open', (data: { menuId: string }) => {
      // If another menu is opening and this menu is open, close this one
      if (data.menuId !== menuId && isOpen) {
        setIsOpen(false);
        setAnchorPosition(null);
      }
    });

    return unsubscribe;
  }, [on, menuId, isOpen]);

  // Emit event when this menu opens
  useEffect(() => {
    if (isOpen) {
      emit('menu:open', { menuId });
    }
  }, [isOpen, emit, menuId]);

  function setupCheck() {
    if (!setupRef.current) {
      throw new Error(
        'useContextMenu: MenuTrigger must be rendered. Use `rendered` property to include it in your component tree.',
      );
    }
  }

  // Helper function to calculate position relative to targetRef, taking the
  // element's scroll offset into account. Without the scroll offset the menu
  // would be rendered at the wrong place inside scrollable containers.
  const calculatePosition = (
    event?: NativeMouseEvent | NativePointerEvent | MouseEvent | PointerEvent,
  ) => {
    const container = targetRef.current;

    // If no event is provided, position at the center of the element
    if (!event) {
      if (!container) {
        return { x: 0, y: 0 };
      }

      const containerRect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const scrollTop = container.scrollTop;

      const computed = window.getComputedStyle(container);
      const borderLeft = parseFloat(computed.borderLeftWidth) || 0;
      const borderTop = parseFloat(computed.borderTopWidth) || 0;

      // Position at the center of the element's content area
      const x = container.clientWidth / 2 + scrollLeft;
      const y = container.clientHeight / 2 + scrollTop;

      // Clamp to the full scroll size
      const clampedX = Math.max(0, Math.min(x, container.scrollWidth));
      const clampedY = Math.max(0, Math.min(y, container.scrollHeight));

      return { x: clampedX, y: clampedY };
    }

    // If the target reference is missing, fall back to viewport coordinates.
    if (!container) {
      const { clientX = 0, clientY = 0 } = event;

      return { x: clientX, y: clientY };
    }

    const containerRect = container.getBoundingClientRect();

    // Get coordinates from the event (viewport-relative)
    const { clientX, clientY } = event;

    // Take the element's scroll offset into account so that the coordinates are
    // relative to the **content** box, not the visible viewport of the
    // element.
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    const computed = window.getComputedStyle(container);
    const borderLeft = parseFloat(computed.borderLeftWidth) || 0;
    const borderTop = parseFloat(computed.borderTopWidth) || 0;

    const x = clientX - containerRect.left - borderLeft + scrollLeft;
    const y = clientY - containerRect.top - borderTop + scrollTop;

    // Clamp to the full scroll size so that the invisible anchor always stays
    // inside the element regardless of the scroll position.
    const clampedX = Math.max(0, Math.min(x, container.scrollWidth));
    const clampedY = Math.max(0, Math.min(y, container.scrollHeight));

    return { x: clampedX, y: clampedY };
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

      // Merge defaultMenuProps with provided props
      const finalProps = defaultMenuProps
        ? { ...defaultMenuProps, ...props }
        : props;

      setComponentProps(finalProps);
      setTriggerProps(triggerProps ?? null);
      setIsOpen(true);
    },
  );

  const update = useEvent((props: P, triggerProps?: T) => {
    setupCheck();

    // Merge defaultMenuProps with provided props
    const finalProps = defaultMenuProps
      ? { ...defaultMenuProps, ...props }
      : props;

    setComponentProps(finalProps as P);
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
        open(defaultMenuProps, undefined, event);
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

  // Render the menu only when componentProps is set
  const renderedMenu = useMemo(() => {
    if (!componentProps || !anchorPosition) return null;

    return (
      <>
        {/* Invisible anchor element positioned at click coordinates */}
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
        <MenuTrigger
          isDummy
          isOpen={isOpen}
          targetRef={invisibleAnchorRef}
          offset={0}
          crossOffset={0}
          placement={
            (triggerProps as ComponentProps<typeof MenuTrigger>)?.placement ||
            defaultTriggerProps?.placement ||
            'bottom start'
          }
          onOpenChange={setIsOpen}
          {...mergeProps(defaultTriggerProps, triggerProps || undefined)}
        >
          <VisuallyHidden>
            <Pressable>
              <button aria-label="Open context menu" />
            </Pressable>
          </VisuallyHidden>
          <Component {...componentProps} />
        </MenuTrigger>
      </>
    );
  }, [
    componentProps,
    triggerProps,
    isOpen,
    defaultTriggerProps,
    anchorPosition,
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
