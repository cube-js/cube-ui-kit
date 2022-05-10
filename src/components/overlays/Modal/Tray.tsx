import { useDOMRef } from '@react-spectrum/utils';
import { useViewportSize } from '@react-aria/utils';
import { Overlay } from './Overlay';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { Underlay } from './Underlay';
import { useModal, useOverlay, usePreventScroll } from '@react-aria/overlays';
import { OVERLAY_WRAPPER_STYLES } from './Modal';
import { Base } from '../../Base';
import { useContextStyles } from '../../../tasty/providers/StylesProvider';
import { Styles } from '../../../tasty/styles/types';
import { BaseProps, Props } from '../../../tasty/types';
import { mergeProps } from '../../../utils/react';
import type { TrayProps } from '@react-types/overlays';

const TRAY_STYLES: Styles = {
  zIndex: 2,
  height: 'max (@cube-visual-viewport-height * .9)',
  width: '288px 90vw',
  pointerEvents: 'auto',
  transition:
    'transform .25s ease-in-out, opacity .25s linear, visibility 0ms linear',
  opacity: {
    '': 0,
    open: '.9999',
  },
};

export interface CubeTrayProps extends TrayProps {
  container?: HTMLElement;
  qa?: BaseProps['qa'];
  onClose?: (action?: string) => void;
  isFixedHeight?: boolean;
  isNonModal?: boolean;
  styles?: Styles;
}

interface CubeTrayWrapperProps extends CubeTrayProps {
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
        qa={qa}
        onClose={onClose}
        ref={domRef}
        overlayProps={overlayProps}
        isFixedHeight={isFixedHeight}
        isNonModal={isNonModal}
        styles={styles}
      >
        {children}
      </TrayWrapper>
    </Overlay>
  );
}

let TrayWrapper = forwardRef(function (props: CubeTrayWrapperProps, ref) {
  let {
    qa,
    children,
    isOpen,
    styles,
    isFixedHeight,
    isNonModal,
    overlayProps,
    ...otherProps
  } = props;
  usePreventScroll();
  let { modalProps } = useModal({
    isDisabled: isNonModal,
  });

  styles = {
    ...TRAY_STYLES,
    ...useContextStyles('Tray', props),
    ...styles,
  };

  // We need to measure the window's height in JS rather than using percentages in CSS
  // so that contents (e.g. menu) can inherit the max-height properly. Using percentages
  // does not work properly because there is nothing to base the percentage on.
  // We cannot use vh units because mobile browsers adjust the window height dynamically
  // when the address bar/bottom toolbars show and hide on scroll and vh units are fixed.
  // Also, the visual viewport is smaller than the layout viewport when the virtual keyboard
  // is up, so use the VisualViewport API to ensure the tray is displayed above the keyboard.
  let viewport = useViewportSize();
  let [height, setHeight] = useState(viewport.height);
  let timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // When the height is decreasing, and the keyboard is visible
    // (visual viewport smaller than layout viewport), delay setting
    // the new max height until after the animation is complete
    // so that there isn't an empty space under the tray briefly.
    if (viewport.height < height && viewport.height < window.innerHeight) {
      timeoutRef.current = setTimeout(() => {
        setHeight(viewport.height);
      }, 500);
    } else {
      setHeight(viewport.height);
    }
  }, [height, viewport.height]);

  let wrapperStyle = {
    '--cube-visual-viewport-height': height + 'px',
  };

  let domProps = mergeProps(otherProps, overlayProps);

  return (
    <Base
      qa="TrayWrapper"
      mods={{
        open: isOpen,
      }}
      styles={{
        ...OVERLAY_WRAPPER_STYLES,
        placeContent: 'end center',
        placeItems: 'end center',
      }}
      style={wrapperStyle}
    >
      <Base
        qa={qa || 'Tray'}
        styles={styles}
        mods={{
          open: isOpen,
          'fixed-height': isFixedHeight,
        }}
        {...domProps}
        {...modalProps}
        ref={ref}
      >
        {children}
      </Base>
    </Base>
  );
});

let _Tray = forwardRef(Tray);
export { _Tray as Tray };
