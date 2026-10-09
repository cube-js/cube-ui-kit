import { ReactNode, useContext, useLayoutEffect, useState } from 'react';

import {
  LayoutPanelTransitionContext,
  useLayoutRefsContext,
} from './LayoutContext';

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
  const registerPanelTransition = useContext(
    LayoutPanelTransitionContext,
  )?.registerPanelTransition;
  const panelContainerRef = useLayoutRefsContext()?.panelContainerRef;
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
    if (state.isClipping) return registerPanelTransition?.();
  }, [state.isClipping, registerPanelTransition]);

  useLayoutEffect(() => {
    if (!isShown || isExiting || !state.isClipping) return;

    let cancelled = false;
    let frame: number;
    const settle = () => {
      if (cancelled) return;

      // The Layout shares one clip, so wait for every direct panel and handle slide.
      // Descendant animations must not hold clipping.
      const animations = Array.from(panelContainerRef?.current?.children ?? [])
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
  }, [isShown, isExiting, state.isClipping, panelContainerRef]);

  return <>{children}</>;
}
