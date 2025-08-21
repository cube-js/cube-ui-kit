import { useSyncRef } from '@react-aria/utils';
import React, {
  Key,
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AriaMenuTriggerProps,
  DismissButton,
  Placement,
  useMenuTrigger,
  useOverlayPosition,
} from 'react-aria';
import { useMenuTriggerState } from 'react-stately';

import { generateRandomId } from '../../../utils/random';
import { useEventBus } from '../../../utils/react/useEventBus';
import { Popover } from '../../overlays/Modal';

import { MenuContext, MenuContextValue, useMenuContext } from './context';
import { SubmenuTriggerContext } from './SubmenuTriggerContext';

// Default placement & offset for sub-menus (matches Spectrum / Aria)
const DEFAULT_PLACEMENT: Placement = 'right top';
const DEFAULT_OFFSET = 4;
const DEFAULT_CROSS_OFFSET = -5;

export interface CubeSubMenuTriggerProps extends AriaMenuTriggerProps {
  /** The preferred placement of the sub-menu relative to the trigger */
  placement?: Placement;

  /** Distance in pixels between the trigger and sub-menu */
  offset?: number;

  /** Distance in pixels along the cross axis from the default alignment */
  crossOffset?: number;

  /** Whether the sub-menu should flip to the opposite side when it would overflow */
  shouldFlip?: boolean;

  /** Minimum padding in pixels between the sub-menu and viewport edges */
  containerPadding?: number;

  /**
   * Sub-menu trigger and the sub-menu itself. Must be exactly two React nodes.
   *
   * 1) Trigger – **must render `<li role="menuitem">`** (usually `Menu.Item`).
   * 2) Sub-menu – a `<Menu>` element.
   */
  children: [ReactNode, ReactElement];

  /** Whether the trigger is disabled and cannot be activated */
  isDisabled?: boolean;

  /**
   * Callback fired when an action is selected from the sub-menu.
   * Bubbles the `onAction` event from the sub-menu to parent components.
   */
  onAction?: (key: Key) => void;

  /**
   * Controls focus behavior when the sub-menu opens.
   * - `true` or `'first'`: Focus the first item
   * - `'last'`: Focus the last item
   * - `false`: Don't auto-focus any item
   * @default 'first'
   */
  autoFocus?: boolean | 'first' | 'last';
}

interface InternalSubMenuTriggerProps extends CubeSubMenuTriggerProps {
  targetKey?: Key;
}

/**
 * Internal SubMenuTrigger that receives the already-rendered trigger element
 * from the collection system and wraps it with submenu behavior.
 */
function InternalSubMenuTrigger(props: InternalSubMenuTriggerProps) {
  const {
    children,
    placement = DEFAULT_PLACEMENT,
    offset = DEFAULT_OFFSET,
    crossOffset = DEFAULT_CROSS_OFFSET,
    shouldFlip = true,
    isDisabled,
    autoFocus = 'first',
    onAction,
    targetKey,
    ...overlayProps
  } = props;

  // Children: [menuTrigger (already rendered MenuItem), menu (Menu component)]
  const [menuTrigger, menu] = React.Children.toArray(children) as [
    ReactElement,
    ReactElement,
  ];

  const state = useMenuTriggerState(props as AriaMenuTriggerProps);

  // Generate a unique ID for this submenu instance
  const submenuId = useMemo(() => generateRandomId(), []);

  // Get event bus for submenu synchronization
  const { emit, on } = useEventBus();

  // Refs – trigger (MenuItem <li>) and overlay (<div> from Popover)
  const domTriggerRef = useRef<HTMLElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  // Strip keyboard/press handlers that we will implement ourselves
  const { menuTriggerProps: rawTriggerProps, menuProps } = useMenuTrigger(
    { type: 'submenu', isDisabled },
    state,
    domTriggerRef,
  );

  // Get parent context to check if parent menu is closing
  const parentContext = useMenuContext();

  // Remove default onKeyDown/onPress handlers from trigger props – we implement custom ones
  const {
    onKeyDown: _mtOnKeyDown,
    onPress: _mtOnPress,
    onPressStart: _mtOnPressStart,
    onKeyUp: _mtOnKeyUp,
    ...menuTriggerProps
  } = rawTriggerProps;

  const { overlayProps: positionProps } = useOverlayPosition({
    targetRef: domTriggerRef,
    overlayRef: popoverRef,
    scrollRef: menuRef,
    placement,
    offset: offset as number,
    crossOffset: crossOffset as number,
    shouldFlip,
    isOpen: state.isOpen,
    onClose: state.close,
  });

  /**
   * Build a MenuContext for the nested menu so it behaves just like a regular
   * popover-based Menu (selection handling, focus management, etc.).
   */
  const nestedMenuContext = useMemo(() => {
    const ctx: MenuContextValue = {
      ...menuProps,
      ref: menuRef,
      // Pass the parent's onClose to close the entire menu hierarchy
      onClose: () => {
        // Close this submenu state immediately
        state.close();

        // Then close the parent menu
        if (parentContext.onClose) {
          parentContext.onClose();
        }
      },
      closeOnSelect: true,
      autoFocus,
      mods: {
        popover: true,
      },
      // Propagate closing state from parent
      isClosing: parentContext.isClosing || !state.isOpen,
    };

    return ctx;
  }, [
    menuProps,
    autoFocus,
    state,
    parentContext.onClose,
    parentContext.isClosing,
  ]);

  // Sync the parent selection manager focus with DOM ref (for virtual focus scenarios)
  useSyncRef(parentContext, domTriggerRef);

  // Listen for other menus opening and close this submenu if needed
  useEffect(() => {
    const unsubscribe = on('menu:open', (data: { menuId: string }) => {
      // If another menu is opening and this submenu is open, close this one
      if (data.menuId !== submenuId && state.isOpen) {
        state.close();
      }
    });

    return unsubscribe;
  }, [on, submenuId, state]);

  // Emit event when this submenu opens
  useEffect(() => {
    if (state.isOpen) {
      emit('menu:open', { menuId: submenuId });
    }
  }, [state.isOpen, emit, submenuId]);

  // Cleanup hover timers and reset refs on unmount
  useEffect(() => {
    return () => {
      if (hoverOpenTimerRef.current) {
        clearTimeout(hoverOpenTimerRef.current);
      }
      if (hoverCloseTimerRef.current) {
        clearTimeout(hoverCloseTimerRef.current);
      }
      isHoveringRef.current = false;
      isHoveringSubmenuRef.current = false;
    };
  }, []);

  // ----- Render -----

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isDisabled) return;

    // Arrow right opens submenu
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      state.open();
    }
    // Enter or Space opens submenu (suppress subsequent onAction)
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      // Stop immediate propagation to prevent React Aria's handlers from running
      e.nativeEvent.stopImmediatePropagation();
      state.open();
      suppressNextActionRef.current = true; // Remember it was keyboard
    }
    // Arrow left closes submenu if open
    else if (e.key === 'ArrowLeft' && state.isOpen) {
      e.preventDefault();
      e.stopPropagation();
      state.close();
    }
  };

  // Use refs to store timer IDs
  const hoverOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track if mouse is over trigger or submenu
  const isHoveringRef = useRef(false);
  const isHoveringSubmenuRef = useRef(false);

  // Track whether the next onAction comes from a keyboard press
  const suppressNextActionRef = useRef(false);

  const checkShouldClose = () => {
    // Only close if mouse is not over trigger OR submenu
    if (!isHoveringRef.current && !isHoveringSubmenuRef.current) {
      hoverCloseTimerRef.current = setTimeout(() => {
        // Double check before closing
        if (!isHoveringRef.current && !isHoveringSubmenuRef.current) {
          state.close();
        }
      }, 300);
    }
  };

  // Handle mouse interactions on trigger
  const handleMouseEnter = () => {
    if (isDisabled) return;

    isHoveringRef.current = true;

    // Clear any pending close timer
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }

    // Use a small delay to prevent accidental opens
    if (!state.isOpen) {
      hoverOpenTimerRef.current = setTimeout(() => {
        if (isHoveringRef.current) {
          state.open();
        }
      }, 200);
    }
  };

  const handleMouseLeave = () => {
    isHoveringRef.current = false;

    // Clear open timer if it exists
    if (hoverOpenTimerRef.current) {
      clearTimeout(hoverOpenTimerRef.current);
      hoverOpenTimerRef.current = null;
    }

    // Check if we should close
    checkShouldClose();
  };

  // Handle mouse events on the submenu popover
  const handlePopoverMouseEnter = () => {
    isHoveringSubmenuRef.current = true;

    // Clear any pending close timer when entering submenu
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    isHoveringSubmenuRef.current = false;

    // Check if we should close
    checkShouldClose();
  };

  // Merge event handlers
  const mergeHandler = (handler1: any, handler2: any) => {
    return (...args: any[]) => {
      handler1?.(...args);
      handler2?.(...args);
    };
  };

  // Provide context to the trigger element (already rendered MenuItem)
  const triggerContextValue = useMemo(
    () => ({
      triggerRef: domTriggerRef,
      triggerProps: menuTriggerProps,
      isOpen: state.isOpen,
      isDisabled,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onKeyDown: handleKeyDown,
      onAction: isDisabled
        ? undefined
        : () => {
            // Ignore the synthetic press generated by the same Enter/Space
            if (suppressNextActionRef.current) {
              suppressNextActionRef.current = false;
              return;
            }
            // This is a mouse click, open the submenu
            state.open();
          },
    }),
    [
      state,
      isDisabled,
      handleMouseEnter,
      handleMouseLeave,
      handleKeyDown,
      menuTriggerProps,
    ],
  );

  return (
    <>
      <SubmenuTriggerContext.Provider value={triggerContextValue}>
        {menuTrigger}
      </SubmenuTriggerContext.Provider>
      {state.isOpen && (
        <Popover
          ref={popoverRef}
          hideArrow
          isNonModal
          isOpen={!parentContext.isClosing}
          style={positionProps.style}
          placement={placement as Placement}
          onClose={state.close}
          // Spread any additional overlay props
          {...overlayProps}
        >
          {/* Wrap content in a div to capture mouse events */}
          <div
            style={{ display: 'contents' }}
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
          >
            {/* Dismiss buttons for screen reader / keyboard support */}
            <DismissButton onDismiss={state.close} />
            {/* Provide updated menu context so nested menu behaves correctly */}
            <MenuContext.Provider value={nestedMenuContext}>
              {/* Clone nested menu to inject required props */}
              {React.cloneElement(menu, {
                ...(menu.props as any),
                autoFocus,
                onAction: (key: Key) => {
                  // Call original menu onAction first
                  (menu.props as any).onAction?.(key);
                  onAction?.(key);
                  // Don't close here - MenuItem will handle it via context.onClose
                },
                onKeyDown: (e: React.KeyboardEvent) => {
                  // Handle keyboard navigation for closing submenu
                  if (e.key === 'ArrowLeft' || e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    state.close();
                    // Return focus to trigger
                    domTriggerRef.current?.focus();
                  }
                  // Call original handler if exists
                  (menu.props as any).onKeyDown?.(e);
                },
                ref: menuRef,
              })}
            </MenuContext.Provider>
            <DismissButton onDismiss={state.close} />
          </div>
        </Popover>
      )}
    </>
  );
}

/**
 * Public SubMenuTrigger component that users interact with.
 * It just provides the getCollectionNode for the collection system.
 */
export function SubMenuTrigger(props: CubeSubMenuTriggerProps) {
  // This component is never actually rendered directly.
  // The collection system uses getCollectionNode to build the menu.
  return null;
}

// Allow React Stately collection builder to treat SubMenuTrigger as an Item
(SubMenuTrigger as any).getCollectionNode = function* (
  props: CubeSubMenuTriggerProps,
) {
  const [trigger, menu] = React.Children.toArray(
    props.children,
  ) as ReactElement[];

  // Yield a collection node that tells the Menu to wrap this item with InternalSubMenuTrigger
  yield {
    element: trigger,
    wrapper: (element: ReactElement) => (
      <InternalSubMenuTrigger
        key={element.key || undefined}
        targetKey={element.key || undefined}
        {...props}
      >
        {element}
        {menu}
      </InternalSubMenuTrigger>
    ),
  };
};

SubMenuTrigger.displayName = 'SubMenuTrigger';
