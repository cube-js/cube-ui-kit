import { mergeProps } from '../../../utils/react';
import { Overlay } from './Overlay';
import { forwardRef, HTMLAttributes } from 'react';
import { useModal, useOverlay } from '@react-aria/overlays';
import { Base } from '../../Base';
import { useContextStyles } from '../../../providers/StylesProvider';
import { OverlayProps } from '@react-types/overlays';
import { BaseProps } from '../../types';
import { PlacementAxis } from '../../../shared';
import { Styles } from '../../../styles/types';

const POPOVER_STYLES: Styles = {
  pointerEvents: 'auto',
  position: 'absolute',
  transition:
    'opacity .120s linear, visibility 0ms linear, transform .120s ease-in-out',
  transform: {
    '': 'scale(1, .9)',
    open: 'scale(1, 1)',
  },
  opacity: {
    '': 0,
    open: '.9999',
  },
  transformOrigin: {
    '': 'top center',
    '[data-placement="top"]': 'bottom center',
  },
};

export interface CubePopoverProps
  extends BaseProps,
    Omit<OverlayProps, 'children'> {
  container?: HTMLElement;
  placement?: PlacementAxis;
  arrowProps?: HTMLAttributes<HTMLElement>;
  hideArrow?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  shouldCloseOnBlur?: boolean;
  isNonModal?: boolean;
  isDismissable?: boolean;
}

function Popover(props: CubePopoverProps, ref) {
  let {
    qa,
    style,
    styles,
    children,
    placement,
    arrowProps,
    onClose,
    shouldCloseOnBlur,
    isKeyboardDismissDisabled,
    isNonModal,
    isDismissable = true,
    ...otherProps
  } = props;

  return (
    <Overlay {...otherProps}>
      <PopoverWrapper
        qa={qa}
        ref={ref}
        style={style}
        styles={styles}
        placement={placement}
        arrowProps={arrowProps}
        onClose={onClose}
        shouldCloseOnBlur={shouldCloseOnBlur}
        isKeyboardDismissDisabled={isKeyboardDismissDisabled}
        isNonModal={isNonModal}
        isDismissable={isDismissable}
      >
        {children}
      </PopoverWrapper>
    </Overlay>
  );
}

const PopoverWrapper = forwardRef((props: CubePopoverProps, ref) => {
  let {
    qa,
    children,
    placement = 'bottom',
    arrowProps,
    isOpen,
    style,
    styles,
    shouldCloseOnBlur,
    isKeyboardDismissDisabled,
    isNonModal,
    isDismissable,
    ...otherProps
  } = props;
  let { overlayProps } = useOverlay(
    { ...props, isDismissable: isDismissable && isOpen },
    // @ts-ignore
    ref,
  );
  let { modalProps } = useModal({
    isDisabled: isNonModal,
  });

  styles = {
    ...POPOVER_STYLES,
    ...useContextStyles('Popover', props),
    ...styles,
  };

  return (
    <Base
      qa={qa || 'Popover'}
      {...mergeProps(otherProps, overlayProps, modalProps)}
      styles={styles}
      ref={ref}
      mods={{
        open: isOpen,
      }}
      data-placement={placement}
      role="presentation"
      style={style}
    >
      {children}
    </Base>
  );
});

let _Popover = forwardRef(Popover);
export { _Popover as Popover };
