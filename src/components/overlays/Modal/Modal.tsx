import { useDOMRef } from '@react-spectrum/utils';
import { forwardRef, ReactNode } from 'react';
import { useModal, useOverlay, usePreventScroll } from '@react-aria/overlays';

import { BaseProps, Props, Styles, tasty } from '../../../tasty';
import { mergeProps } from '../../../utils/react';

import { Underlay } from './Underlay';
import { Overlay } from './Overlay';
import { TransitionState, WithCloseBehavior } from './types';

import type { ModalProps } from '@react-types/overlays';

export const OVERLAY_WRAPPER_STYLES: Styles = {
  position: 'fixed',
  display: 'grid',
  left: 0,
  top: 0,
  placeItems: {
    '': 'center',
    '[data-type="fullscreen"]': 'center',
    '[data-type="fullscreenTakeover"] | [data-type="panel"]': 'stretch',
  },
  boxSizing: 'border-box',
  width: '100vw',
  height: '100dvh',
  pointerEvents: 'none',
  zIndex: 2,
  transition: {
    '': 'visibility .5s steps(2, start)',
    open: 'visibility 0s linear',
  },
};

const ModalWrapperElement = tasty({
  qa: 'ModalWrapper',
  styles: OVERLAY_WRAPPER_STYLES,
});

const ModalElement = tasty({
  styles: {
    display: {
      '': 'none',
      'entering | entered': 'grid',
      exiting: 'grid',
      exited: 'none',
    },
    zIndex: 2,
    height: {
      '': 'max 90dvh',
      '[data-type="fullscreenTakeover"] | [data-type="panel"]': '100dvh 100dvh',
      '[data-type="fullscreen"]': '90dvh 90dvh',
      '[data-type="fullscreenTakeover"]': '100dvh 100dvh',
    },
    width: {
      width: '288px 90vw',
    },
    pointerEvents: 'none',
    transition: 'opacity .25s linear, transform .25s ease-in-out',
    transform: {
      '': 'translate(0, 0) scale(1, 1)',
      '[data-type="modal"] & !open': 'translate(0, -3x) scale(1, 1)',
      '[data-type^="fullscreen"] & !open': 'translate(0, 0) scale(1.02, 1.02)',
    },
    opacity: {
      '': 0,
      open: 0.9999,
    },
  },
});

export interface CubeModalProps
  extends Omit<ModalProps, 'container'>,
    WithCloseBehavior {
  container?: HTMLElement;
  qa?: BaseProps['qa'];
  onClose?: (action?: string) => void;
  type?: 'modal' | 'fullscreen' | 'fullscreenTakeover';
  styles?: Styles;
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
}

function Modal(props: CubeModalProps, ref) {
  let { qa, children, onClose, type, styles, ...otherProps } = props;
  let domRef = useDOMRef(ref);

  let { overlayProps, underlayProps } = useOverlay({ ...props }, domRef);

  return (
    <Overlay {...otherProps}>
      {type !== 'fullscreenTakeover' && <Underlay {...underlayProps} />}
      <ModalWrapper
        ref={domRef}
        qa={qa}
        type={type}
        overlayProps={overlayProps}
        styles={styles}
        onClose={onClose}
      >
        {children}
      </ModalWrapper>
    </Overlay>
  );
}

interface ModalWrapperProps extends TransitionState {
  children?: ReactNode;
  qa?: BaseProps['qa'];
  isOpen?: boolean;
  type?: 'modal' | 'fullscreen' | 'fullscreenTakeover';
  placement?: 'top' | 'bottom';
  styles?: Styles;
  overlayProps?: Props;
  onClose?: () => void;
}

let ModalWrapper = forwardRef(function ModalWrapper(
  props: ModalWrapperProps,
  ref,
) {
  let {
    qa,
    children,
    isOpen,
    type,
    placement,
    styles,
    overlayProps,
    transitionState,
    ...otherProps
  } = props;

  usePreventScroll({ isDisabled: transitionState !== 'entered' });

  let { modalProps } = useModal({ isDisabled: transitionState !== 'entered' });

  return (
    <ModalWrapperElement data-type={type} data-placement={placement}>
      <ModalElement
        qa={qa || 'Modal'}
        styles={styles}
        mods={{
          open: isOpen,
          entering: transitionState === 'entering',
          exiting: transitionState === 'exiting',
          exited: transitionState === 'exited',
          entered: transitionState === 'entered',
        }}
        data-type={type}
        data-placement={placement}
        {...mergeProps(otherProps, overlayProps, modalProps)}
        ref={ref}
      >
        {children}
      </ModalElement>
    </ModalWrapperElement>
  );
});

let _Modal = forwardRef(Modal);
export { _Modal as Modal };
