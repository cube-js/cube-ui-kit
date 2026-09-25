import {
  HTMLAttributes,
  ReactNode,
  Ref,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { OverlayProps } from 'react-aria';
import { flushSync } from 'react-dom';

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
  /**
   * The caller's own ref to the label element. The hook owns the label's ref
   * (it measures the node), so a caller that also needs the node hands its ref
   * over here rather than attaching a second one.
   */
  labelRef?: Ref<HTMLElement>;
}

function assignRef(ref: unknown, element: HTMLElement | null) {
  if (typeof ref === 'function') {
    ref(element);
  } else if (ref) {
    (ref as { current: HTMLElement | null }).current = element;
  }
}

/** Overflow checks queued for the end of the current task, from every label. */
const pendingOverflowChecks = new Set<() => void>();

/**
 * Runs every queued check in one pass and commits the verdicts that changed in
 * one synchronous render.
 *
 * All reads happen before React touches the DOM again, so they share one
 * layout. `flushSync` applies the verdicts, and the `TooltipProvider` remounts
 * they cause, before paint and before any other task, so code that looks the
 * label up after this task gets the node the verdict leaves in place, not one
 * about to be replaced. Outside a React commit this is an ordinary sync
 * render, not a nested update.
 */
function runOverflowChecks() {
  const checks = Array.from(pendingOverflowChecks);

  pendingOverflowChecks.clear();

  flushSync(() => {
    for (const check of checks) check();
  });
}

function queueOverflowCheck(check: () => void) {
  if (!pendingOverflowChecks.size) queueMicrotask(runOverflowChecks);

  pendingOverflowChecks.add(check);
}

export function useAutoTooltip({
  tooltip,
  children,
  labelProps,
  isDynamicLabel = false,
  labelRef: labelRefOption,
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

  const verdictRef = useRef(false);

  /**
   * Sets the verdict only when it changes. React skips an unchanged `setState`
   * only while the component has no other update queued; otherwise the no-op is
   * enqueued like any other update. From an effect flushed inside a sync commit
   * that is a pending update, and a nested one — see the mount effect below.
   * Mirroring the verdict makes every unchanged write free, whatever else the
   * component has queued.
   */
  const setVerdict = useCallback((value: boolean) => {
    if (verdictRef.current === value) return;

    verdictRef.current = value;
    setIsLabelOverflowed(value);
  }, []);

  const checkLabelOverflow = useCallback(() => {
    const label = elementRef.current;

    if (!label) return;

    setVerdict(label.scrollWidth > label.clientWidth);
  }, [setVerdict]);

  /**
   * Measure once the current task has finished, not inside it.
   *
   * A microtask runs after React's whole commit — every mutation, layout effect
   * and ref attachment — and before paint. Every label on the page therefore
   * reads after all of them have written, so the reads collapse into one style
   * and layout flush instead of forcing one each, mid-commit. Reading straight
   * from the callback ref is what cost 122ms of `get scrollWidth` in one Cloud
   * profile, more than the entire style engine.
   *
   * A microtask rather than the observer's first delivery: observer callbacks
   * are part of the rendering steps, so a runner that is not producing frames —
   * a background tab, or a headless browser running many stories at once — can
   * delay them past the point something asks whether the tooltip is active.
   * Microtasks do not depend on a frame. See `runOverflowChecks` for how the
   * verdicts are applied.
   */
  const scheduleLabelOverflowCheck = useCallback(() => {
    queueOverflowCheck(checkLabelOverflow);
  }, [checkLabelOverflow]);

  useEffect(() => {
    if (isAutoTooltipEnabled) {
      // Queued, not measured here. React 19 flushes a sync commit's passive
      // effects before the commit returns, so a verdict set from this effect
      // leaves that commit with an update pending — a nested update. A list
      // that commits each row on its own (ag-grid-react wraps every new row in
      // `flushSync`) then gains one per row, and React throws "Maximum update
      // depth exceeded" once the count passes 50. The queued check runs after
      // the commit and still before paint. The callback ref has usually queued
      // it already, so this call is absorbed. It matters when the flag flips on
      // for a label whose ref did not re-attach.
      scheduleLabelOverflowCheck();

      return;
    }

    // Clearing here rather than in the callback ref, which cannot be trusted
    // to do it. Flipping `isAutoTooltipEnabled` changes the ref's identity, so
    // React detaches with the PREVIOUS callback — the one that still believes
    // auto tooltips are on, and therefore keeps the last verdict — and only
    // attaches the new one if the label still exists. When `children` stops
    // being a string the label unmounts, so the new callback never runs and a
    // stale `true` would keep an auto tooltip mounted over content that is no
    // longer text. That is the default `Button` path, where `tooltip` is `true`.
    setVerdict(false);
  }, [isAutoTooltipEnabled, scheduleLabelOverflowCheck, setVerdict]);

  // Attach ResizeObserver via callback ref to handle DOM node changes. The ref
  // also owns teardown: React hands it `null` when the label goes away. An
  // unmount effect must not repeat that. React 18 Strict Mode replays effects
  // without re-attaching refs, so the replay would drop the node and observer
  // for good and strand the queued check.
  const handleLabelElementRef = useCallback(
    (element: HTMLElement | null) => {
      // Notify the external refs
      assignRef(externalLabelRef, element);
      assignRef(labelRefOption, element);

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

      if (!isAutoTooltipEnabled) {
        setVerdict(false);

        return;
      }

      // No node to measure. Leave the previous verdict alone rather than
      // clearing it: turning the verdict on mounts `TooltipProvider`, which
      // remounts the label underneath it, so React detaches the old node and
      // attaches a new one within that commit. Clearing here would unmount the
      // provider, remount the label, measure it, mount the provider again — a
      // loop that never settles.
      if (!element) return;

      // Do NOT measure synchronously here — see `scheduleLabelOverflowCheck`.
      // This covers the node the ref just handed us, including the fresh one
      // React creates when `TooltipProvider` mounts and remounts the label.
      scheduleLabelOverflowCheck();

      // The observer covers every later size change.
      const obs = new ResizeObserver(() => {
        checkLabelOverflow();
      });

      resizeObserverRef.current = obs;

      obs.observe(element);
    },
    [
      externalLabelRef,
      labelRefOption,
      isAutoTooltipEnabled,
      checkLabelOverflow,
      scheduleLabelOverflowCheck,
      setVerdict,
    ],
  );

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
