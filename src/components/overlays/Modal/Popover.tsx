import { useObjectRef } from '@react-aria/utils';
import { BaseProps, tasty } from '@tenphi/tasty';
import { ForwardedRef, forwardRef, HTMLAttributes } from 'react';
import { AriaOverlayProps, useModal, useOverlay } from 'react-aria';

import { PlacementAxis } from '../../../shared';
import { mergeProps } from '../../../utils/react';
import { useOverlayEscapeGuard } from '../../../utils/react/useOverlayEscapeGuard';

import { CubeOverlayProps, Overlay } from './Overlay';
import { TransitionState } from './types';

import type { Props } from '../../../props';

const PopoverElement = tasty({
  role: 'presentation',
  styles: {
    display: 'initial',
    hide: {
      '': true,
      'enter | entered': false,
      exit: false,
      unmounted: true,
    },
    pointerEvents: 'auto',
    position: 'absolute',
    transition:
      'opacity $disclosure-transition linear, visibility 0ms linear, transform $disclosure-transition ease-in-out',
    transform: {
      '': 'scale(1, .9)',
      open: 'initial',
    },
    opacity: {
      '': 0,
      open: '.9999',
    },
    transformOrigin: {
      '': 'top center',
      '[data-placement="top"]': 'bottom center',
    },
  },
});

export interface CubePopoverProps
  extends BaseProps,
    AriaOverlayProps,
    CubeOverlayProps,
    TransitionState {
  container?: HTMLElement;
  placement?: PlacementAxis;
  arrowProps?: HTMLAttributes<HTMLElement>;
  hideArrow?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  shouldCloseOnBlur?: boolean;
  isNonModal?: boolean;
  isDismissable?: boolean;
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
}

function Popover(props: CubePopoverProps, ref: ForwardedRef<HTMLElement>) {
  let {
    qa,
    style,
    styles,
    children,
    placement,
    arrowProps,
    isNonModal,
    isDismissable = true,
    ...otherProps
  } = props;

  let domRef = useObjectRef(ref);

  // `useOverlay` has to run here rather than inside `PopoverWrapper`, on the
  // *logical* open state — `Overlay` hands its child an `isOpen` that only
  // turns true once the enter animation has settled. Registering the overlay
  // that late leaves it out of React Aria's visible-overlay stack for the first
  // frames, and `Escape` silently does nothing until the popover finishes
  // animating in. `Modal` and `Tray` call it from the same place for the same
  // reason.
  let { overlayProps: rawOverlayProps } = useOverlay(
    { ...props, isDismissable: isDismissable && props.isOpen },
    domRef,
  );

  // ...and a popover that has already closed must not answer for `Escape`
  // while it animates out — see `useOverlayEscapeGuard`.
  const overlayProps = useOverlayEscapeGuard(rawOverlayProps, props.isOpen);

  return (
    <Overlay {...otherProps}>
      <PopoverWrapper
        ref={domRef}
        qa={qa}
        style={style}
        styles={styles}
        placement={placement}
        arrowProps={arrowProps}
        isNonModal={isNonModal}
        overlayProps={overlayProps}
      >
        {children}
      </PopoverWrapper>
    </Overlay>
  );
}

interface PopoverWrapperProps
  extends Omit<CubePopoverProps, 'isDismissable'>,
    TransitionState {
  overlayProps?: Props;
}

const PopoverWrapper = forwardRef(function PopoverWrapper(
  props: PopoverWrapperProps,
  ref,
) {
  let {
    qa,
    children,
    placement = 'bottom',
    arrowProps,
    // `isOpen` here is the transition's settled state, not the trigger's — it
    // drives the enter/exit styles only.
    isOpen,
    style,
    styles,
    isNonModal,
    transitionState,
    overlayProps,
    ...otherProps
  } = props;
  let { modalProps } = useModal({
    isDisabled: isNonModal,
  });

  return (
    <PopoverElement
      qa={qa || 'Popover'}
      {...mergeProps(otherProps, overlayProps, modalProps)}
      ref={ref}
      styles={styles}
      mods={{
        open: isOpen,
        enter: transitionState === 'enter',
        exit: transitionState === 'exit',
        unmounted: transitionState === 'unmounted',
        entered: transitionState === 'entered',
      }}
      data-placement={placement}
      style={style}
    >
      {children}
    </PopoverElement>
  );
});

const _Popover = forwardRef(Popover);

_Popover.displayName = 'Popover';

export { _Popover as Popover };
