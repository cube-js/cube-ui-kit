import {
  HTMLAttributes,
  ReactNode,
  Ref,
  RefObject,
  useCallback,
  useEffect,
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
  /**
   * Secondary text that truncates alongside the label, such as `Item`'s
   * description. A string description is measured with the label, and the auto
   * tooltip shows whichever of the two is cut off.
   */
  description?: ReactNode;
  labelProps?: Props;
  isDynamicLabel?: boolean;
  /**
   * The caller's own ref to the label element. The hook owns the label's ref
   * (it measures the node), so a caller that also needs the node hands its ref
   * over here rather than attaching a second one.
   */
  labelRef?: Ref<HTMLElement>;
  /** The caller's own ref to the description element, as `labelRef`. */
  descriptionRef?: Ref<HTMLElement>;
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

/**
 * Whether the tooltip value asks to detect overflow on its own. What it
 * measures is decided separately: overflow detection measures text, so only a
 * string label or description takes part.
 */
function allowsAutoTooltip(tooltip: AutoTooltipValue | undefined): boolean {
  // Boolean true enables auto overflow detection
  if (tooltip === true) return true;
  if (typeof tooltip === 'object') {
    // If title is provided and auto is explicitly true, enable auto overflow detection
    if (tooltip.title) {
      return tooltip.auto === true;
    }

    // If no title is provided, default to auto=true unless explicitly disabled
    return tooltip.auto !== undefined ? !!tooltip.auto : true;
  }
  return false;
}

/** Which measured parts are cut off. */
type Truncation = 'none' | 'label' | 'description' | 'both';

/**
 * What the auto tooltip shows: the text that is cut off, and nothing the row
 * already shows in full. When both parts are, the description goes below the
 * label as the tooltip's `Description`, styled as secondary text.
 */
function getAutoTitle(
  children: ReactNode,
  description: ReactNode,
  truncation: Truncation,
): ReactNode {
  if (truncation === 'description') return description;
  if (truncation === 'both') {
    return (
      <>
        {children}
        <div data-element="Description">{description}</div>
      </>
    );
  }

  // The label is cut off, or nothing is and the tooltip stays mounted but
  // disabled for a dynamic label.
  return children;
}

/**
 * The `TooltipProvider` props a tooltip resolves to, or `null` when no tooltip
 * is rendered at all.
 */
function resolveTooltip({
  tooltip,
  children,
  description,
  labelProps,
  isDynamicLabel,
  truncation,
}: Omit<UseAutoTooltipOptions, 'labelRef' | 'descriptionRef'> & {
  truncation: Truncation;
}): Omit<CubeTooltipProviderProps, 'children'> | null {
  if (!tooltip) return null;

  // String tooltip - simple case
  if (typeof tooltip === 'string') {
    return { title: tooltip };
  }

  const isOverflowed = truncation !== 'none';
  const autoTitle = getAutoTitle(children, description, truncation);
  const hasAutoContent =
    !!(autoTitle || labelProps) && (isOverflowed || isDynamicLabel);

  // Boolean tooltip - auto tooltip on overflow
  if (tooltip === true) {
    if (!hasAutoContent) return null;

    return {
      title: autoTitle,
      isDisabled: !isOverflowed && isDynamicLabel,
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
    title: tooltipProps.title ?? autoTitle,
    isDisabled:
      !isOverflowed && isDynamicLabel && tooltipProps.isDisabled !== true,
    ...tooltipProps,
  };
}

/** Whether a measured node's text is cut off. */
function isTruncated(element: HTMLElement | null): boolean {
  return !!element && element.scrollWidth > element.clientWidth;
}

function measureTruncation(
  label: HTMLElement | null,
  description: HTMLElement | null,
): Truncation {
  const isLabelCut = isTruncated(label);
  const isDescriptionCut = isTruncated(description);

  if (isLabelCut) return isDescriptionCut ? 'both' : 'label';

  return isDescriptionCut ? 'description' : 'none';
}

interface MeasuredNodes {
  label: HTMLElement | null;
  description: HTMLElement | null;
  observer: ResizeObserver | null;
}

/**
 * Points the hook's one observer at the nodes now measured, so a row with a
 * label and a description still costs a single observer. It re-points by
 * disconnecting and observing again rather than with `unobserve`: those are
 * the only two calls the hook has ever made, so a consumer's test stub that
 * implements just them keeps working.
 */
function observeMeasuredNodes(measured: MeasuredNodes, onResize: () => void) {
  try {
    measured.observer?.disconnect();
  } catch {
    // do nothing
  }

  const { label, description } = measured;

  if (!label && !description) return;

  measured.observer ??= new ResizeObserver(() => onResize());

  if (label) measured.observer.observe(label);
  if (description) measured.observer.observe(description);
}

export function useAutoTooltip({
  tooltip,
  children,
  description,
  labelProps,
  isDynamicLabel = false,
  labelRef: labelRefOption,
  descriptionRef: descriptionRefOption,
}: UseAutoTooltipOptions) {
  const allowsAuto = allowsAutoTooltip(tooltip);
  const isLabelMeasured = allowsAuto && typeof children === 'string';
  const isDescriptionMeasured = allowsAuto && typeof description === 'string';
  const isAutoTooltipEnabled = isLabelMeasured || isDescriptionMeasured;

  // Track overflow for auto tooltip (only when enabled)
  const externalLabelRef = (labelProps as any)?.ref;
  const [truncation, setTruncation] = useState<Truncation>('none');
  // The nodes being measured, and the one observer watching all of them.
  const measuredRef = useRef<MeasuredNodes>({
    label: null,
    description: null,
    observer: null,
  });

  const verdictRef = useRef<Truncation>('none');

  /**
   * Sets the verdict only when it changes. React skips an unchanged `setState`
   * only while the component has no other update queued; otherwise the no-op is
   * enqueued like any other update. From an effect flushed inside a sync commit
   * that is a pending update, and a nested one — see the mount effect below.
   * Mirroring the verdict makes every unchanged write free, whatever else the
   * component has queued.
   */
  const setVerdict = useCallback((value: Truncation) => {
    if (verdictRef.current === value) return;

    verdictRef.current = value;
    setTruncation(value);
  }, []);

  const checkOverflow = useCallback(() => {
    const { label, description } = measuredRef.current;

    if (!label && !description) return;

    setVerdict(measureTruncation(label, description));
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
  const scheduleOverflowCheck = useCallback(() => {
    queueOverflowCheck(checkOverflow);
  }, [checkOverflow]);

  useEffect(() => {
    if (isAutoTooltipEnabled) {
      // Queued, not measured here. React 19 flushes a sync commit's passive
      // effects before the commit returns, so a verdict set from this effect
      // leaves that commit with an update pending — a nested update. A list
      // that commits each row on its own (ag-grid-react wraps every new row in
      // `flushSync`) then gains one per row, and React throws "Maximum update
      // depth exceeded" once the count passes 50. The queued check runs after
      // the commit and still before paint. The callback refs have usually
      // queued it already, so this call is absorbed. It matters when what is
      // measured changes without a node re-attaching — the description stops
      // being a string, say, while the label stays.
      scheduleOverflowCheck();

      return;
    }

    // Clearing here rather than in the callback ref, which cannot be trusted
    // to do it. Flipping `isAutoTooltipEnabled` changes the ref's identity, so
    // React detaches with the PREVIOUS callback — the one that still believes
    // auto tooltips are on, and therefore keeps the last verdict — and only
    // attaches the new one if the label still exists. When `children` stops
    // being a string the label unmounts, so the new callback never runs and a
    // stale verdict would keep an auto tooltip mounted over content that is no
    // longer text. That is the default `Button` path, where `tooltip` is `true`.
    setVerdict('none');
  }, [
    isAutoTooltipEnabled,
    isLabelMeasured,
    isDescriptionMeasured,
    scheduleOverflowCheck,
    setVerdict,
  ]);

  // The callback refs own the observer: React hands them `null` when a node
  // goes away. An unmount effect must not repeat that. React 18 Strict Mode
  // replays effects without re-attaching refs, so the replay would drop the
  // nodes and observer for good and strand the queued check.
  const attachMeasuredNode = useCallback(
    (part: 'label' | 'description', element: HTMLElement | null) => {
      const measured = measuredRef.current;

      measured[part] = element;
      // The observer covers every later size change.
      observeMeasuredNodes(measured, checkOverflow);

      // No node to measure. Leave the previous verdict alone rather than
      // clearing it: turning the verdict on mounts `TooltipProvider`, which
      // remounts the label underneath it, so React detaches the old node and
      // attaches a new one within that commit. Clearing here would unmount the
      // provider, remount the label, measure it, mount the provider again — a
      // loop that never settles.
      if (!element) return;

      // Do NOT measure synchronously here — see `scheduleOverflowCheck`. This
      // covers the node the ref just handed us, including the fresh one React
      // creates when `TooltipProvider` mounts and remounts the element.
      scheduleOverflowCheck();
    },
    [checkOverflow, scheduleOverflowCheck],
  );

  const handleLabelElementRef = useCallback(
    (element: HTMLElement | null) => {
      // Notify the external refs
      assignRef(externalLabelRef, element);
      assignRef(labelRefOption, element);

      attachMeasuredNode('label', isLabelMeasured ? element : null);
    },
    [externalLabelRef, labelRefOption, isLabelMeasured, attachMeasuredNode],
  );

  const handleDescriptionElementRef = useCallback(
    (element: HTMLElement | null) => {
      assignRef(descriptionRefOption, element);

      attachMeasuredNode('description', isDescriptionMeasured ? element : null);
    },
    [descriptionRefOption, isDescriptionMeasured, attachMeasuredNode],
  );

  const { ref: _labelPropsRef, ...finalLabelProps } = labelProps || {};

  // Resolved once so that both the rendering below and `isTooltipActive` speak
  // about the same tooltip.
  const resolvedTooltip = resolveTooltip({
    tooltip,
    children,
    description,
    labelProps,
    isDynamicLabel,
    truncation,
  });

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
    descriptionRef: handleDescriptionElementRef,
    labelProps: finalLabelProps,
    isOverflowed: truncation !== 'none',
    isAutoTooltipEnabled,
    hasTooltip: !!tooltip,
    isTooltipActive,
    renderWithTooltip,
  };
}
