import { FocusableProvider } from '@react-aria/focus';
import {
  FocusEvent,
  HTMLAttributes,
  isValidElement,
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

import { useEvent } from '../../../_internal';
import { isDevEnv } from '../../../utils/is-dev-env';
import { isFocusRestoration } from '../../../utils/react/programmaticFocus';
import { Block } from '../../Block';
import { ActiveZone } from '../../content/ActiveZone/ActiveZone';
import { DisplayTransition } from '../../helpers/DisplayTransition/DisplayTransition';
import { Portal } from '../../portal';

import { TooltipContext } from './context';

const DEFAULT_OFFSET = 8; // Offset needed to reach 4px/5px (med/large) distance between tooltip and trigger button
const DEFAULT_CROSS_OFFSET = 0;

// Type guards
function isTriggerFunction(value: unknown): value is TooltipTriggerFunction {
  return typeof value === 'function';
}

function isReactElement(value: unknown): value is ReactElement {
  return isValidElement(value);
}

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
  /**
   * When true, FocusableProvider won't be applied to the trigger.
   * Useful when trigger already handles focus or uses render props pattern.
   */
  disableFocusableProvider?: boolean;
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
    disableFocusableProvider,
  } = props;

  // Extract both children without using React.Children.toArray so we don't lose
  // function-as-child (render-prop) which React.Children filters out.
  const rawChildrenArray = Array.isArray(children)
    ? (children as unknown[])
    : ([children] as unknown[]);

  const [trigger, tooltip] = rawChildrenArray;

  // Type guard the tooltip
  if (!isReactElement(tooltip)) {
    throw new Error(
      'CubeUIKit: TooltipTrigger expects the second child to be a valid React element (Tooltip component).',
    );
  }

  // Type guard the trigger
  if (
    !isTriggerFunction(trigger) &&
    !isReactElement(trigger) &&
    typeof trigger !== 'string'
  ) {
    throw new Error(
      'CubeUIKit: TooltipTrigger expects the first child to be a function, React element, or string.',
    );
  }

  // Show deprecation warning for activeWrap
  if (activeWrap && isDevEnv()) {
    console.warn(
      'CubeUIKit: The `activeWrap` prop is deprecated. Use function-as-first-child pattern instead.',
    );
  }

  let internalRef = useRef<HTMLElement>(null!);
  let tooltipTriggerRef = externalRef ?? internalRef;
  let overlayRef = useRef<HTMLElement | null>(null);

  let state = useTooltipTriggerState({ delay, ...props, isDismissable: false });

  let { triggerProps: rawTriggerProps, tooltipProps } = useTooltipTrigger(
    {
      // Without it a disabled tooltip still opened — invisibly, since nothing
      // renders it — and while open React Aria's document-level listener eats
      // every `Escape`, so a Dialog under the pointer would not close.
      isDisabled,
      trigger: triggerAction,
      delay,
      isOpen,
      onOpenChange,
      isDismissable: false,
      defaultOpen,
    },
    state,
    tooltipTriggerRef,
  );

  // A tooltip answers a user arriving at the trigger. Focus handed back by a
  // component — a popup returning it to the trigger it came from — is not that
  // arrival, but the DOM event is identical and the modality is still
  // "keyboard", so React Aria would show the tooltip anyway. It then absorbs
  // the user's next `Escape` from its own document-level listener, which is
  // how a Dialog ended up needing two presses to close (CUB-4839).
  //
  // Dropping the focus handler rather than closing after the fact: React Aria
  // decides to show inside it, so this never starts and nothing flashes.
  //
  // Covers both restore paths — ours and a `FocusScope`'s — see
  // `programmaticFocus`.
  const onFocus = useEvent((event: FocusEvent<HTMLElement>) => {
    if (isFocusRestoration()) return;

    rawTriggerProps.onFocus?.(event);
  });

  const triggerProps = { ...rawTriggerProps, onFocus };

  let { overlayProps, arrowProps, placement, updatePosition } =
    useOverlayPosition({
      placement: props.placement || 'top',
      targetRef: tooltipTriggerRef,
      overlayRef,
      offset,
      crossOffset,
      isDismissable: false,
      isOpen: state.isOpen,
    });

  const tooltipContextValue = {
    state,
    placement: placement || props.placement || 'top',
    ref: overlayRef,
    overlayProps,
    arrowProps,
    minOffset: 'var(--gap)',
    minScale: '1',
    isMaterial,
    isLight,
    updatePosition,
    ...tooltipProps,
  };

  // Function trigger pattern (new)
  if (isTriggerFunction(trigger)) {
    return (
      <>
        {trigger(triggerProps, tooltipTriggerRef)}
        <DisplayTransition isShown={state.isOpen && !isDisabled}>
          {({ phase, isShown, ref: transitionRef }) => (
            <TooltipContext.Provider
              value={{
                ...tooltipContextValue,
                phase,
                isShown,
                ref: overlayRef,
                transitionRef,
              }}
            >
              <Portal>{tooltip}</Portal>
            </TooltipContext.Provider>
          )}
        </DisplayTransition>
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

  const triggerContent = (
    <>
      {activeWrap ? (
        <ActiveZone onClick={onClick}>{trigger}</ActiveZone>
      ) : (
        trigger
      )}
      <DisplayTransition isShown={state.isOpen && !isDisabled}>
        {({ phase, isShown, ref: transitionRef }) => (
          <TooltipContext.Provider
            value={{
              ...tooltipContextValue,
              phase,
              isShown,
              ref: overlayRef,
              transitionRef,
            }}
          >
            <Portal>{tooltip}</Portal>
          </TooltipContext.Provider>
        )}
      </DisplayTransition>
    </>
  );

  if (disableFocusableProvider) {
    return triggerContent;
  }

  return (
    <FocusableProvider {...triggerProps} ref={tooltipTriggerRef}>
      {triggerContent}
    </FocusableProvider>
  );
}
