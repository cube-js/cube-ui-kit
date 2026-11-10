import {
  HTMLAttributes,
  ReactElement,
  ReactNode,
  Ref,
  RefObject,
  SyntheticEvent,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';
import { Placement, PositionProps, useIsSSR } from 'react-aria';
import { flushSync } from 'react-dom';

import { useLayoutEffect } from '../../utils/react/useLayoutEffect';
import { CubeTooltipProps } from '../overlays/Tooltip/Tooltip';
import {
  createProviderTooltip,
  CubeTooltipProviderProps,
} from '../overlays/Tooltip/TooltipProvider';
import {
  TooltipTriggerBindingProps,
  useTooltipTriggerBinding,
} from '../overlays/Tooltip/TooltipTrigger';

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
   * tooltip shows whichever of the two is cut off. With `{ title, auto: true }`
   * any description is measured, and the tooltip shows that title.
   */
  description?: ReactNode;
  labelProps?: Props;
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

/**
 * The handlers React Aria's `useTooltipTrigger` puts on the trigger. The
 * element renders before the tooltip beside it has computed its own, so it
 * gets a forwarder for each while a tooltip is mounted. Hover comes from
 * `useHover`, which uses pointer events where the browser has them and mouse
 * and touch events elsewhere; only those names are forwarded, so a forwarder
 * never replaces a handler of the element's own that React Aria leaves alone.
 */
const FOCUS_TRIGGER_HANDLERS = [
  'onFocus',
  'onBlur',
  'onKeyDown',
  'onKeyUp',
  'onPointerDown',
] as const;
const POINTER_HOVER_HANDLERS = ['onPointerEnter', 'onPointerLeave'] as const;
const MOUSE_HOVER_HANDLERS = [
  'onMouseEnter',
  'onMouseLeave',
  'onTouchStart',
] as const;

type TriggerHandlerName =
  | (typeof FOCUS_TRIGGER_HANDLERS)[number]
  | (typeof POINTER_HOVER_HANDLERS)[number]
  | (typeof MOUSE_HOVER_HANDLERS)[number];

type TriggerHandlers = Partial<
  Record<TriggerHandlerName, (event: SyntheticEvent) => void>
>;

function getTriggerHandlerNames(): readonly TriggerHandlerName[] {
  return [
    ...FOCUS_TRIGGER_HANDLERS,
    ...(typeof PointerEvent === 'undefined'
      ? MOUSE_HOVER_HANDLERS
      : POINTER_HOVER_HANDLERS),
  ];
}

interface AutoTooltipLayerProps {
  /** The trigger options, with the ref the tooltip is positioned against. */
  options: TooltipTriggerBindingProps & { targetRef: RefObject<HTMLElement> };
  tooltip: ReactElement<CubeTooltipProps>;
  placement: Placement | undefined;
  /** Where the layer publishes its trigger handlers for the forwarders. */
  handlersRef: RefObject<TriggerHandlers | null>;
  onDescribedByChange: (id: string | undefined) => void;
}

/**
 * The tooltip of an element rendered by `renderWithTooltip`, mounted beside the
 * element only while a tooltip exists. It owns the tooltip's state and hands
 * the element its trigger handlers through `handlersRef`, so an element that
 * never has a tooltip runs none of it, and the element keeps its node when the
 * tooltip comes and goes.
 */
function AutoTooltipLayer({
  options,
  tooltip,
  placement,
  handlersRef,
  onDescribedByChange,
}: AutoTooltipLayerProps) {
  const isSSR = useIsSSR();
  const { triggerProps, renderTooltip } = useTooltipTriggerBinding(
    options,
    tooltip,
  );
  const describedBy = triggerProps['aria-describedby'];

  // Events reach the element only after a commit, so publishing the handlers
  // here is never late.
  useLayoutEffect(() => {
    handlersRef.current = triggerProps as TriggerHandlers;
  });

  // The open tooltip's id describes the element, which renders it as a prop.
  const publishDescribedBy = useEffectEvent((id: string | undefined) => {
    onDescribedByChange(id);
  });

  useLayoutEffect(() => {
    publishDescribedBy(describedBy);
  }, [describedBy]);

  useLayoutEffect(
    () => () => {
      handlersRef.current = null;
      publishDescribedBy(undefined);
    },
    [handlersRef],
  );

  return isSSR ? null : renderTooltip(placement);
}

/** Overflow checks queued for the end of the current task, from every label. */
const pendingOverflowChecks = new Set<() => void>();
const overflowChecksByNode = new WeakMap<HTMLElement, Set<() => void>>();

/** Refresh a retained tooltip tree after inherited appearance changes. */
export function refreshAutoTooltipsWithin(element: HTMLElement) {
  for (const node of [
    element,
    ...Array.from(element.querySelectorAll<HTMLElement>('*')),
  ]) {
    overflowChecksByNode.get(node)?.forEach(queueOverflowCheck);
  }
}

/**
 * Runs every queued check in one pass and commits the verdicts that changed in
 * one synchronous render.
 *
 * All reads happen before React touches the DOM again, so they share one
 * layout. `flushSync` applies the verdicts before paint and before any other
 * task, so code that asks whether the tooltip is active after this task gets
 * the answer the measurement gave. Outside a React commit this is an ordinary
 * sync render, not a nested update.
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
 * measures is decided separately (`isMeasured`).
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

/**
 * The tooltip's own title when it still waits for overflow (`{ title, auto:
 * true }`), or `undefined`.
 */
function getOwnAutoTitle(tooltip: AutoTooltipValue | undefined): ReactNode {
  if (typeof tooltip !== 'object' || tooltip.auto !== true) return undefined;

  return tooltip.title || undefined;
}

/**
 * Whether a label or description takes part in overflow detection.
 *
 * Without a title of its own, the tooltip shows the text that is cut off, so
 * only a string part is measured. With one, it never shows the part, so a part
 * of any kind is measured: an element label, such as a coloured commit hash
 * followed by its message, gets a tooltip that appears only when it is cut off.
 * Only the part's own box is compared, so a child that cuts off its own text
 * inside it does not count.
 */
function isMeasured(part: ReactNode, ownTitle: ReactNode): boolean {
  return ownTitle ? part != null : typeof part === 'string';
}

/**
 * What a measured part's re-check is keyed on. Text can change its overflow
 * without resizing the observed box, so a string part is keyed by its text. Any
 * other part is keyed by the tooltip's own title, which callers derive from the
 * same text, rather than by an element that is new on every render.
 */
function getMeasureKey(part: ReactNode, ownTitle: ReactNode) {
  if (typeof part === 'string') return part;

  return typeof ownTitle === 'string' ? ownTitle : undefined;
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

  // The label is cut off, or nothing is and no tooltip renders.
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
  const hasAutoContent = !!(autoTitle || labelProps) && isOverflowed;

  // Boolean tooltip - auto tooltip on overflow
  if (tooltip === true) {
    return hasAutoContent ? { title: autoTitle } : null;
  }

  // Object tooltip - advanced configuration
  const { auto, ...tooltipProps } = tooltip;

  // If title is provided and auto is not explicitly true, always show the tooltip
  if (tooltipProps.title && auto !== true) {
    return tooltipProps;
  }

  // If title is provided with auto=true, OR no title but auto behavior enabled
  if (!hasAutoContent) return null;

  // A nullish `title` falls back to the auto title, so it goes after the spread.
  return {
    ...tooltipProps,
    title: tooltipProps.title ?? autoTitle,
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
  labelRef: labelRefOption,
  descriptionRef: descriptionRefOption,
}: UseAutoTooltipOptions) {
  const allowsAuto = allowsAutoTooltip(tooltip);
  const ownTitle = getOwnAutoTitle(tooltip);
  const isLabelMeasured = allowsAuto && isMeasured(children, ownTitle);
  const isDescriptionMeasured = allowsAuto && isMeasured(description, ownTitle);
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

  // Text can change its overflow without changing the observed box size.
  const measuredLabel = isLabelMeasured
    ? getMeasureKey(children, ownTitle)
    : undefined;
  const measuredDescription = isDescriptionMeasured
    ? getMeasureKey(description, ownTitle)
    : undefined;

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
    measuredLabel,
    measuredDescription,
    scheduleOverflowCheck,
    setVerdict,
  ]);

  // The callback refs own the observer: React hands them `null` when a node
  // goes away. Effect cleanup must not discard nodes still owned by refs:
  // reconnecting effects would otherwise strand queued measurements. Let
  // attachment/detachment update observer ownership symmetrically.
  const attachMeasuredNode = useCallback(
    (part: 'label' | 'description', element: HTMLElement | null) => {
      const measured = measuredRef.current;

      const previous = measured[part];
      measured[part] = element;

      if (
        previous &&
        previous !== measured.label &&
        previous !== measured.description
      ) {
        const checks = overflowChecksByNode.get(previous);
        checks?.delete(checkOverflow);
        if (!checks?.size) overflowChecksByNode.delete(previous);
      }
      if (element) {
        const checks = overflowChecksByNode.get(element) ?? new Set();
        checks.add(checkOverflow);
        overflowChecksByNode.set(element, checks);
      }

      // The observer covers every later size change.
      observeMeasuredNodes(measured, checkOverflow);

      // No node to measure. Leave the previous verdict alone rather than
      // clearing it: a consumer whose callback ref is new on every render has
      // React detach and re-attach it within one commit, and clearing here
      // would undo the measurement the re-attached node is about to repeat.
      if (!element) return;

      // Do NOT measure synchronously here — see `scheduleOverflowCheck`. This
      // covers the node the ref just handed us.
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
    truncation,
  });

  /** Whether a tooltip is rendered and able to open. */
  const isTooltipActive =
    !!resolvedTooltip && resolvedTooltip.isDisabled !== true;

  // The element's tooltip trigger. While a tooltip exists, the element gets
  // forwarders to the handlers of the tooltip layer mounted beside it.
  const triggerRef = useRef<HTMLElement>(null!);
  const handlersRef = useRef<TriggerHandlers | null>(null);
  const describedByRef = useRef<string | undefined>(undefined);
  const [describedBy, setDescribedBy] = useState<string>();

  // Sets the id only when it changes, as `setVerdict` does: from a layout
  // effect inside a commit, even an unchanged `setState` can queue a render.
  const updateDescribedBy = (id: string | undefined) => {
    if (describedByRef.current === id) return;

    describedByRef.current = id;
    setDescribedBy(id);
  };

  /**
   * Renders the element and, beside it, its tooltip.
   *
   * The element keeps its place in the tree whether or not a tooltip exists,
   * so the tooltip coming or going never remounts it. Wrapping the element in
   * `TooltipProvider` only while a tooltip existed changed the element type
   * above it: a button whose label started truncating lost its node and its
   * focus.
   */
  const renderWithTooltip = (
    renderElement: (
      tooltipTriggerProps?: HTMLAttributes<HTMLElement>,
      tooltipRef?: RefObject<HTMLElement>,
    ) => ReactNode,
    defaultTooltipPlacement: PositionProps['placement'],
  ) => {
    if (!resolvedTooltip) {
      return (
        <>
          {renderElement()}
          {null}
        </>
      );
    }

    const {
      title,
      tooltipStyles,
      width,
      qa,
      placement,
      isDisabled,
      targetRef,
      ...triggerOptions
    } = resolvedTooltip;
    // A caller that positions the tooltip against an element of its own (the
    // `Layout.Header` title) passes that ref, and the element gets it too.
    const anchorRef = targetRef ?? triggerRef;

    const forwardedProps: Record<string, unknown> = {
      'aria-describedby': describedBy,
    };

    for (const name of getTriggerHandlerNames()) {
      forwardedProps[name] = (event: SyntheticEvent) =>
        handlersRef.current?.[name]?.(event);
    }

    return (
      <>
        {renderElement(forwardedProps, anchorRef)}
        <AutoTooltipLayer
          options={{ ...triggerOptions, isDisabled, targetRef: anchorRef }}
          tooltip={createProviderTooltip({
            title,
            tooltipStyles,
            width,
            qa,
            isDisabled,
          })}
          placement={placement ?? defaultTooltipPlacement}
          handlersRef={handlersRef}
          onDescribedByChange={updateDescribedBy}
        />
      </>
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
    scheduleOverflowCheck,
  };
}
