import { PressResponder } from '@react-aria/interactions';
import { useMediaQuery } from '@react-spectrum/utils';
import { Styles } from '@tenphi/tasty';
import {
  Fragment,
  ReactElement,
  RefObject,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  OverlayTriggerProps,
  Placement,
  PositionProps,
  useOverlayPosition,
  useOverlayTrigger,
} from 'react-aria';
import { OverlayTriggerState, useOverlayTriggerState } from 'react-stately';

import { generateRandomId } from '../../../utils/random';
import { useCombinedRefs } from '../../../utils/react/index';
import { usePopoverSync } from '../../../utils/react/usePopoverSync';
import { Modal, Popover, Tray, WithCloseBehavior } from '../Modal';

import { DialogContext } from './context';

export type CubeDialogClose = (close: () => void) => ReactElement;

export interface CubeDialogTriggerProps
  extends OverlayTriggerProps,
    PositionProps,
    WithCloseBehavior {
  /** The Dialog and its trigger element. See the DialogTrigger [Content section](#content) for more information on what to provide as children. */
  children: [
    ReactElement | ((state: OverlayTriggerState) => ReactElement),
    CubeDialogClose | ReactElement,
  ];
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
  mobileType?:
    | 'modal'
    | 'tray'
    | 'fullscreen'
    | 'fullscreenTakeover'
    | 'panel'
    | 'popover';
  placement?: Placement;
  /**
   * Whether a popover type Dialog's arrow should be hidden.
   */
  hideArrow?: boolean;
  /** The ref of the element the Dialog should visually attach itself to. Defaults to the trigger button if not defined. */
  targetRef?: RefObject<HTMLElement | null>;
  /** Whether a modal type Dialog should be dismissable. */
  isDismissable?: boolean;
  /** Whether pressing the escape key to close the dialog should be disabled. */
  isKeyboardDismissDisabled?: boolean;
  /** The screen breakpoint for the mobile type */
  mobileViewport?: number;
  /** The style map for the overlay **/
  styles?: Styles;
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
  onDismiss?: (action?: string) => void;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  defaultOpen?: boolean;
  shouldFlip?: boolean;
  shouldUpdatePosition?: boolean;
  /** Minimum padding in pixels between the popover and viewport edges */
  containerPadding?: number;
}

/**
 * DialogTrigger serves as a wrapper around a Dialog and its associated trigger, linking the Dialog's
 * open state with the trigger's press state. Additionally, it allows you to customize the type and
 * positioning of the Dialog.
 */
export function DialogTrigger(props: CubeDialogTriggerProps) {
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

  if (typeof trigger === 'function') {
    trigger = trigger(state);
  }

  let wasOpen = useRef(false);
  let isExiting = useRef(false);
  let onExiting = () => (isExiting.current = true);
  let onExited = () => (isExiting.current = false);

  wasOpen.current = state.isOpen;

  // Shared identity + refs for `usePopoverSync`. Allocating here (rather than
  // inside the branch-specific sub-trees) keeps a single sync registration for
  // the lifetime of the trigger, even when `type` flips between popover and
  // modal at the mobile breakpoint. The refs are then threaded into the
  // appropriate branch via `useCombinedRefs` so existing positioning /
  // useOverlayTrigger hooks keep their original ref targets.
  const dialogSyncId = useMemo(() => generateRandomId(), []);
  const syncTriggerRef = useRef<HTMLElement | null>(null);
  const syncOverlayRef = useRef<HTMLElement | null>(null);

  usePopoverSync({
    menuId: dialogSyncId,
    isOpen: state.isOpen,
    onClose: () => state.close(),
    triggerRef: syncTriggerRef,
    containerRef: syncOverlayRef,
  });

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
        styles={styles}
        targetRef={targetRef}
        trigger={trigger}
        content={content}
        isKeyboardDismissDisabled={isKeyboardDismissDisabled}
        hideArrow={hideArrow}
        shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
        syncTriggerRef={syncTriggerRef}
        syncOverlayRef={syncOverlayRef}
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
            ref={syncOverlayRef}
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
            ref={syncOverlayRef}
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
      hideOnClose={hideOnClose}
      syncTriggerRef={syncTriggerRef}
      onClose={onClose}
    />
  );
}

function PopoverTrigger(allProps) {
  let {
    state,
    styles,
    targetRef,
    trigger,
    content,
    hideArrow,
    onClose,
    isKeyboardDismissDisabled,
    hideOnClose,
    shouldCloseOnInteractOutside,
    keepOpenOnScroll,
    syncTriggerRef,
    syncOverlayRef,
    ...props
  } = allProps;

  let triggerRef = useRef<HTMLButtonElement>(null);
  let overlayRef = useRef<HTMLDivElement>(null);

  // Mirror the (effective) trigger and overlay nodes into the sync refs so
  // `usePopoverSync` in the parent can perform its nested-popover check. When
  // an external `targetRef` is provided we mirror that one instead, since the
  // local triggerRef stays null in that case.
  let combinedTriggerRef = useCombinedRefs<HTMLElement>(
    syncTriggerRef,
    targetRef ?? triggerRef,
  );
  let combinedOverlayRef = useCombinedRefs<HTMLElement>(
    syncOverlayRef,
    overlayRef,
  );

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
    shouldUpdatePosition: props.shouldUpdatePosition,
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
    ref: targetRef ? undefined : combinedTriggerRef,
  };

  let overlay = (
    <Popover
      ref={combinedOverlayRef}
      styles={styles}
      hideOnClose={hideOnClose}
      isOpen={state.isOpen}
      style={popoverProps.style}
      placement={placement}
      arrowProps={arrowProps}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      hideArrow={hideArrow}
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

function DialogTriggerBase(props: any) {
  const ref = useCombinedRefs<HTMLElement>(props.ref, props.syncTriggerRef);
  const wasOpenRef = useRef(false);

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
    isOpen: state.isOpen,
    ...dialogProps,
  };

  // Restore focus manually when the dialog closes
  useEffect(() => {
    if (!state.isOpen && wasOpenRef.current) {
      wasOpenRef.current = false;
      ref.current?.focus();
    } else if (state.isOpen) {
      wasOpenRef.current = true;
    }
  }, [state.isOpen]);

  return (
    <Fragment>
      <PressResponder
        ref={ref}
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
