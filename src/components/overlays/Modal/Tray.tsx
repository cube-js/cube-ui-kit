import { useObjectRef } from '@react-aria/utils';
import { BaseProps, Styles, tasty } from '@tenphi/tasty';
import { ForwardedRef, forwardRef, ReactNode } from 'react';
import {
  AriaOverlayProps,
  useModal,
  useOverlay,
  usePreventScroll,
} from 'react-aria';

import { mergeProps } from '../../../utils/react';
import { useOverlayEscapeGuard } from '../../../utils/react/useOverlayEscapeGuard';

import { OVERLAY_WRAPPER_STYLES } from './Modal';
import { CubeOverlayProps, Overlay } from './Overlay';
import { TransitionState } from './types';
import { Underlay } from './Underlay';

import type { Props } from '../../../props';

const TrayWrapperElement = tasty({
  qa: 'TrayWrapper',
  styles: {
    // eslint-disable-next-line tasty/no-style-spread -- overlay wrapper base shared with ModalWrapper
    ...OVERLAY_WRAPPER_STYLES,
    placeContent: 'end center',
    placeItems: 'end center',
  },
});

const TrayElement = tasty({
  styles: {
    display: 'initial',
    hide: {
      '': true,
      'enter | entered': false,
      exit: false,
      unmounted: true,
    },
    zIndex: 10,
    height: 'max 90dvh',
    width: '$min-dialog-size 90vw',
    pointerEvents: 'auto',
    transition:
      'transform .25s ease-in-out, opacity .25s linear, visibility 0ms linear',
    opacity: {
      '': 0,
      open: '.9999',
    },
  },
});

export interface CubeTrayProps extends AriaOverlayProps, CubeOverlayProps {
  container?: HTMLElement;
  qa?: BaseProps['qa'];
  onClose?: (action?: string) => void;
  isFixedHeight?: boolean;
  isNonModal?: boolean;
  styles?: Styles;
  children?: ReactNode;
  isKeyboardDismissDisabled?: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  defaultOpen?: boolean;
  /**
   * Predicate that decides whether the overlay should close in response to an
   * interaction outside of it. When the function returns `false`, react-aria's
   * `useOverlay` no longer calls `stopPropagation`/`preventDefault` on the
   * outside event, which lets sibling triggers receive the click.
   */
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
}

interface CubeTrayWrapperProps extends CubeTrayProps, TransitionState {
  isOpen?: boolean;
  overlayProps?: Props;
}

function Tray(props: CubeTrayProps, ref: ForwardedRef<HTMLElement>) {
  let {
    qa,
    children,
    onClose,
    isFixedHeight,
    isNonModal,
    styles,
    shouldCloseOnInteractOutside,
    ...otherProps
  } = props;
  let domRef = useObjectRef(ref);

  let { overlayProps: rawOverlayProps, underlayProps } = useOverlay(
    { ...props, isDismissable: true, shouldCloseOnInteractOutside },
    domRef,
  );

  // Same as `Modal`: a tray pressed while it closes must not take `Escape`.
  const overlayProps = useOverlayEscapeGuard(rawOverlayProps, props.isOpen);

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
          enter: transitionState === 'enter',
          exit: transitionState === 'exit',
          unmounted: transitionState === 'unmounted',
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

_Tray.displayName = 'Tray';

export { _Tray as Tray };
