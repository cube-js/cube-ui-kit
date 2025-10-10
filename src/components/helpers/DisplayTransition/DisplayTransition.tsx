import {
  ReactNode,
  RefCallback,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

const AUTO_FALLBACK_DURATION = 180;

type Phase = 'enter' | 'entered' | 'exit' | 'unmounted';

export type DisplayTransitionProps = {
  /** Desired visibility (driver). */
  isShown: boolean;
  /** Times enter->entered and exit->unmounted. 0 => immediate. If undefined, uses native transition events. */
  duration?: number;
  /** Fires after enter settles or after exit completes (unmount). */
  onRest?: (transition: 'enter' | 'exit') => void;
  /** Keep calling children during "unmounted" (you decide what to render). */
  exposeUnmounted?: boolean;
  /** If false and initially shown, start at "entered" (no first-mount animation/SSR pop). */
  animateOnMount?: boolean;
  /** Respect prefers-reduced-motion by collapsing duration to 0. */
  respectReducedMotion?: boolean;
  /** Render-prop gets { phase, isShown, ref }. Bind ref to the transitioned element for native event detection. */
  children: (props: {
    phase: Phase;
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
  exposeUnmounted = false,
  animateOnMount = true,
  respectReducedMotion = true,
  children,
}: DisplayTransitionProps) {
  // Reduced motion → collapse timing
  const prefersReduced =
    respectReducedMotion &&
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const dur = prefersReduced ? 0 : duration;

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
      } else {
        // already "entered"
        cancelRAF();
        clearTimer();
      }
    } else {
      if (current === 'unmounted') {
        cancelRAF();
        clearTimer();
      } else if (current !== 'exit') {
        setPhase('exit');
        ensureExitFlow();
      } else {
        ensureExitFlow();
      }
    }

    return () => {
      cancelRAF();
      clearTimer();
      cleanupEventListeners();
    };
  }, [targetShown, dur, onRestEvent]);

  // OPTIONAL belt-and-suspenders: if we render while still "enter", re-arm enter flow.
  // You can remove this if you want fewer moving parts; double-rAF usually suffices.
  useLayoutEffect(() => {
    if (phaseRef.current === 'enter') {
      ensureEnterFlow();
    }
    return cancelRAF;
  }, [phase]);

  // Render-time boolean (true only when visually shown)
  const isShownNow = phase === 'entered';

  // Ref callback to attach to transitioned element
  const refCallback: RefCallback<HTMLElement> = (node) => {
    if (node) {
      elementRef.current = node;

      if (phaseRef.current === 'enter') {
        ensureEnterFlow();
      }
    } else {
      cleanupEventListeners();
      elementRef.current = null;
    }
  };

  if (phase === 'unmounted' && !exposeUnmounted) return null;
  return children({
    phase:
      phase === 'enter' && duration !== undefined && !duration
        ? 'entered'
        : phase,
    isShown: isShownNow,
    ref: refCallback,
  });
}
