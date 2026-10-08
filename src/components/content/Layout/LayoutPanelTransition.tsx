import { tasty } from '@tenphi/tasty';
import { ReactNode, useLayoutEffect, useRef, useState } from 'react';

const BoundaryElement = tasty({
  styles: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    // Unlike hidden, clip cannot scroll when offscreen content receives focus.
    overflow: { '': 'visible', clipping: 'clip' },
  },
});

/** Receives live visibility from DisplayTransition, even with preserved children. */
export function LayoutPanelTransition({
  isShown,
  isExiting,
  children,
}: {
  isShown: boolean;
  isExiting: boolean;
  children: ReactNode;
}) {
  const boundaryRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({
    isShown,
    isExiting,
    isClipping: !isShown || isExiting,
  });

  // Contain the first offscreen frame, including exit preparation and reversal.
  if (state.isShown !== isShown || state.isExiting !== isExiting) {
    setState({ isShown, isExiting, isClipping: true });
  }

  useLayoutEffect(() => {
    if (!isShown || isExiting || !state.isClipping) return;

    let cancelled = false;
    let frame: number;
    const settle = () => {
      if (cancelled) return;

      // Only the panel and handle slide; descendant animations must not hold clipping.
      const animations = Array.from(boundaryRef.current?.children ?? [])
        .flatMap((element) => element.getAnimations?.() ?? [])
        .filter(
          (animation) =>
            animation instanceof CSSTransition &&
            animation.transitionProperty === 'transform' &&
            animation.playState !== 'finished' &&
            animation.playState !== 'idle',
        );

      if (!animations.length) {
        setState((current) => ({ ...current, isClipping: false }));
        return;
      }

      // Cancellation can replace a transition. Inspect the next frame before releasing.
      Promise.allSettled(
        animations.map((animation) => animation.finished),
      ).then(() => {
        if (!cancelled) frame = requestAnimationFrame(settle);
      });
    };

    frame = requestAnimationFrame(settle);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [isShown, isExiting, state.isClipping]);

  return (
    <BoundaryElement ref={boundaryRef} mods={{ clipping: state.isClipping }}>
      {children}
    </BoundaryElement>
  );
}
