import React, { Fragment, useEffect, useRef, useState } from 'react';
import { useOverlayTriggerState } from '@react-stately/overlays';
import { PressResponder } from '@react-aria/interactions';
import { unwrapDOMRef, useMediaQuery } from '@react-spectrum/utils';
import { useOverlayPosition, useOverlayTrigger } from '@react-aria/overlays';
import { DialogContext } from './context';
import { Modal, Popover, Tray } from '../Modal';

function DialogTrigger(props) {
  let {
    children,
    type = 'modal',
    mobileType = type === 'popover' ? 'modal' : type,
    hideArrow,
    targetRef,
    onDismiss,
    isDismissable,
    isKeyboardDismissDisabled,
    ...positionProps
  } = props;

  if (!Array.isArray(children) || children.length > 2) {
    throw new Error('DialogTrigger must have exactly 2 children');
  }
  // if a function is passed as the second child, it won't appear in toArray
  let [trigger, content] = children;

  // On small devices, show a modal or tray instead of a popover.
  let isMobile = useMediaQuery('(max-width: 700px)');
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
  let onExiting = () => isExiting.current = true;
  let onExited = () => isExiting.current = false;

  wasOpen.current = state.isOpen;

  // eslint-disable-next-line arrow-body-style
  useEffect(() => {
    return () => {
      if ((wasOpen.current || isExiting.current) && type !== 'popover' && type !== 'tray') {
        console.warn('A DialogTrigger unmounted while open. This is likely due to being placed within a trigger that unmounts or inside a conditional. Consider using a DialogContainer instead.');
      }
    };
  }, []);

  function onClose() {
    if (isDismissable) {
      onDismiss && onDismiss();
      state.close();
    }
  }

  if (type === 'popover') {
    return (
      <PopoverTrigger
        {...positionProps}
        state={state}
        targetRef={targetRef}
        trigger={trigger}
        content={content}
        onClose={onClose}
        isKeyboardDismissDisabled={isKeyboardDismissDisabled}
        hideArrow={hideArrow}/>
    );
  }

  let renderOverlay = () => {
    switch (type) {
      case 'fullscreen':
      case 'fullscreenTakeover':
      case 'modal':
        return (
          <Modal
            isOpen={state.isOpen}
            isDismissable={type === 'modal' ? isDismissable : false}
            onClose={onClose}
            type={type}
            isKeyboardDismissDisabled={isKeyboardDismissDisabled}
            onExiting={onExiting}
            onExited={onExited}>
            {typeof content === 'function' ? content(state.close) : content}
          </Modal>
        );
      case 'tray':
        return (
          <Tray
            isOpen={state.isOpen}
            onClose={onClose}
            isKeyboardDismissDisabled={isKeyboardDismissDisabled}>
            {typeof content === 'function' ? content(state.close) : content}
          </Tray>
        );
    }
  };

  return (
    <DialogTriggerBase
      type={type}
      state={state}
      onClose={onClose}
      isDismissable={isDismissable}
      trigger={trigger}
      overlay={renderOverlay()}/>
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
    ...props
  } = allProps;

  let triggerRef = useRef();
  let overlayRef = useRef();

  let { overlayProps: popoverProps, placement, arrowProps } = useOverlayPosition({
    targetRef: targetRef || triggerRef,
    overlayRef: unwrapDOMRef(overlayRef),
    placement: props.placement,
    containerPadding: props.containerPadding,
    offset: props.offset || 8,
    crossOffset: props.crossOffset,
    shouldFlip: props.shouldFlip,
    isOpen: state.isOpen
  });

  let { triggerProps, overlayProps } = useOverlayTrigger({ type: 'dialog' }, state, triggerRef);

  let triggerPropsWithRef = {
    ...triggerProps,
    ref: targetRef ? undefined : triggerRef
  };

  let overlay = (
    <Popover
      isOpen={state.isOpen}
      style={popoverProps.style}
      ref={overlayRef}
      onClose={onClose}
      placement={placement}
      arrowProps={arrowProps}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      hideArrow={hideArrow}>
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
      overlay={overlay}/>
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
    trigger
  } = props;

  let context = {
    type,
    onClose,
    isDismissable,
    ...dialogProps
  };

  return (
    <Fragment>
      <PressResponder
        {...triggerProps}
        onPress={state.toggle}
        isPressed={state.isOpen && type !== 'modal' && type !== 'fullscreen' && type !== 'fullscreenTakeover'}>
        {trigger}
      </PressResponder>
      <DialogContext.Provider value={context}>
        {overlay}
      </DialogContext.Provider>
    </Fragment>
  );
}
