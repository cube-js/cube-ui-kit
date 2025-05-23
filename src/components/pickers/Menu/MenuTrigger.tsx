import { PressResponder } from '@react-aria/interactions';
import { useDOMRef, useIsMobileDevice } from '@react-spectrum/utils';
import { DOMRef } from '@react-types/shared';
import { forwardRef, Fragment, ReactElement, useRef } from 'react';
import {
  AriaMenuTriggerProps,
  DismissButton,
  Placement,
  PositionProps,
  useMenuTrigger,
  useOverlayPosition,
} from 'react-aria';
import { MenuTriggerState, useMenuTriggerState } from 'react-stately';

import { SlotProvider } from '../../../utils/react';
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
    direction?: Placement;
    align?: 'start' | 'end';

    closeOnSelect?: boolean;
  };

function MenuTrigger(props: CubeMenuTriggerProps, ref: DOMRef<HTMLElement>) {
  const menuPopoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>();
  const domRef = useDOMRef(ref);
  const menuTriggerRef = domRef || triggerRef;
  const menuRef = useRef<HTMLUListElement>(null);
  const {
    children,
    align = 'start',
    shouldFlip = true,
    direction = 'bottom',
    closeOnSelect,
    trigger = 'press',
    isDisabled,
  } = props;

  if (!Array.isArray(children) || children.length > 2) {
    throw new Error('MenuTrigger must have exactly 2 children');
  }

  let [menuTrigger, menu] = children;
  const state: MenuTriggerState = useMenuTriggerState(props);

  if (typeof menuTrigger === 'function') {
    menuTrigger = (menuTrigger as CubeMenuTriggerProps['children'][0])(state);
  }

  const { menuTriggerProps, menuProps } = useMenuTrigger(
    { isDisabled },
    state,
    menuTriggerRef,
  );

  let initialPlacement: Placement;
  switch (direction) {
    case 'left':
    case 'right':
    case 'start':
    case 'end':
      initialPlacement = `${direction} ${
        align === 'end' ? 'bottom' : 'top'
      }` as Placement;
      break;
    case 'bottom':
    case 'top':
    default:
      initialPlacement = `${direction} ${align}` as Placement;
  }

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
    offset: props.offset || 8,
    crossOffset: props.crossOffset,
  });

  const menuContext = {
    ...menuProps,
    ref: menuRef,
    onClose: state.close,
    closeOnSelect,
    autoFocus: state.focusStrategy || true,
    style: isMobile
      ? {
          width: '100%',
          maxHeight: 'inherit',
        }
      : undefined,
    mods: {
      popover: !isMobile,
    },
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
        <PressResponder
          {...menuTriggerProps}
          ref={menuTriggerRef}
          isPressed={state.isOpen}
        >
          {menuTrigger}
        </PressResponder>
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
