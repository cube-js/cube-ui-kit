import { PressResponder } from '@react-aria/interactions';
import { useDOMRef, useIsMobileDevice } from '@react-spectrum/utils';
import { DOMRef } from '@react-types/shared';
import {
  forwardRef,
  Fragment,
  ReactElement,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  AriaMenuTriggerProps,
  DismissButton,
  Placement,
  PositionProps,
  useMenuTrigger,
  useOverlayPosition,
} from 'react-aria';
import { MenuTriggerState, useMenuTriggerState } from 'react-stately';

import { generateRandomId } from '../../../utils/random';
import { SlotProvider } from '../../../utils/react';
import { useEventBus } from '../../../utils/react/useEventBus';
import { Popover, Tray } from '../../overlays/Modal';

import { MenuContext, MenuContextValue } from './context';

export type { AriaMenuTriggerProps };

export type CubeMenuTriggerProps = AriaMenuTriggerProps &
  PositionProps & {
    isDisabled?: boolean;
    children: [
      ReactElement | ((state: MenuTriggerState) => ReactElement),
      ReactElement,
    ];

    closeOnSelect?: boolean;
    isDummy?: boolean;
  };

function MenuTrigger(props: CubeMenuTriggerProps, ref: DOMRef<HTMLElement>) {
  const menuPopoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>();
  const domRef = useDOMRef(ref);
  const menuTriggerRef = props.targetRef || domRef || triggerRef;
  const menuRef = useRef<HTMLUListElement>(null);
  const {
    children,
    shouldFlip = true,
    closeOnSelect,
    trigger = 'press',
    isDisabled,
    isDummy,
  } = props;

  // Generate a unique ID for this menu instance
  const menuId = useMemo(() => generateRandomId(), []);

  // Get event bus for menu synchronization
  const { emit, on } = useEventBus();

  if (!Array.isArray(children) || children.length > 2) {
    throw new Error('MenuTrigger must have exactly 2 children');
  }

  let [menuTrigger, menu] = children;
  const state: MenuTriggerState = useMenuTriggerState(props);

  // Listen for other menus opening and close this one if needed
  useEffect(() => {
    const unsubscribe = on('menu:open', (data: { menuId: string }) => {
      // If another menu is opening and this menu is open, close this one
      if (data.menuId !== menuId && state.isOpen && !isDummy) {
        state.close();
      }
    });

    return unsubscribe;
  }, [on, menuId, state]);

  // Emit event when this menu opens
  useEffect(() => {
    if (state.isOpen && !isDummy) {
      emit('menu:open', { menuId });
    }
  }, [state.isOpen, emit, menuId, isDummy]);

  if (typeof menuTrigger === 'function') {
    menuTrigger = (menuTrigger as CubeMenuTriggerProps['children'][0])(state);
  }

  const { menuTriggerProps, menuProps } = useMenuTrigger(
    { isDisabled },
    state,
    menuTriggerRef,
  );

  let initialPlacement: Placement = props.placement ?? 'bottom start';

  const isMobile = useIsMobileDevice();
  const { overlayProps: positionProps, placement } = useOverlayPosition({
    targetRef: menuTriggerRef,
    overlayRef: menuPopoverRef,
    scrollRef: menuRef,
    placement: initialPlacement,
    shouldFlip: shouldFlip,
    isOpen: state.isOpen && !isMobile,
    onClose: state.close,
    containerPadding: props.containerPadding,
    offset: props.offset ?? 8,
    crossOffset: props.crossOffset ?? 0,
  });

  const menuContext = {
    ...menuProps,
    ref: menuRef,
    onClose: state.close,
    closeOnSelect,
    autoFocus: (state.focusStrategy as any) ?? 'first',
    style: isMobile
      ? {
        width: '100%',
        maxHeight: 'inherit',
      }
      : undefined,
    mods: {
      popover: !isMobile,
      tray: isMobile,
    },
    isClosing: !state.isOpen,
  } as MenuContextValue;

  const contents = (
    <>
      <DismissButton onDismiss={state.close} />
      {menu}
      <DismissButton onDismiss={state.close} />
    </>
  );

  // On small screen devices, the menu is rendered in a tray, otherwise a popover.
  let overlay;
  if (isMobile) {
    overlay = (
      <Tray isOpen={state.isOpen} onClose={state.close}>
        {contents}
      </Tray>
    );
  } else {
    overlay = (
      <Popover
        ref={menuPopoverRef}
        hideArrow
        isNonModal
        isOpen={state.isOpen}
        style={positionProps.style}
        placement={placement}
        shouldCloseOnInteractOutside={(el) => {
          const menuTriggerEl = el.closest('[data-menu-trigger]');
          // If no menu trigger was clicked, allow closing
          if (!menuTriggerEl) return true;
          // For dummy triggers (like useAnchoredMenu), check if the clicked element
          // is the target element or its descendant
          if (
            isDummy &&
            (menuTriggerEl === menuTriggerRef.current ||
              menuTriggerRef.current?.contains(el))
          ) {
            return true;
          }
          // If the same trigger that opened this menu was clicked, allow closing
          if (menuTriggerEl === menuTriggerRef.current) return true;
          // Otherwise, don't close (let event mechanism handle it)
          return false;
        }}
        onClose={state.close}
      >
        {contents}
      </Popover>
    );
  }

  return (
    <Fragment>
      <SlotProvider
        slots={{ actionButton: { holdAffordance: trigger === 'longPress' } }}
      >
        {!isDummy ? (
          <PressResponder
            {...menuTriggerProps}
            ref={menuTriggerRef}
            data-menu-trigger
            isPressed={state.isOpen}
          >
            {menuTrigger}
          </PressResponder>
        ) : null}
      </SlotProvider>
      <MenuContext.Provider value={menuContext}>{overlay}</MenuContext.Provider>
    </Fragment>
  );
}

/**
 * The MenuTrigger serves as a wrapper around a Menu and its associated trigger,
 * linking the Menu's open state with the trigger's press state.
 */
let _MenuTrigger = forwardRef(MenuTrigger);

_MenuTrigger.displayName = 'MenuTrigger';

export { _MenuTrigger as MenuTrigger };
