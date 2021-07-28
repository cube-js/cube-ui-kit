import { FocusableProvider } from '@react-aria/focus';
import React, { useRef } from 'react';
import { TooltipContext } from './context';
import { useOverlayPosition } from '@react-aria/overlays';
import { useTooltipTrigger } from '@react-aria/tooltip';
import { useTooltipTriggerState } from '@react-stately/tooltip';
import { OverlayWrapper } from '../../components/OverlayWrapper';

const DEFAULT_OFFSET = 8; // Offset needed to reach 4px/5px (med/large) distance between tooltip and trigger button
const DEFAULT_CROSS_OFFSET = 0;

function TooltipTrigger(props) {
  let {
    children,
    crossOffset = DEFAULT_CROSS_OFFSET,
    isDisabled,
    offset = DEFAULT_OFFSET,
    trigger: triggerAction,
  } = props;

  let [trigger, tooltip] = React.Children.toArray(children);

  let state = useTooltipTriggerState({
    delay: 1000,
    ...props,
  });

  let tooltipTriggerRef = useRef();
  let overlayRef = useRef();

  let { triggerProps, tooltipProps } = useTooltipTrigger(
    {
      isDisabled,
      trigger: triggerAction,
    },
    state,
    tooltipTriggerRef,
  );

  let { overlayProps, arrowProps, placement } = useOverlayPosition({
    placement: props.placement || 'top',
    targetRef: tooltipTriggerRef,
    overlayRef,
    offset,
    crossOffset,
    isOpen: state.isOpen,
  });

  return (
    <FocusableProvider {...triggerProps} ref={tooltipTriggerRef}>
      {trigger}
      <TooltipContext.Provider
        value={{
          state,
          placement,
          ref: overlayRef,
          overlayProps,
          arrowProps,
          ...tooltipProps,
        }}
      >
        {/*{state.isOpen ? tooltip : null}*/}
        <OverlayWrapper
          isOpen={state.isOpen}
          childrenOnly
          placement={props.placement || 'top'}
        >
          {tooltip}
        </OverlayWrapper>
      </TooltipContext.Provider>
    </FocusableProvider>
  );
}

/**
 * TooltipTrigger wraps around a trigger element and a Tooltip. It handles opening and closing
 * the Tooltip when the user hovers over or focuses the trigger, and positioning the Tooltip
 * relative to the trigger.
 */
let _TooltipTrigger = TooltipTrigger;
export { _TooltipTrigger as TooltipTrigger };
