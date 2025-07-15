import {
  ComponentProps,
  ComponentType,
  MouseEvent,
  PointerEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { VisuallyHidden } from 'react-aria';

import { useEvent } from '../../_internal';
import { mergeProps } from '../../utils/react';

import { MenuTrigger } from './Menu';

/**
 * Generic hook to manage a context menu component that opens at pointer coordinates.
 *
 * @param Component - A React component that represents the menu content (Menu or CommandMenu).
 * @param defaultTriggerProps - Default props to pass to the MenuTrigger.
 * @returns An object with `anchorRef` to position the menu container, `open` function to open the menu at event coordinates, `close` function to close the menu, and `rendered` JSX element to include in your component tree.
 */
export function useContextMenu<P, T = ComponentProps<typeof MenuTrigger>>(
  Component: ComponentType<P>,
  defaultTriggerProps?: Omit<
    ComponentProps<typeof MenuTrigger>,
    'children' | 'isOpen' | 'onOpenChange' | 'targetRef'
  >,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [componentProps, setComponentProps] = useState<P | null>(null);
  const [triggerProps, setTriggerProps] = useState<T | null>(null);
  const [anchorPosition, setAnchorPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const invisibleAnchorRef = useRef<HTMLSpanElement>(null);
  const setupRef = useRef(false);

  function setupCheck() {
    if (!setupRef.current) {
      throw new Error(
        'useContextMenu: MenuTrigger must be rendered. Use `rendered` property to include it in your component tree.',
      );
    }
  }

  // Helper function to calculate position relative to anchorRef, taking the
  // element's scroll offset into account. Without the scroll offset the menu
  // would be rendered at the wrong place inside scrollable containers.
  const calculatePosition = (
    event: MouseEvent | PointerEvent | MouseEvent | PointerEvent,
  ) => {
    const container = anchorRef.current;

    // If the anchor reference is missing, fall back to viewport coordinates.
    if (!container) {
      const { clientX = 0, clientY = 0 } = event as any;

      return { x: clientX, y: clientY };
    }

    const containerRect = container.getBoundingClientRect();

    // Get coordinates from the event (viewport-relative)
    const { clientX, clientY } =
      'clientX' in event && 'clientY' in event
        ? (event as MouseEvent | PointerEvent)
        : { clientX: containerRect.left, clientY: containerRect.top };

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

  // 'open' accepts an event for positioning, props required by the Component and opens the menu
  const open = useEvent(
    (
      event: MouseEvent | PointerEvent | MouseEvent | PointerEvent,
      props: P,
      triggerProps?: T,
    ) => {
      setupCheck();

      // Ensure the anchor element can serve as a positioning context for the
      // invisible target element. If the consumer hasn't explicitly set
      // `position: relative | absolute | fixed | sticky` we switch it to
      // `relative` so that absolutely-positioned children are laid out correctly.
      if (anchorRef.current) {
        const computedStyle = window.getComputedStyle(anchorRef.current);

        if (computedStyle.position === 'static') {
          anchorRef.current.style.position = 'relative';
        }
      }

      // Prevent default context menu if it's a context menu event
      if (
        'preventDefault' in event &&
        typeof event.preventDefault === 'function'
      ) {
        event.preventDefault();
      }

      const { x, y } = calculatePosition(event);
      setAnchorPosition({ x, y });

      setComponentProps(props);
      setTriggerProps(triggerProps ?? null);
      setIsOpen(true);
    },
  );

  const update = useEvent((props: P, triggerProps?: T) => {
    setupCheck();

    setComponentProps(props);
    setTriggerProps(triggerProps ?? null);
  });

  const close = useEvent(() => {
    setIsOpen(false);
    setAnchorPosition(null);
  });

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
          isOpen={isOpen}
          targetRef={invisibleAnchorRef}
          offset={0}
          placement={
            (triggerProps as ComponentProps<typeof MenuTrigger>)?.placement ||
            defaultTriggerProps?.placement ||
            'bottom start'
          }
          onOpenChange={setIsOpen}
          {...mergeProps(defaultTriggerProps, triggerProps || undefined)}
        >
          <VisuallyHidden>
            <button aria-label="context-menu" />
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
    anchorRef,
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
