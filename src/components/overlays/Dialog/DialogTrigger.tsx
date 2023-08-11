import { Fragment, ReactElement, RefObject, useEffect, useRef } from 'react';
import { useOverlayTriggerState } from '@react-stately/overlays';
import { PressResponder } from '@react-aria/interactions';
import { useMediaQuery } from '@react-spectrum/utils';
import { useOverlayPosition, useOverlayTrigger } from '@react-aria/overlays';
import { OverlayTriggerProps, PositionProps } from '@react-types/overlays';

import { Modal, Popover, Tray, WithCloseBehavior } from '../Modal';
import { Styles } from '../../../tasty';

import { DialogContext } from './context';

export type CubeDialogClose = (close: () => void) => ReactElement;

export interface CubeDialogTriggerProps
  extends OverlayTriggerProps,
    PositionProps,
    WithCloseBehavior {
  /** The Dialog and its trigger element. See the DialogTrigger [Content section](#content) for more information on what to provide as children. */
  children: [ReactElement, CubeDialogClose | ReactElement];
  /**
   * The type of Dialog that should be rendered. See the DialogTrigger [types section](#dialog-types) for an explanation on each.
   * @default 'modal'
   */
  type?:
    | 'modal'
    | 'popover'
    | 'tray'
    | 'fullscreen'
    | 'fullscreenTakeover'
    | 'panel';
  /** The type of Dialog that should be rendered when on a mobile device. See DialogTrigger [types section](#dialog-types) for an explanation on each. */
  mobileType?: 'modal' | 'tray' | 'fullscreen' | 'fullscreenTakeover' | 'panel';
  /**
   * Whether a popover type Dialog's arrow should be hidden.
   */
  hideArrow?: boolean;
  /** The ref of the element the Dialog should visually attach itself to. Defaults to the trigger button if not defined. */
  targetRef?: RefObject<HTMLElement>;
  /** Whether a modal type Dialog should be dismissible. */
  isDismissable?: boolean;
  /** Whether pressing the escape key to close the dialog should be disabled. */
  isKeyboardDismissDisabled?: boolean;
  /** The screen breakpoint for the mobile type */
  mobileViewport?: number;
  /** The style map for the overlay **/
  styles?: Styles;
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
  onDismiss?: (action?: string) => void;
}

function DialogTrigger(props: CubeDialogTriggerProps) {
  let {
    children,
    type = 'modal',
    mobileType = type === 'popover' ? 'modal' : type,
    hideArrow,
    targetRef,
    onDismiss,
    isDismissable = true,
    isKeyboardDismissDisabled,
    styles,
    mobileViewport = 700,
    hideOnClose,
    shouldCloseOnInteractOutside,
    ...positionProps
  } = props;

  if (!Array.isArray(children) || children.length > 2) {
    throw new Error('DialogTrigger must have exactly 2 children');
  }
  // if a function is passed as the second child, it won't appear in toArray
  let [trigger, content] = children;

  // On small devices, show a modal or tray instead of a popover.
  let isMobile = useMediaQuery(`(max-width: ${mobileViewport}px)`);
  if (isMobile) {
    // handle cases where desktop popovers need a close button for the mobile modal view
    if (type !== 'modal' && mobileType === 'modal') {
      isDismissable = true;
    }

    type = mobileType;
  }

  let state = useOverlayTriggerState(props);

  let wasOpen = useRef(false);
  let isExiting = useRef(false);
  let onExiting = () => (isExiting.current = true);
  let onExited = () => (isExiting.current = false);

  wasOpen.current = state.isOpen;

  useEffect(() => {
    return () => {
      if (
        (wasOpen.current || isExiting.current) &&
        type !== 'popover' &&
        type !== 'tray'
      ) {
        console.warn(
          'CubeUIKit: A DialogTrigger unmounted while open. This is likely due to being placed within a trigger that unmounts or inside a conditional. Consider using a DialogContainer instead.',
        );
      }
    };
  }, []);

  function onClose(action) {
    if (isDismissable) {
      onDismiss && onDismiss(action);
      state.close();
    }
  }

  if (type === 'popover') {
    return (
      <PopoverTrigger
        {...positionProps}
        hideOnClose={hideOnClose}
        state={state}
        targetRef={targetRef}
        trigger={trigger}
        content={content}
        isKeyboardDismissDisabled={isKeyboardDismissDisabled}
        hideArrow={hideArrow}
        shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
        onClose={onClose}
      />
    );
  }

  let renderOverlay = () => {
    switch (type) {
      case 'panel':
      case 'fullscreen':
      case 'fullscreenTakeover':
      case 'modal':
        return (
          <Modal
            hideOnClose={hideOnClose}
            isOpen={state.isOpen}
            isDismissable={isDismissable}
            type={type}
            isKeyboardDismissDisabled={isKeyboardDismissDisabled}
            styles={styles}
            shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
            onClose={onClose}
            onExiting={onExiting}
            onExited={onExited}
          >
            {typeof content === 'function' ? content(state.close) : content}
          </Modal>
        );
      case 'tray':
        return (
          <Tray
            hideOnClose={hideOnClose}
            isOpen={state.isOpen}
            isKeyboardDismissDisabled={isKeyboardDismissDisabled}
            styles={styles}
            onClose={onClose}
          >
            {typeof content === 'function' ? content(state.close) : content}
          </Tray>
        );
    }
  };

  return (
    <DialogTriggerBase
      type={type}
      state={state}
      isDismissable={isDismissable}
      trigger={trigger}
      overlay={renderOverlay()}
      onClose={onClose}
    />
  );
}

/**
 * DialogTrigger serves as a wrapper around a Dialog and its associated trigger, linking the Dialog's
 * open state with the trigger's press state. Additionally, it allows you to customize the type and
 * positioning of the Dialog.
 */
let _DialogTrigger = DialogTrigger;
export { _DialogTrigger as DialogTrigger };

function PopoverTrigger(allProps) {
  let {
    state,
    targetRef,
    trigger,
    content,
    hideArrow,
    onClose,
    isKeyboardDismissDisabled,
    hideOnClose,
    shouldCloseOnInteractOutside,
    keepOpenOnScroll,
    ...props
  } = allProps;

  let triggerRef = useRef<HTMLElement>(null);
  let overlayRef = useRef<HTMLDivElement>(null);

  let {
    overlayProps: popoverProps,
    placement,
    arrowProps,
    updatePosition,
  } = useOverlayPosition({
    targetRef: targetRef || triggerRef,
    overlayRef: overlayRef,
    placement: props.placement,
    containerPadding: props.containerPadding,
    offset: props.offset || 8,
    crossOffset: props.crossOffset,
    shouldFlip: props.shouldFlip,
    isOpen: state.isOpen,
  });

  let overlayTriggerState = state;

  if (keepOpenOnScroll) {
    overlayTriggerState = { ...state, close: updatePosition };
  }

  let { triggerProps, overlayProps } = useOverlayTrigger(
    { type: 'dialog' },
    overlayTriggerState,
    triggerRef,
  );

  let triggerPropsWithRef = {
    ...triggerProps,
    ref: targetRef ? undefined : triggerRef,
  };

  let overlay = (
    <Popover
      ref={overlayRef}
      hideOnClose={hideOnClose}
      isOpen={state.isOpen}
      style={popoverProps.style}
      placement={placement}
      arrowProps={arrowProps}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      hideArrow={hideArrow}
      updatePosition={updatePosition}
      shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
      onClose={onClose}
    >
      {typeof content === 'function' ? content(state.close) : content}
    </Popover>
  );

  return (
    <DialogTriggerBase
      type="popover"
      state={state}
      triggerProps={triggerPropsWithRef}
      dialogProps={overlayProps}
      trigger={trigger}
      overlay={overlay}
      onClose={onClose}
    />
  );
}

function DialogTriggerBase(props) {
  let {
    type,
    state,
    onClose,
    isDismissable,
    dialogProps = {},
    triggerProps = {},
    overlay,
    trigger,
  } = props;

  let context = {
    type,
    onClose,
    isDismissable,
    ...dialogProps,
  };

  return (
    <Fragment>
      <PressResponder
        {...triggerProps}
        isPressed={
          state.isOpen &&
          type !== 'modal' &&
          type !== 'fullscreen' &&
          type !== 'fullscreenTakeover'
        }
        onPress={state.toggle}
      >
        {trigger}
      </PressResponder>
      <DialogContext.Provider value={context}>{overlay}</DialogContext.Provider>
    </Fragment>
  );
}
