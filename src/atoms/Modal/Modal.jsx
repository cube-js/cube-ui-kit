import { useDOMRef } from '@react-spectrum/utils';
import { mergeProps, useViewportSize } from '@react-aria/utils';
import { Overlay } from './Overlay';
import React, { forwardRef } from 'react';
import { Underlay } from './Underlay';
import { useModal, useOverlay, usePreventScroll } from '@react-aria/overlays';
import { Base } from '../../components/Base';
import { useContextStyles } from '../../providers/Styles';

export const OVERLAY_WRAPPER_STYLES = {
  position: 'fixed',
  display: 'grid',
  left: 0,
  top: 0,
  items: {
    '': 'center',
    '[data-type="fullscreen"]': 'center',
    '[data-type="fullscreenTakeover"]': 'stretch',
  },
  boxSizing: 'border-box',
  width: '100vw',
  height: '@cube-visual-viewport-height',
  pointerEvents: 'none',
  z: 2,
  transition: 'visibility 0ms linear .13s',
};

const MODAL_STYLES = {
  display: 'grid',
  z: 2,
  height: {
    '': 'max (@cube-visual-viewport-height * .9)',
    '[data-type="fullscreen"]': '(@cube-visual-viewport-height * .9) (@cube-visual-viewport-height * .9)',
    '[data-type="fullscreenTakeover"]': '@cube-visual-viewport-height @cube-visual-viewport-height',
  },
  width: {
    width: '288px 90vw',
  },
  pointerEvents: 'auto',
  transition: 'opacity .25s linear, visibility 0ms linear, transform .25s ease-in-out',
  transform: {
    '': 'translate(0, -3x)',
    open: 'translate(0, 0)',
  },
  opacity: {
    '': 0,
    open: '.9999',
  },
};

function Modal(props, ref) {
  let { qa, children, onClose, type, styles, ...otherProps } = props;
  let domRef = useDOMRef(ref);

  let { overlayProps, underlayProps } = useOverlay(props, domRef);

  return (
    <Overlay {...otherProps}>
      <Underlay {...underlayProps} />
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

let typeMap = {
  fullscreen: 'fullscreen',
  fullscreenTakeover: 'fullscreenTakeover'
};

let ModalWrapper = forwardRef(function (props, ref) {
  let { qa, children, isOpen, type, styles, overlayProps, ...otherProps } = props;
  let typeVariant = typeMap[type];

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
      data-type={typeVariant}
      styles={OVERLAY_WRAPPER_STYLES}
      style={style}
    >
      <Base
        qa={qa || 'Modal'}
        styles={styles}
        mods={{ open: isOpen }}
        data-type={typeVariant}
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
