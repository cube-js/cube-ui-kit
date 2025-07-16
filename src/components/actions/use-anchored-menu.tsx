import { Pressable } from '@react-aria/interactions';
import {
  ComponentProps,
  ComponentType,
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

export interface UseAnchoredMenuReturn<P, T> {
  /** Ref to attach to the anchor element for positioning the menu. */
  anchorRef: RefObject<HTMLElement>;

  /**
   * Programmatically opens the menu with the provided props.
   * @param props - Props to pass to the menu component
   * @param triggerProps - Additional props for MenuTrigger (merged with defaultTriggerProps)
   */
  open(props: P, triggerProps?: T): void;

  /**
   * Updates the props of the currently open menu.
   * Props are merged if defaults are provided.
   */
  update(props: P, triggerProps?: T): void;

  /** Closes the menu programmatically. */
  close(): void;

  /** Current open/closed state of the menu. */
  isOpen: boolean;

  /**
   * JSX element that must be rendered in your component tree.
   * Contains the MenuTrigger and positioning logic.
   */
  get rendered(): ReactElement | null;
}

/**
 * Generic hook to manage an anchored menu component.
 *
 * @param Component - A React component that represents the menu content (Menu or CommandMenu).
 * @param defaultTriggerProps - Default props to pass to the MenuTrigger.
 * @returns An object with `anchorRef` to position the menu, `open` function to open the menu with provided props, `close` function to close the menu, and `rendered` JSX element to include in your component tree.
 */
export function useAnchoredMenu<P, T = ComponentProps<typeof MenuTrigger>>(
  Component: ComponentType<P>,
  defaultTriggerProps?: Omit<
    ComponentProps<typeof MenuTrigger>,
    'children' | 'isOpen' | 'onOpenChange' | 'targetRef'
  >,
): UseAnchoredMenuReturn<P, T> {
  const [isOpen, setIsOpen] = useState(false);
  const [componentProps, setComponentProps] = useState<P | null>(null);
  const [triggerProps, setTriggerProps] = useState<T | null>(null);
  const anchorRef = useRef<HTMLElement>(null);
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
        'useAnchoredMenu: MenuTrigger must be rendered. Use `rendered` property to include it in your component tree.',
      );
    }
  }

  // 'open' accepts props required by the Component and opens the menu
  const open = useEvent((props: P, triggerProps?: T) => {
    setupCheck();

    setComponentProps(props);
    setTriggerProps(triggerProps ?? null);
    setIsOpen(true);
  });

  const update = useEvent((props: P, triggerProps?: T) => {
    setupCheck();

    setComponentProps(props);
    setTriggerProps(triggerProps ?? null);
  });

  const close = useEvent(() => {
    setIsOpen(false);
  });

  // Render the menu only when componentProps is set
  const renderedMenu = useMemo(() => {
    if (!componentProps) return null;

    return (
      <MenuTrigger
        isDummy
        isOpen={isOpen}
        targetRef={anchorRef}
        placement="bottom start"
        onOpenChange={setIsOpen}
        {...mergeProps(defaultTriggerProps, triggerProps || undefined)}
      >
        <VisuallyHidden>
          <Pressable>
            <button aria-label="context-menu" />
          </Pressable>
        </VisuallyHidden>
        <Component {...componentProps} />
      </MenuTrigger>
    );
  }, [componentProps, triggerProps, isOpen, defaultTriggerProps]);

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
