import { useDOMRef } from '@react-spectrum/utils';
import { useViewportSize } from '@react-aria/utils';
import { Overlay } from './Overlay';
import { forwardRef, ReactNode } from 'react';
import { Underlay } from './Underlay';
import { useModal, useOverlay, usePreventScroll } from '@react-aria/overlays';
import { Base } from '../../Base';
import { useContextStyles } from '../../../providers/StylesProvider';
import { Styles } from '../../../styles/types';
import { BaseProps, Props } from '../../types';
import { mergeProps } from '../../../utils/react';
import { ModalProps } from '@react-types/overlays';

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
  height: '@cube-visual-viewport-height',
  pointerEvents: 'none',
  zIndex: 2,
  transition: 'visibility 0ms linear .13s',
};

const MODAL_STYLES: Styles = {
  display: 'grid',
  zIndex: 2,
  height: {
    '': 'max (@cube-visual-viewport-height * .9)',
    '[data-type="fullscreenTakeover"] | [data-type="panel"]':
      '@cube-visual-viewport-height @cube-visual-viewport-height',
    '[data-type="fullscreen"]':
      '(@cube-visual-viewport-height * .9) (@cube-visual-viewport-height * .9)',
    '[data-type="fullscreenTakeover"]':
      '@cube-visual-viewport-height @cube-visual-viewport-height',
  },
  width: {
    width: '288px 90vw',
  },
  pointerEvents: 'none',
  transition:
    'opacity .25s linear, visibility 0ms linear, transform .25s ease-in-out',
  transform: {
    '': 'translate(0, 0) scale(1, 1)',
    '[data-type="modal"] & !open': 'translate(0, -3x) scale(1, 1)',
    '[data-type^="fullscreen"] & !open': 'translate(0, 0) scale(1.02, 1.02)',
  },
  opacity: {
    '': 0,
    open: '.9999',
  },
};

export interface CubeModalProps extends ModalProps {
  qa?: BaseProps['qa'];
  onClose?: () => void;
  type?: 'modal' | 'fullscreen' | 'fullscreenTakeover';
  styles?: Styles;
}

function Modal(props: CubeModalProps, ref) {
  let { qa, children, onClose, type, styles, ...otherProps } = props;
  let domRef = useDOMRef(ref);

  let { overlayProps, underlayProps } = useOverlay(props, domRef);

  return (
    <Overlay {...otherProps}>
      {type !== 'fullscreenTakeover' && <Underlay {...underlayProps} />}
      <ModalWrapper
        qa={qa}
        onClose={onClose}
        type={type}
        ref={domRef}
        overlayProps={overlayProps}
        styles={styles}
      >
        {children}
      </ModalWrapper>
    </Overlay>
  );
}

interface ModalWrapperProps {
  children?: ReactNode;
  qa?: BaseProps['qa'];
  isOpen?: boolean;
  type?: 'modal' | 'fullscreen' | 'fullscreenTakeover';
  placement?: 'top' | 'bottom';
  styles?: Styles;
  overlayProps?: Props;
  onClose?: () => void;
}

let ModalWrapper = forwardRef(function(props: ModalWrapperProps, ref) {
  let {
    qa,
    children,
    isOpen,
    type,
    placement,
    styles,
    overlayProps,
    ...otherProps
  } = props;

  styles = {
    ...MODAL_STYLES,
    ...useContextStyles('Modal', props),
    ...styles,
  };

  usePreventScroll();

  let { modalProps } = useModal();
  let viewport = useViewportSize();
  let style = {
    '--cube-visual-viewport-height': viewport.height + 'px',
  };

  return (
    <Base
      qa="ModalWrapper"
      mods={{ open: isOpen }}
      data-type={type}
      data-placement={placement}
      styles={OVERLAY_WRAPPER_STYLES}
      style={style}
    >
      <Base
        qa={qa || 'Modal'}
        styles={styles}
        mods={{ open: isOpen }}
        data-type={type}
        data-placement={placement}
        {...mergeProps(otherProps, overlayProps, modalProps)}
        ref={ref}
      >
        {children}
      </Base>
    </Base>
  );
});

let _Modal = forwardRef(Modal);
export { _Modal as Modal };
