import { FocusableProvider } from '@react-aria/focus';
import {
  Children,
  ContextType,
  createContext,
  FocusEvent,
  HTMLAttributes,
  isValidElement,
  ReactElement,
  ReactNode,
  RefObject,
  useContext,
  useEffectEvent,
  useRef,
  useState,
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
import { useLayoutEffect } from '../../../utils/react/useLayoutEffect';
import { Block } from '../../Block';
import { ActiveZone } from '../../content/ActiveZone/ActiveZone';
import {
  DisplayTransition,
  DisplayTransitionProps,
} from '../../helpers/DisplayTransition/DisplayTransition';
import { Portal } from '../../portal';

import { TooltipContext } from './context';
import { CubeTooltipProps, Tooltip } from './Tooltip';

type TooltipPositionOptions = Pick<
  Parameters<typeof useOverlayPosition>[0],
  | 'placement'
  | 'targetRef'
  | 'overlayRef'
  | 'offset'
  | 'crossOffset'
  | 'isOpen'
  | 'shouldFlip'
> & {
  onClose: () => void;
};

// DisplayTransition preserves its last shown render prop during exit. Position
// subscriptions must still see the current target, configuration and open state.
const TooltipPositionContext = createContext<TooltipPositionOptions>(null!);

function TooltipTransition(
  props: Pick<DisplayTransitionProps, 'children' | 'isShown'>,
) {
  const [hasShown, setHasShown] = useState(props.isShown);

  // Once opened, retain the transition owner through closing and reopening.
  // A never-opened tooltip has no animation resources to maintain.
  if (props.isShown && !hasShown) setHasShown(true);
  if (!hasShown && !props.isShown) return null;

  return <DisplayTransition {...props} />;
}

type Box = Pick<DOMRect, 'top' | 'right' | 'bottom' | 'left'>;

function overlaps(a: Box, b: Box) {
  return (
    a.bottom > b.top && a.top < b.bottom && a.right > b.left && a.left < b.right
  );
}

/**
 * Whether the trigger is still visible after `scrolled` scrolled: it overlaps
 * the viewport and, when an element scrolled, that element's box.
 */
function isInView(trigger: Element, scrolled: EventTarget | null) {
  const rect = trigger.getBoundingClientRect();
  const viewport = {
    top: 0,
    left: 0,
    bottom: window.innerHeight,
    right: window.innerWidth,
  };

  return (
    overlaps(rect, viewport) &&
    (!(scrolled instanceof Element) ||
      overlaps(rect, scrolled.getBoundingClientRect()))
  );
}

function PositionedTooltip({
  tooltip,
  contextValue,
}: {
  tooltip: ReactElement;
  contextValue: ContextType<typeof TooltipContext>;
}) {
  const { onClose, ...options } = useContext(TooltipPositionContext);
  const { overlayProps, arrowProps, placement, updatePosition } =
    useOverlayPosition(options);

  // A scroll of the page or of an element that contains the trigger moves the
  // trigger. The tooltip follows it while it stays in view, and closes once it
  // is scrolled out. Closing on any scroll, as a popover does, would close the
  // tooltip a keyboard user just opened: focus scrolls a trigger into view —
  // the browser at once, a list a frame later — and the scroll is reported
  // after the tooltip opened.
  const onScroll = useEffectEvent((event: Event) => {
    const trigger = options.targetRef.current;
    const { target } = event;

    if (
      !trigger ||
      (target instanceof Node && !target.contains(trigger)) ||
      // A text field scrolls its own text to keep the caret in view.
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    if (isInView(trigger, target)) {
      updatePosition();
    } else {
      onClose();
    }
  });

  // Subscribed at commit, with the positioning, so a scroll reported on the
  // next frame is never missed.
  useLayoutEffect(() => {
    if (!options.isOpen) return;

    const listener = (event: Event) => onScroll(event);

    window.addEventListener('scroll', listener, true);

    return () => window.removeEventListener('scroll', listener, true);
  }, [options.isOpen]);

  return (
    <TooltipContext.Provider
      value={{
        ...contextValue,
        placement: placement || options.placement || 'top',
        overlayProps,
        arrowProps,
        updatePosition,
      }}
    >
      {tooltip}
    </TooltipContext.Provider>
  );
}

const DEFAULT_OFFSET = 8; // Offset needed to reach 4px/5px (med/large) distance between tooltip and trigger button
const DEFAULT_CROSS_OFFSET = 0;

// Type guards
function isTriggerFunction(value: unknown): value is TooltipTriggerFunction {
  return typeof value === 'function';
}

function isReactElement<P = unknown>(value: unknown): value is ReactElement<P> {
  return isValidElement(value);
}

/**
 * Whether a `Tooltip` has nothing to show. The docs turn a tooltip off with
 * `title={null}`, and opening it anyway drew an empty bubble and described the
 * trigger by it. Only a `Tooltip` is inspected: another component may render
 * content of its own.
 */
function isEmptyTooltip(tooltip: ReactElement<CubeTooltipProps>): boolean {
  return (
    tooltip.type === Tooltip &&
    Children.toArray(tooltip.props.children).every((child) => child === '')
  );
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
   * @default 250
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
    shouldCloseOnPress,
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
  if (!isReactElement<CubeTooltipProps>(tooltip)) {
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
  let overlayRef = useRef<HTMLDivElement>(null);

  let state = useTooltipTriggerState({ delay, ...props });

  // A tooltip with nothing to show is a disabled one.
  const isTooltipDisabled = isDisabled || isEmptyTooltip(tooltip);

  let { triggerProps: rawTriggerProps, tooltipProps } = useTooltipTrigger(
    {
      // Without it a disabled tooltip still opened — invisibly, since nothing
      // renders it — and while open React Aria's document-level listener eats
      // every `Escape`, so a Dialog under the pointer would not close.
      isDisabled: isTooltipDisabled,
      trigger: triggerAction,
      delay,
      isOpen,
      onOpenChange,
      defaultOpen,
      shouldCloseOnPress,
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

  const triggerProps = {
    ...rawTriggerProps,
    onFocus,
    // A controlled `isOpen` still opens a disabled tooltip's state, and nothing
    // is rendered to describe the trigger by.
    'aria-describedby': isTooltipDisabled
      ? undefined
      : rawTriggerProps['aria-describedby'],
  };

  const positionOptions: TooltipPositionOptions = {
    placement: props.placement || 'top',
    targetRef: tooltipTriggerRef,
    overlayRef,
    offset,
    crossOffset,
    isOpen: state.isOpen,
    // Documented on `Tooltip`, which renders inside the positioned layer, so
    // it is read from the element here.
    shouldFlip: tooltip.props.shouldFlip,
    // Called once a scroll carries the trigger out of view.
    onClose: () => state.close(true),
  };

  const tooltipContextValue = {
    state,
    ref: overlayRef,
    isMaterial,
    isLight,
    ...tooltipProps,
  };

  // Closed triggers retain their interaction state, but positioning resources
  // belong to the overlay's visible/closing lifetime rather than every label.
  const tooltipContent = (
    <TooltipPositionContext.Provider value={positionOptions}>
      <TooltipTransition isShown={state.isOpen && !isTooltipDisabled}>
        {({ phase, isShown, ref: transitionRef }) => (
          <Portal>
            <PositionedTooltip
              tooltip={tooltip}
              contextValue={{
                ...tooltipContextValue,
                phase,
                isShown,
                ref: overlayRef,
                transitionRef,
              }}
            />
          </Portal>
        )}
      </TooltipTransition>
    </TooltipPositionContext.Provider>
  );

  // Function trigger pattern (new)
  if (isTriggerFunction(trigger)) {
    return (
      <>
        {trigger(triggerProps, tooltipTriggerRef)}
        {tooltipContent}
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
      {tooltipContent}
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
