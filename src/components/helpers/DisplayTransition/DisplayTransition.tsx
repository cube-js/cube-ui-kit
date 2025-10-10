import {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

type Phase = 'enter' | 'entered' | 'exit' | 'unmounted';

export type DisplayTransitionProps = {
  /** Desired visibility (driver). */
  isShown: boolean;
  /** Times enter->entered and exit->unmounted. 0 => immediate. */
  duration?: number;
  /** Fires after enter settles or after exit completes (unmount). */
  onRest?: (transition: 'enter' | 'exit') => void;
  /** Keep calling children during "unmounted" (you decide what to render). */
  exposeUnmounted?: boolean;
  /** If false and initially shown, start at "entered" (no first-mount animation/SSR pop). */
  animateOnMount?: boolean;
  /** Respect prefers-reduced-motion by collapsing duration to 0. */
  respectReducedMotion?: boolean;
  /** Render-prop gets { phase, isShown }. */
  children: (props: { phase: Phase; isShown: boolean }) => ReactNode;
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
  duration = 150,
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

  const afterDuration = (cb: () => void) => {
    const flow = flowRef.current;
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

  if (phase === 'unmounted' && !exposeUnmounted) return null;
  return children({
    phase: phase === 'enter' && !duration ? 'entered' : phase,
    isShown: isShownNow,
  });
}
