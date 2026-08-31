import {
  HTMLAttributes,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { OverlayProps } from 'react-aria';

import {
  CubeTooltipProviderProps,
  TooltipProvider,
} from '../overlays/Tooltip/TooltipProvider';

import type { Props } from '../../props';

export type AutoTooltipValue =
  | string
  | boolean
  | (Omit<CubeTooltipProviderProps, 'children'> & { auto?: boolean });

export interface UseAutoTooltipOptions {
  tooltip: AutoTooltipValue | undefined;
  children: ReactNode;
  labelProps?: Props;
  isDynamicLabel?: boolean;
}

export function useAutoTooltip({
  tooltip,
  children,
  labelProps,
  isDynamicLabel = false,
}: UseAutoTooltipOptions) {
  // Determine if auto tooltip is enabled
  // Auto tooltip only works when children is a string (overflow detection needs text)
  const isAutoTooltipEnabled = useMemo(() => {
    if (typeof children !== 'string') return false;

    // Boolean true enables auto overflow detection
    if (tooltip === true) return true;
    if (typeof tooltip === 'object') {
      // If title is provided and auto is explicitly true, enable auto overflow detection
      if (tooltip.title) {
        return tooltip.auto === true;
      }

      // If no title is provided, default to auto=true unless explicitly disabled
      const autoValue = tooltip.auto !== undefined ? tooltip.auto : true;
      return !!autoValue;
    }
    return false;
  }, [tooltip, children]);

  // Track label overflow for auto tooltip (only when enabled)
  const externalLabelRef = (labelProps as any)?.ref;
  const [isLabelOverflowed, setIsLabelOverflowed] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const checkLabelOverflow = useCallback(() => {
    const label = elementRef.current;
    if (!label) {
      setIsLabelOverflowed(false);
      return;
    }

    const hasOverflow = label.scrollWidth > label.clientWidth;
    setIsLabelOverflowed(hasOverflow);
  }, []);

  useEffect(() => {
    if (isAutoTooltipEnabled) {
      checkLabelOverflow();
    }
  }, [isAutoTooltipEnabled, checkLabelOverflow]);

  // Attach ResizeObserver via callback ref to handle DOM node changes
  const handleLabelElementRef = useCallback(
    (element: HTMLElement | null) => {
      // Call external callback ref to notify external refs
      if (externalLabelRef) {
        if (typeof externalLabelRef === 'function') {
          externalLabelRef(element);
        } else {
          (externalLabelRef as any).current = element;
        }
      }

      // Disconnect previous observer
      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect();
        } catch {
          // do nothing
        }
        resizeObserverRef.current = null;
      }

      elementRef.current = element;

      if (element && isAutoTooltipEnabled) {
        // Create a fresh observer to capture the latest callback
        const obs = new ResizeObserver(() => {
          checkLabelOverflow();
        });
        resizeObserverRef.current = obs;
        // `observe()` delivers an initial callback with the element's current
        // size, so this is the initial measurement as well as the resize one.
        //
        // Do NOT measure synchronously here. React runs callback refs during
        // `commitAttachRef`, so reading `scrollWidth`/`clientWidth` at this
        // point forces a style recalc and layout per element, mid-commit —
        // every tooltip-bearing Button, Item and TextItem paying its own
        // reflow. Observer callbacks run after layout but before paint, so the
        // measurement is still applied in the same frame, but batched across
        // every observed label into a single flush.
        obs.observe(element);
      } else {
        setIsLabelOverflowed(false);
      }
    },
    [externalLabelRef, isAutoTooltipEnabled, checkLabelOverflow],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect();
        } catch {
          // do nothing
        }
        resizeObserverRef.current = null;
      }
      elementRef.current = null;
    };
  }, []);

  const finalLabelProps = useMemo(() => {
    const props = {
      ...(labelProps || {}),
    };

    delete props.ref;

    return props;
  }, [labelProps]);

  /**
   * The `TooltipProvider` props this tooltip resolves to, or `null` when no
   * tooltip is rendered at all. Resolved once so that both the rendering below
   * and `isTooltipActive` speak about the same tooltip.
   */
  const resolvedTooltip = useMemo<Omit<
    CubeTooltipProviderProps,
    'children'
  > | null>(() => {
    if (!tooltip) return null;

    // String tooltip - simple case
    if (typeof tooltip === 'string') {
      return { title: tooltip };
    }

    const hasAutoContent =
      !!(children || labelProps) && (isLabelOverflowed || isDynamicLabel);

    // Boolean tooltip - auto tooltip on overflow
    if (tooltip === true) {
      if (!hasAutoContent) return null;

      return {
        title: children,
        isDisabled: !isLabelOverflowed && isDynamicLabel,
      };
    }

    // Object tooltip - advanced configuration
    const { auto, ...tooltipProps } = tooltip;

    // If title is provided and auto is not explicitly true, always show the tooltip
    if (tooltipProps.title && auto !== true) {
      return tooltipProps;
    }

    // If title is provided with auto=true, OR no title but auto behavior enabled
    if (!hasAutoContent) return null;

    return {
      title: tooltipProps.title ?? children,
      isDisabled:
        !isLabelOverflowed &&
        isDynamicLabel &&
        tooltipProps.isDisabled !== true,
      ...tooltipProps,
    };
  }, [tooltip, children, labelProps, isLabelOverflowed, isDynamicLabel]);

  /** Whether a tooltip is rendered and able to open. */
  const isTooltipActive =
    !!resolvedTooltip && resolvedTooltip.isDisabled !== true;

  const renderWithTooltip = (
    renderElement: (
      tooltipTriggerProps?: HTMLAttributes<HTMLElement>,
      tooltipRef?: RefObject<HTMLElement>,
    ) => ReactNode,
    defaultTooltipPlacement: OverlayProps['placement'],
  ) => {
    if (!resolvedTooltip) return renderElement();

    return (
      <TooltipProvider placement={defaultTooltipPlacement} {...resolvedTooltip}>
        {(triggerProps, ref) => renderElement(triggerProps, ref)}
      </TooltipProvider>
    );
  };

  return {
    labelRef: handleLabelElementRef,
    labelProps: finalLabelProps,
    isLabelOverflowed,
    isAutoTooltipEnabled,
    hasTooltip: !!tooltip,
    isTooltipActive,
    renderWithTooltip,
  };
}
