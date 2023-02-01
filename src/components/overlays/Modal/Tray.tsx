import { useDOMRef } from '@react-spectrum/utils';
import { forwardRef } from 'react';
import { useModal, useOverlay, usePreventScroll } from '@react-aria/overlays';

import { BaseProps, Props, Styles, tasty } from '../../../tasty';
import { mergeProps } from '../../../utils/react';

import { OVERLAY_WRAPPER_STYLES } from './Modal';
import { Underlay } from './Underlay';
import { Overlay } from './Overlay';
import { TransitionState, WithCloseBehavior } from './types';

import type { TrayProps } from '@react-types/overlays';

const TrayWrapperElement = tasty({
  qa: 'TrayWrapper',
  styles: {
    ...OVERLAY_WRAPPER_STYLES,
    placeContent: 'end center',
    placeItems: 'end center',
  },
});

const TrayElement = tasty({
  styles: {
    display: {
      '': 'none',
      'entering | entered': 'initial',
      exiting: 'initial',
      exited: 'none',
    },
    zIndex: 2,
    height: 'max 90dvh',
    width: '288px 90vw',
    pointerEvents: 'auto',
    transition:
      'transform .25s ease-in-out, opacity .25s linear, visibility 0ms linear',
    opacity: {
      '': 0,
      open: '.9999',
    },
  },
});

export interface CubeTrayProps extends TrayProps, WithCloseBehavior {
  container?: HTMLElement;
  qa?: BaseProps['qa'];
  onClose?: (action?: string) => void;
  isFixedHeight?: boolean;
  isNonModal?: boolean;
  styles?: Styles;
}

interface CubeTrayWrapperProps extends CubeTrayProps, TransitionState {
  isOpen?: boolean;
  overlayProps?: Props;
}

function Tray(props: CubeTrayProps, ref) {
  let {
    qa,
    children,
    onClose,
    isFixedHeight,
    isNonModal,
    styles,
    ...otherProps
  } = props;
  let domRef = useDOMRef(ref);

  let { overlayProps, underlayProps } = useOverlay(
    { ...props, isDismissable: true },
    domRef,
  );

  return (
    <Overlay {...otherProps}>
      <Underlay {...underlayProps} />
      <TrayWrapper
        ref={domRef}
        qa={qa}
        overlayProps={overlayProps}
        isFixedHeight={isFixedHeight}
        isNonModal={isNonModal}
        styles={styles}
        onClose={onClose}
      >
        {children}
      </TrayWrapper>
    </Overlay>
  );
}

let TrayWrapper = forwardRef(function TrayWrapper(
  props: CubeTrayWrapperProps,
  ref,
) {
  let {
    qa,
    children,
    isOpen,
    styles,
    isFixedHeight,
    isNonModal,
    overlayProps,
    transitionState,
    ...otherProps
  } = props;
  usePreventScroll();
  let { modalProps } = useModal({
    isDisabled: isNonModal,
  });

  let domProps = mergeProps(otherProps, overlayProps);

  return (
    <TrayWrapperElement
      mods={{
        open: isOpen,
      }}
    >
      <TrayElement
        qa={qa || 'Tray'}
        styles={styles}
        mods={{
          open: isOpen,
          entering: transitionState === 'entering',
          exiting: transitionState === 'exiting',
          exited: transitionState === 'exited',
          entered: transitionState === 'entered',
          'fixed-height': isFixedHeight,
        }}
        {...domProps}
        {...modalProps}
        ref={ref}
      >
        {children}
      </TrayElement>
    </TrayWrapperElement>
  );
});

let _Tray = forwardRef(Tray);
export { _Tray as Tray };
