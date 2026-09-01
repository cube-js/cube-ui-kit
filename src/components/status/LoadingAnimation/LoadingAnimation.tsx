import { tasty } from '@tenphi/tasty';
import { CSSProperties, RefObject, useRef } from 'react';

import { useI18n } from '../../../i18n';
import { useLayoutEffect } from '../../../utils/react/useLayoutEffect';
import { Block, CubeBlockProps } from '../../Block';

const CubeElement = tasty({
  as: 'svg',
  styles: {
    display: 'block',
    position: 'absolute',
    width: '50%',
    height: '50%',

    // The three visible faces of the cube get their colors via the SVG
    // `fill="…"` attribute on each `<path>` (see the JSX below), NOT via a
    // tasty `fill` style. Tasty's `fill` is a typed shorthand for
    // `background-color` — applying it to an SVG `<path>` would inject
    // `background-color: …` which paths simply ignore (this was the
    // "invisible cube" bug). Pointing the SVG `fill` attribute at the
    // adaptive `--loading-face-N-color` CSS variables published by Glaze
    // (defined in `src/tokens/palette.ts`) keeps the three faces driven by
    // the design system without going through a style property tasty would
    // re-route to the wrong CSS slot.
    //
    // Those three tokens are the kit's shared isometric-cube ramp — `NoDataIcon`
    // draws its crate from the same ones — and they are pinned by a WCAG floor
    // against `surface` rather than by a tone delta, so the faces hold the same
    // separation in light, dark, and high contrast. See the recipe's comment for
    // why that matters.

    animationName: {
      '': 'none',
      'index=0': 'dice0',
      'index=1': 'dice1',
      'index=2': 'dice2',
    },
    animationDuration: {
      '': '0s',
      'index=0 | index=1 | index=2': '2s',
    },
    animationIterationCount: {
      '': 1,
      'index=0 | index=1 | index=2': 'infinite',
    },
    animationTimingFunction: {
      '': 'ease',
      'index=0 | index=1 | index=2': 'ease',
    },
    zIndex: {
      '': 0,
      'index=0 | index=1 | index=2': 0,
    },

    '@keyframes': {
      dice0: {
        from: { transform: 'translate(49%, 0.5%)', zIndex: 0 },
        '25%': { transform: 'translate(49%, 0.5%)', zIndex: 0 },
        '50%': { transform: 'translate(0%, 25%)', zIndex: 0 },
        '51%': { zIndex: 1 },
        '75%': { zIndex: 1 },
        to: { transform: 'translate(0%, 25%)', zIndex: 1 },
      },
      dice1: {
        from: { transform: 'translate(0%, 25%)', zIndex: 3 },
        '25%': { transform: 'translate(49%, 49%)', zIndex: 3 },
        '75%': { transform: 'translate(49%, 49%)', zIndex: 2 },
        to: { transform: 'translate(98%, 25%)', zIndex: 1 },
      },
      dice2: {
        from: { transform: 'translate(98%, 25%)', zIndex: 1 },
        '50%': { transform: 'translate(98%, 25%)', zIndex: 0 },
        '75%': { transform: 'translate(49%, 0.5%)', zIndex: 0 },
        to: { transform: 'translate(49%, 0.5%)', zIndex: 0 },
      },
    },
  },
});

/**
 * Phase-lock a cube's `dice*` animation to the document timeline.
 *
 * A page under load mounts these animations at whatever moment each level of
 * the tree resolves — a route shell, then a panel, then the table inside it —
 * and every wrapper that appears around a running `LoadingAnimation` remounts
 * it. A CSS animation is created with its start time at "now", so each of
 * those events snapped the cubes back to the first frame: the visible symptom
 * is a loader that keeps stuttering back to the start while the page settles.
 *
 * Moving the start time to 0 puts it at the origin of the document timeline,
 * so the cube's position is a function of the timeline's current reading and
 * nothing else. Two consequences: a remount picks up exactly where the removed
 * element was, and every instance in the document runs in lockstep, because
 * they all read the same clock.
 *
 * Done through the animation object in a layout effect (before the first paint
 * of the new element) rather than through a negative `animation-delay`: the
 * delay would have to be computed during render from `Date.now()`, which is
 * both a different clock than the one the animation runs on — so the phase
 * would be off by the render-to-paint gap — and a value that differs between
 * the server and the client, i.e. a hydration mismatch on every render.
 */
function useTimelineSyncedAnimation(
  ref: RefObject<SVGSVGElement | null>,
  isAnimated: boolean,
) {
  useLayoutEffect(() => {
    const element = ref.current;

    // `getAnimations` is absent in jsdom, where there is nothing to sync.
    if (!isAnimated || !element?.getAnimations) return;

    for (const animation of element.getAnimations()) {
      // These elements carry nothing but the `dice*` animation, and it always
      // runs on the document timeline — the one timeline an explicit numeric
      // start time is meaningful against.
      if (animation.timeline === element.ownerDocument.timeline) {
        animation.startTime = 0;
      }
    }
  }, [isAnimated]);
}

interface CubeProps {
  index?: 0 | 1 | 2;
  style?: CSSProperties;
}

function Cube({ index, style }: CubeProps) {
  const ref = useRef<SVGSVGElement>(null);

  useTimelineSyncedAnimation(ref, index != null);

  return (
    <CubeElement
      ref={ref}
      mods={index != null ? { index } : undefined}
      style={style}
      viewBox="0 0 36 41"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
      aria-hidden="true"
    >
      <path
        fill="var(--loading-face-1-color)"
        d="M35.899 10.351l-18 10.25L.1 10.25l18-10.25L35.9 10.351z"
      />
      <path
        fill="var(--loading-face-2-color)"
        d="M18 41L0 30.75l.101-20.5L18 20.5"
      />
      <path
        fill="var(--loading-face-3-color)"
        d="M36 30.75L18 41V20.6l17.899-10.25L36 30.75z"
      />
    </CubeElement>
  );
}

const SIZE_MAP = {
  small: 32,
  medium: 64,
  large: 96,
};

export interface CubeLoadingAnimationProps extends CubeBlockProps {
  size?: 'small' | 'medium' | 'large' | number;
}

export function LoadingAnimation({
  size = 'medium',
  ...props
}: CubeLoadingAnimationProps) {
  const { t } = useI18n();
  const numSize: number = SIZE_MAP[size] || size || SIZE_MAP.medium;

  return (
    <Block
      role="img"
      aria-label={t('loadingAnimation.ariaLabel', 'Loading animation')}
      width={numSize}
      height={numSize * 1.1388888889}
      style={{ position: 'relative' }}
      {...props}
    >
      <Cube style={{ transform: 'translate(0%, 72.5%)' }} />
      <Cube style={{ transform: 'translate(98%, 72.5%)' }} />
      <Cube style={{ transform: 'translate(49%, 96.5%)' }} />
      <Cube index={0} />
      <Cube index={1} />
      <Cube index={2} />
    </Block>
  );
}
