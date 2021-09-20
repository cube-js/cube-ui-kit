import { FocusableProvider } from '@react-aria/focus';
import { Children, ReactElement, useRef } from 'react';
import { TooltipContext } from './context';
import { useOverlayPosition } from '@react-aria/overlays';
import { useTooltipTrigger } from '@react-aria/tooltip';
import { useTooltipTriggerState } from '@react-stately/tooltip';
import { OverlayWrapper } from '../OverlayWrapper';
import { TooltipTriggerProps } from '@react-types/tooltip';

const DEFAULT_OFFSET = 8; // Offset needed to reach 4px/5px (med/large) distance between tooltip and trigger button
const DEFAULT_CROSS_OFFSET = 0;

export interface CubeTooltipTriggerProps extends TooltipTriggerProps {
  children: [ReactElement, ReactElement];
  crossOffset?: number;
  offset?: number;
  placement?: 'start' | 'end' | 'right' | 'left' | 'top' | 'bottom';
}

function TooltipTrigger(props: CubeTooltipTriggerProps) {
  let {
    children,
    crossOffset = DEFAULT_CROSS_OFFSET,
    isDisabled,
    offset = DEFAULT_OFFSET,
    trigger: triggerAction,
  } = props;

  let [trigger, tooltip] = Children.toArray(children);

  let state = useTooltipTriggerState({
    delay: 500,
    ...props,
  });

  let tooltipTriggerRef = useRef(null);
  let overlayRef = useRef(null);

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
          minOffset: 'var(--gap)',
          minScale: '1',
          ...tooltipProps,
        }}
      >
        {/*{state.isOpen ? tooltip : null}*/}
        <OverlayWrapper
          isOpen={state.isOpen}
          childrenOnly
          placement={props.placement || 'top'}
          withoutTransition={true}
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
