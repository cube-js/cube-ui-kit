import {
  ReactNode,
  RefCallback,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

const AUTO_FALLBACK_DURATION = 500;

type Phase = 'enter' | 'entered' | 'exit-pending' | 'exit' | 'unmounted';
type ReportedPhase = 'enter' | 'entered' | 'exit' | 'unmounted';

export type DisplayTransitionProps = {
  /** Desired visibility (driver). */
  isShown: boolean;
  /** Times enter->entered and exit->unmounted. 0 => immediate. If undefined, uses native transition events. */
  duration?: number;
  /** Fires after enter settles or after exit completes (unmount). */
  onRest?: (transition: 'enter' | 'exit') => void;
  /** Fires when phase changes. */
  onPhaseChange?: (phase: ReportedPhase) => void;
  /** Fires when isShown (derived from phase) changes. */
  onToggle?: (isShown: boolean) => void;
  /** Keep calling children during "unmounted" (you decide what to render). */
  exposeUnmounted?: boolean;
  /** If false and initially shown, start at "entered" (no first-mount animation/SSR pop). */
  animateOnMount?: boolean;
  /** Respect prefers-reduced-motion by collapsing duration to 0. */
  respectReducedMotion?: boolean;
  /** Preserve children content during exit transition. When true, uses stored children from when content was visible. @default true */
  preserveContent?: boolean;
  /** Render-prop gets { phase, isShown, ref }. Bind ref to the transitioned element for native event detection. */
  children: (props: {
    phase: ReportedPhase;
    isShown: boolean;
    ref: RefCallback<HTMLElement>;
  }) => ReactNode;
};

// Stable callback to avoid stale closures
function useEvent<T extends (...a: any[]) => any>(fn?: T) {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  }, [fn]);
  return useCallback((...args: Parameters<NonNullable<T>>) => {
    return ref.current?.(...args);
  }, []);
}

export function DisplayTransition({
  isShown: targetShown,
  duration,
  onRest,
  onPhaseChange,
  onToggle,
  exposeUnmounted = false,
  animateOnMount = true,
  respectReducedMotion = true,
  preserveContent = true,
  children,
}: DisplayTransitionProps) {
  // Reduced motion → collapse timing
  const prefersReduced =
    respectReducedMotion &&
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const dur = prefersReduced ? 0 : duration;

  // Store children to preserve content during exit transitions
  const storedChildrenRef = useRef<typeof children>(children);

  // For native transition event detection
  const elementRef = useRef<HTMLElement | null>(null);
  const transitionStartedRef = useRef(false);
  const eventListenersRef = useRef<{
    onTransitionStart: (e: TransitionEvent) => void;
    onTransitionEnd: (e: TransitionEvent) => void;
    onTransitionCancel: (e: TransitionEvent) => void;
  } | null>(null);

  // Initial phase (optionally skip first-mount animation)
  const [phase, setPhase] = useState<Phase>(
    targetShown ? (animateOnMount ? 'enter' : 'entered') : 'unmounted',
  );
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const onRestEvent = useEvent(onRest);
  const onPhaseChangeEvent = useEvent(onPhaseChange);
  const onToggleEvent = useEvent(onToggle);

  // Versioned scheduling (Strict Mode & rapid toggles safe)
  const flowRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelRAF = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };
  const clearTimer = () => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Double-rAF ensures at least one paint with "enter" before flipping to "entered".
  const nextPaint = (cb: () => void) => {
    cancelRAF();
    const flow = flowRef.current;
    rafRef.current = requestAnimationFrame(() => {
      if (flowRef.current !== flow) return;
      rafRef.current = requestAnimationFrame(() => {
        if (flowRef.current !== flow) return;
        rafRef.current = null;
        cb();
      });
    });
  };

  const cleanupEventListeners = () => {
    const element = elementRef.current;
    const listeners = eventListenersRef.current;
    if (element && listeners) {
      element.removeEventListener(
        'transitionstart',
        listeners.onTransitionStart,
      );
      element.removeEventListener('transitionend', listeners.onTransitionEnd);
      element.removeEventListener(
        'transitioncancel',
        listeners.onTransitionCancel,
      );
      eventListenersRef.current = null;
    }
  };

  const afterDuration = (cb: () => void) => {
    const flow = flowRef.current;

    // If using native event detection
    if (dur === undefined) {
      const element = elementRef.current;

      cleanupEventListeners();
      transitionStartedRef.current = false;

      let completed = false;
      const complete = () => {
        if (completed || flowRef.current !== flow) return;
        completed = true;
        clearTimer();
        cleanupEventListeners();
        cb();
      };

      if (!element) {
        // No element to listen on - use fallback timer to avoid immediate completion
        clearTimer();
        timerRef.current = setTimeout(() => {
          if (flowRef.current !== flow) return;
          timerRef.current = null;
          complete();
        }, AUTO_FALLBACK_DURATION);

        return;
      }

      const onTransitionStart = () => {
        if (flowRef.current !== flow) return;
        transitionStartedRef.current = true;
        clearTimer(); // Cancel fallback timer once transition starts
      };

      const onTransitionEnd = () => {
        if (flowRef.current !== flow) return;
        complete();
      };

      const onTransitionCancel = () => {
        if (flowRef.current !== flow) return;
        complete();
      };

      eventListenersRef.current = {
        onTransitionStart,
        onTransitionEnd,
        onTransitionCancel,
      };

      element.addEventListener('transitionstart', onTransitionStart);
      element.addEventListener('transitionend', onTransitionEnd);
      element.addEventListener('transitioncancel', onTransitionCancel);

      // Fallback: if no transitionstart fires within 150ms, assume no transition
      timerRef.current = setTimeout(() => {
        if (flowRef.current !== flow) return;
        if (!transitionStartedRef.current) {
          complete();
        }
      }, 150);

      return;
    }

    // If using explicit duration
    if (dur <= 0) {
      cb();
      return;
    }
    clearTimer();
    timerRef.current = setTimeout(() => {
      if (flowRef.current !== flow) return;
      timerRef.current = null;
      cb();
    }, dur);
  };

  const ensureEnterFlow = () => {
    if (phaseRef.current !== 'enter') {
      return;
    }

    if (!elementRef.current) {
      return;
    }

    // frame N: "enter" (hidden) → frame N+1: "entered" (shown) → after dur: onRest("enter")
    nextPaint(() => {
      if (phaseRef.current !== 'enter') return;
      setPhase('entered');
      afterDuration(() => onRestEvent?.('enter'));
    });
  };

  const ensureExitFlow = () => {
    // "exit" (hidden) → after dur → "unmounted" → onRest("exit")
    afterDuration(() => {
      setPhase('unmounted');
      onRestEvent?.('exit');
    });
  };

  useEffect(() => {
    ++flowRef.current; // invalidate any pending work
    const current = phaseRef.current;

    if (targetShown) {
      if (current === 'unmounted' || current === 'exit') {
        setPhase('enter');
        ensureEnterFlow();
      } else if (current === 'enter') {
        ensureEnterFlow();
      } else if (current === 'exit-pending') {
        // User toggled back before exit started, cancel and stay entered
        cancelRAF();
        clearTimer();
        setPhase('entered');
      } else {
        // already "entered"
        cancelRAF();
        clearTimer();
      }
    } else {
      if (current === 'unmounted') {
        cancelRAF();
        clearTimer();
      } else if (current !== 'exit' && current !== 'exit-pending') {
        // Set intermediate phase to trigger re-render, RAF will be scheduled from layout effect
        setPhase('exit-pending');
      } else if (current === 'exit') {
        ensureExitFlow();
      }
      // 'exit-pending' is handled in useLayoutEffect below
    }

    return () => {
      cancelRAF();
      clearTimer();
      cleanupEventListeners();
    };
  }, [targetShown, dur, onRestEvent]);

  // Schedule RAF from layout effect for both enter and exit-pending to ensure symmetric timing
  useLayoutEffect(() => {
    if (phaseRef.current === 'enter') {
      ensureEnterFlow();
    } else if (phaseRef.current === 'exit-pending') {
      // Schedule RAF for exit, mirroring the enter flow timing
      nextPaint(() => {
        if (phaseRef.current === 'exit-pending') {
          setPhase('exit');
          ensureExitFlow();
        }
      });
    }
    return cancelRAF;
  }, [phase]);

  // Map internal phase to reported phase (exit-pending is reported as 'entered')
  const reportedPhase: ReportedPhase =
    phase === 'exit-pending' ? 'entered' : phase;

  // Call onPhaseChange when reported phase changes
  const prevReportedPhaseRef = useRef(reportedPhase);
  useLayoutEffect(() => {
    if (prevReportedPhaseRef.current !== reportedPhase) {
      prevReportedPhaseRef.current = reportedPhase;
      onPhaseChangeEvent?.(reportedPhase);
    }
  }, [reportedPhase, onPhaseChangeEvent]);

  // Render-time boolean (true only when visually shown)
  const isShownNow = phase === 'entered' || phase === 'exit-pending';
  const prevIsShownRef = useRef(isShownNow);

  // Call onToggle when isShown changes
  useLayoutEffect(() => {
    if (prevIsShownRef.current !== isShownNow) {
      prevIsShownRef.current = isShownNow;
      onToggleEvent?.(isShownNow);
    }
  }, [isShownNow, onToggleEvent]);

  // Ref callback to attach to transitioned element
  const refCallback: RefCallback<HTMLElement> = (node) => {
    if (node) {
      elementRef.current = node;
      // Don't call ensureEnterFlow() here - useLayoutEffect handles RAF scheduling
      // to ensure symmetric timing with exit flow
    } else {
      cleanupEventListeners();
      elementRef.current = null;
    }
  };

  // Update stored children only when showing (enter/entered phase and targetShown is true)
  // This prevents overwriting during exit transitions, preserving content for the animation
  const isShowingContent =
    (phase === 'enter' || phase === 'entered') && targetShown;

  if (isShowingContent) {
    storedChildrenRef.current = children;
  }

  // When preserveContent is enabled, always use stored children:
  // - During show: stored is updated above, so it equals current children
  // - During hide: stored keeps the last shown content for the exit animation
  const effectiveChildren = preserveContent
    ? storedChildrenRef.current
    : children;

  if (phase === 'unmounted' && !exposeUnmounted) return null;
  return effectiveChildren({
    phase:
      reportedPhase === 'enter' && duration !== undefined && !duration
        ? 'entered'
        : reportedPhase,
    isShown: isShownNow,
    ref: refCallback,
  });
}
