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
import { useI18n } from '../../i18n';
import { generateRandomId } from '../../utils/random';
import { mergeProps } from '../../utils/react';
import { usePopoverSync } from '../../utils/react/usePopoverSync';

import { MenuTrigger } from './Menu';

export interface UseAnchoredMenuReturn<P, T> {
  /** Ref to attach to the anchor element for positioning the menu. */
  anchorRef: RefObject<HTMLElement | null>;

  /**
   * Programmatically opens the menu with the provided props. They are merged
   * over the CURRENT `defaultMenuProps` on every render, so defaults that change
   * while the menu is open reach it without an `update()` call.
   *
   * @param props - Props to pass to the menu component
   * @param triggerProps - Additional props for MenuTrigger (merged with defaultTriggerProps)
   */
  open(props?: P, triggerProps?: T): void;

  /**
   * Updates the RUNTIME props of the currently open menu. Props are merged over
   * the current `defaultMenuProps`. Only needed for props the caller owns —
   * `defaultMenuProps` is re-read on every render.
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
 * @param defaultMenuProps - Default props to pass to the Menu component.
 * @returns An object with `anchorRef` to position the menu, `open` function to open the menu with provided props, `close` function to close the menu, and `rendered` JSX element to include in your component tree.
 */
export function useAnchoredMenu<P, T = ComponentProps<typeof MenuTrigger>>(
  Component: ComponentType<P>,
  defaultTriggerProps?: Omit<
    ComponentProps<typeof MenuTrigger>,
    'children' | 'isOpen' | 'onOpenChange' | 'targetRef'
  >,
  defaultMenuProps?: P,
): UseAnchoredMenuReturn<P, T> {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  /**
   * The props the CALLER passed to `open()`/`update()`, on their own — never
   * pre-merged with `defaultMenuProps`. Merging at open time snapshotted the
   * defaults, which froze the content of a menu whose items live in those
   * defaults; merging on render keeps them current. Runtime props still win.
   */
  const [runtimeProps, setRuntimeProps] = useState<P | null>(null);
  const [triggerProps, setTriggerProps] = useState<T | null>(null);
  const anchorRef = useRef<HTMLElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const setupRef = useRef(false);

  useEffect(() => {
    const el = anchorRef.current;
    if (el) {
      el.dataset.popoverTrigger = '';
      return () => {
        delete el.dataset.popoverTrigger;
      };
    }
  }, []);

  // Generate a unique ID for this menu instance
  const menuId = useMemo(() => generateRandomId(), []);

  // Feed both the anchor (`triggerRef`) and the popover container
  // (`containerRef`) into the sync. The container ref is shared with the
  // rendered `MenuTrigger` via its `popoverRef` prop — the dummy `MenuTrigger`
  // opts out of `usePopoverSync` (`enabled: !isDummy`), so without this the
  // nested-popover guard would have no container to match against and a
  // `SubMenuTrigger` opened inside this menu would close the whole menu.
  usePopoverSync({
    menuId,
    isOpen,
    onClose: () => setIsOpen(false),
    triggerRef: anchorRef,
    containerRef: popoverRef,
  });

  function setupCheck() {
    if (!setupRef.current) {
      throw new Error(
        'useAnchoredMenu: MenuTrigger must be rendered. Use `rendered` property to include it in your component tree.',
      );
    }
  }

  // 'open' accepts props required by the Component and opens the menu
  const open = useEvent((props: P = {} as P, triggerProps?: T) => {
    setupCheck();

    // Overrides only — `defaultMenuProps` is merged in on render.
    setRuntimeProps(props);
    setTriggerProps(triggerProps ?? null);
    setIsOpen(true);
  });

  const update = useEvent((props: P, triggerProps?: T) => {
    setupCheck();

    setRuntimeProps(props);
    setTriggerProps(triggerProps ?? null);
  });

  const close = useEvent(() => {
    setIsOpen(false);
  });

  // Render the menu only when it has been opened at least once
  const renderedMenu = useMemo(() => {
    if (!runtimeProps) return null;

    // Merged here rather than at open time, so the defaults an open menu
    // renders are the CURRENT ones. Runtime props still take precedence.
    const componentProps = defaultMenuProps
      ? { ...defaultMenuProps, ...runtimeProps }
      : runtimeProps;

    return (
      <MenuTrigger
        {...mergeProps(defaultTriggerProps, triggerProps || undefined)}
        isDummy
        isOpen={isOpen}
        targetRef={anchorRef}
        popoverRef={popoverRef}
        onOpenChange={setIsOpen}
      >
        <VisuallyHidden>
          <Pressable>
            <button aria-label={t('contextMenu.contextMenu', 'context-menu')} />
          </Pressable>
        </VisuallyHidden>
        <Component {...componentProps} />
      </MenuTrigger>
    );
  }, [
    runtimeProps,
    defaultMenuProps,
    triggerProps,
    isOpen,
    defaultTriggerProps,
    t,
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
