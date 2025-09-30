import { FocusableProvider } from '@react-aria/focus';
import {
  HTMLAttributes,
  ReactElement,
  ReactNode,
  RefObject,
  useRef,
} from 'react';
import {
  Placement,
  TooltipTriggerProps,
  useOverlayPosition,
  useTooltipTrigger,
} from 'react-aria';
import { useTooltipTriggerState } from 'react-stately';

import { Block } from '../../Block';
import { ActiveZone } from '../../content/ActiveZone/ActiveZone';
import { OverlayWrapper } from '../OverlayWrapper';

import { TooltipContext } from './context';

const DEFAULT_OFFSET = 8; // Offset needed to reach 4px/5px (med/large) distance between tooltip and trigger button
const DEFAULT_CROSS_OFFSET = 0;

export type TooltipTriggerFunction = (
  triggerProps: HTMLAttributes<HTMLElement>,
  ref: RefObject<HTMLElement>,
) => ReactNode;

export interface CubeTooltipTriggerProps extends TooltipTriggerProps {
  children: [ReactElement | string | TooltipTriggerFunction, ReactElement];
  crossOffset?: number;
  offset?: number;
  placement?: Placement;
  isMaterial?: boolean;
  isLight?: boolean;
  /**
   * @deprecated Use function-as-first-child pattern instead.
   * Whether the trigger should have an ActiveZone wrap to make sure it's focusable and hoverable.
   * Otherwise, tooltip won't work.
   */
  activeWrap?: boolean;
  /**
   * External ref to use instead of internal ref (optional).
   */
  targetRef?: RefObject<HTMLElement>;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  defaultOpen?: boolean;
  /**
   * Whether the tooltip should be disabled, independent of the trigger.
   */
  isDisabled?: boolean;
  /**
   * The delay time for the tooltip to show up.
   * @default 1500
   */
  delay?: number;
  /**
   * The delay time for the tooltip to close.
   * @default 500
   */
  closeDelay?: number;
  /**
   * By default, opens for both focus and hover. Can be made to open only for focus.
   */
  trigger?: 'focus';
}

/**
 * TooltipTrigger wraps around a trigger element and a Tooltip. It handles opening and closing
 * the Tooltip when the user hovers over or focuses the trigger, and positioning the Tooltip
 * relative to the trigger.
 */
export function TooltipTrigger(props: CubeTooltipTriggerProps) {
  let {
    children,
    activeWrap,
    targetRef: externalRef,
    crossOffset = DEFAULT_CROSS_OFFSET,
    isDisabled,
    isMaterial,
    isLight,
    offset = DEFAULT_OFFSET,
    trigger: triggerAction,
    delay = 250,
    isOpen,
    onOpenChange,
    defaultOpen,
  } = props;

  // Extract both children without using React.Children.toArray so we don't lose
  // function-as-child (render-prop) which React.Children filters out.
  const rawChildrenArray = Array.isArray(children)
    ? (children as unknown[])
    : ([children] as unknown[]);
  const childrenArray = rawChildrenArray as unknown as [
    ReactElement | string | TooltipTriggerFunction,
    ReactElement,
  ];
  let [trigger, tooltip] = childrenArray;
  const isTriggerFunction = typeof trigger === 'function';

  // Show deprecation warning for activeWrap
  if (activeWrap && process.env.NODE_ENV === 'development') {
    console.warn(
      'CubeUIKit: The `activeWrap` prop is deprecated. Use function-as-first-child pattern instead.',
    );
  }

  let internalRef = useRef<HTMLElement>(null!);
  let tooltipTriggerRef = externalRef ?? internalRef;
  let overlayRef = useRef(null);

  let state = useTooltipTriggerState({ delay, ...props });

  let { triggerProps, tooltipProps } = useTooltipTrigger(
    {
      isDisabled,
      trigger: triggerAction,
      delay,
      isOpen,
      onOpenChange,
      defaultOpen,
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

  const tooltipContextValue = {
    state,
    placement,
    ref: overlayRef,
    overlayProps,
    arrowProps,
    minOffset: 'var(--gap)',
    minScale: '1',
    isMaterial,
    isLight,
    ...tooltipProps,
  };

  // Function trigger pattern (new)
  if (isTriggerFunction) {
    const triggerFn = trigger as TooltipTriggerFunction;

    return (
      <>
        {triggerFn(triggerProps, tooltipTriggerRef)}
        <TooltipContext.Provider value={tooltipContextValue}>
          <OverlayWrapper
            isOpen={state.isOpen}
            placement={props.placement || 'top'}
          >
            {tooltip}
          </OverlayWrapper>
        </TooltipContext.Provider>
      </>
    );
  }

  // Legacy element/string trigger pattern
  if (!activeWrap && typeof trigger === 'string') {
    console.warn(
      'CubeUIKit: Tooltips are only supported on elements that are both focusable and hoverable. To solve this issue you can: 1) Use active element as a trigger (`Button`, `Link`, etc); 2) Use function-as-first-child pattern to manually apply trigger props; 3) Use `ActiveZone` component to manually wrap the content.',
    );

    return <Block>{trigger}</Block>;
  }

  function onClick(e) {
    e?.currentTarget?.parentNode.click();
  }

  return (
    <FocusableProvider {...triggerProps} ref={tooltipTriggerRef}>
      {activeWrap ? (
        <ActiveZone onClick={onClick}>{trigger}</ActiveZone>
      ) : (
        trigger
      )}
      <TooltipContext.Provider value={tooltipContextValue}>
        <OverlayWrapper
          isOpen={state.isOpen}
          placement={props.placement || 'top'}
        >
          {tooltip}
        </OverlayWrapper>
      </TooltipContext.Provider>
    </FocusableProvider>
  );
}
