import { PressResponder } from '@react-aria/interactions';
import { useDOMRef, useIsMobileDevice } from '@react-spectrum/utils';
import { DOMRef } from '@react-types/shared';
import {
  forwardRef,
  Fragment,
  ReactElement,
  useCallback,
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
import { usePopoverSync } from '../../../utils/react/usePopoverSync';
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
    /**
     * Overlay variant to use on mobile screens. Defaults to `'popover'`, which
     * keeps the desktop overlay even on small viewports. Pass `'tray'` to opt
     * into the bottom-sheet `Tray` overlay on mobile (the previous implicit
     * default). Mirrors the `mobileType` API on `DialogTrigger`.
     */
    mobileType?: 'popover' | 'tray';
  };

function MenuTrigger(props: CubeMenuTriggerProps, ref: DOMRef<HTMLElement>) {
  const menuPopoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const domRef = useDOMRef(ref);
  const menuTriggerRef = props.targetRef || domRef || triggerRef;
  const menuRef = useRef<HTMLUListElement>(null);
  const wasOpenRef = useRef(false);
  const {
    children,
    shouldFlip = true,
    closeOnSelect,
    trigger = 'press',
    isDisabled,
    isDummy,
    mobileType = 'popover',
  } = props;

  // Generate a unique ID for this menu instance
  const menuId = useMemo(() => generateRandomId(), []);

  if (!Array.isArray(children) || children.length > 2) {
    throw new Error('MenuTrigger must have exactly 2 children');
  }

  let [menuTrigger, menu] = children;
  const state: MenuTriggerState = useMenuTriggerState(props);

  usePopoverSync({
    menuId,
    isOpen: state.isOpen,
    onClose: () => state.close(),
    enabled: !isDummy,
  });

  // Restore focus manually when the menu closes
  useEffect(() => {
    if (!state.isOpen && wasOpenRef.current && !isDummy) {
      wasOpenRef.current = false;
      // Use setTimeout to ensure focus restoration happens after any animations
      setTimeout(() => {
        menuTriggerRef.current?.focus();
      }, 0);
    } else if (state.isOpen) {
      wasOpenRef.current = true;
    }
  }, [state.isOpen, menuTriggerRef, isDummy]);

  if (typeof menuTrigger === 'function') {
    menuTrigger = (menuTrigger as CubeMenuTriggerProps['children'][0])(state);
  }

  const { menuTriggerProps, menuProps } = useMenuTrigger(
    { isDisabled },
    state,
    menuTriggerRef,
  );

  let initialPlacement: Placement = props.placement ?? 'bottom start';

  // Tray rendering is now opt-in via `mobileType="tray"` (matches DialogTrigger).
  // Without that opt-in, MenuTrigger always renders a Popover so that environments
  // like jsdom (where `window.screen.width === 0` makes useIsMobileDevice() true)
  // don't accidentally swap in the tray overlay.
  const isMobileDevice = useIsMobileDevice();
  const isTray = mobileType === 'tray' && isMobileDevice;
  const { overlayProps: positionProps, placement } = useOverlayPosition({
    targetRef: menuTriggerRef,
    overlayRef: menuPopoverRef,
    scrollRef: menuRef,
    placement: initialPlacement,
    shouldFlip: shouldFlip,
    isOpen: state.isOpen && !isTray,
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
    style: isTray
      ? {
          width: '100%',
          maxHeight: 'inherit',
        }
      : undefined,
    mods: {
      popover: !isTray,
      tray: isTray,
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

  // Shared between the Popover and Tray branches so both react-aria `useOverlay`
  // calls see the same predicate. Without this, the Tray branch falls back to
  // unconditional dismiss-on-outside-interaction, which `useOverlay` translates
  // into stopPropagation/preventDefault in the capture phase — that swallows
  // clicks on sibling triggers (see Menu rapid-open test).
  //
  // We capture `state.isOpen` via a ref so the callback identity stays stable
  // across re-renders (it's passed to react-aria `useOverlay` whose listener
  // setup keys off the ref equality). The ref is read at click time so a menu
  // that is logically closed (`state.close()` already ran) but still mounted
  // inside the `Popover` exit transition does not block sibling-trigger clicks.
  const stateIsOpenRef = useRef(state.isOpen);
  useEffect(() => {
    stateIsOpenRef.current = state.isOpen;
  }, [state.isOpen]);
  const shouldCloseOnInteractOutside = useCallback(
    (el: Element) => {
      // While `Popover` is animating out, useOverlay's `useInteractOutside`
      // capture-phase listener is still attached (jsdom 29+ uses
      // pointerdown/click capture). Without this guard, clicks on a sibling
      // trigger get stopPropagation()'d during the 350ms exit window and the
      // sibling's `onClick` never runs — breaking rapid-open and "open menu
      // again with new props" flows.
      if (!stateIsOpenRef.current) return false;

      const menuTriggerEl = el.closest('[data-popover-trigger]');
      if (!menuTriggerEl) return true;
      if (
        isDummy &&
        (menuTriggerEl === menuTriggerRef.current ||
          menuTriggerRef.current?.contains(el))
      ) {
        return true;
      }
      if (menuTriggerEl === menuTriggerRef.current) return true;
      return false;
    },
    [isDummy, menuTriggerRef],
  );

  let overlay;
  if (isTray) {
    overlay = (
      <Tray
        isOpen={state.isOpen}
        shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
        onClose={state.close}
      >
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
        shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
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
            data-popover-trigger
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
