import { tasty } from '@tenphi/tasty';
import { CSSProperties } from 'react';

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

interface CubeProps {
  index?: 0 | 1 | 2;
  style?: CSSProperties;
}

function Cube({ index, style }: CubeProps) {
  return (
    <CubeElement
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
  const numSize: number = SIZE_MAP[size] || size || SIZE_MAP.medium;

  return (
    <Block
      role="img"
      aria-label="Loading animation"
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
