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

import { Props } from '../../tasty';
import {
  CubeTooltipProviderProps,
  TooltipProvider,
} from '../overlays/Tooltip/TooltipProvider';

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
        obs.observe(element);
        // Initial check
        checkLabelOverflow();
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

  const renderWithTooltip = (
    renderElement: (
      tooltipTriggerProps?: HTMLAttributes<HTMLElement>,
      tooltipRef?: RefObject<HTMLElement>,
    ) => ReactNode,
    defaultTooltipPlacement: OverlayProps['placement'],
  ) => {
    // Handle tooltip rendering based on tooltip prop type
    if (tooltip) {
      // String tooltip - simple case
      if (typeof tooltip === 'string') {
        return (
          <TooltipProvider placement={defaultTooltipPlacement} title={tooltip}>
            {(triggerProps, ref) => renderElement(triggerProps, ref)}
          </TooltipProvider>
        );
      }

      // Boolean tooltip - auto tooltip on overflow
      if (tooltip === true) {
        if ((children || labelProps) && (isLabelOverflowed || isDynamicLabel)) {
          return (
            <TooltipProvider
              placement={defaultTooltipPlacement}
              title={children}
              isDisabled={!isLabelOverflowed && isDynamicLabel}
            >
              {(triggerProps, ref) => renderElement(triggerProps, ref)}
            </TooltipProvider>
          );
        }
      }

      // Object tooltip - advanced configuration
      if (typeof tooltip === 'object') {
        const { auto, ...tooltipProps } = tooltip;

        // If title is provided and auto is not explicitly true, always show the tooltip
        if (tooltipProps.title && auto !== true) {
          return (
            <TooltipProvider
              placement={defaultTooltipPlacement}
              {...tooltipProps}
            >
              {(triggerProps, ref) => renderElement(triggerProps, ref)}
            </TooltipProvider>
          );
        }

        // If title is provided with auto=true, OR no title but auto behavior enabled
        if ((children || labelProps) && (isLabelOverflowed || isDynamicLabel)) {
          return (
            <TooltipProvider
              placement={defaultTooltipPlacement}
              title={tooltipProps.title ?? children}
              isDisabled={
                !isLabelOverflowed &&
                isDynamicLabel &&
                tooltipProps.isDisabled !== true
              }
              {...tooltipProps}
            >
              {(triggerProps, ref) => renderElement(triggerProps, ref)}
            </TooltipProvider>
          );
        }
      }
    }

    return renderElement();
  };

  return {
    labelRef: handleLabelElementRef,
    labelProps: finalLabelProps,
    isLabelOverflowed,
    isAutoTooltipEnabled,
    hasTooltip: !!tooltip,
    renderWithTooltip,
  };
}
