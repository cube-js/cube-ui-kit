import { memo, CSSProperties } from 'react';
import styled from 'styled-components';

import { SpinCubeProps } from './types';

const fillByPosition = {
  top: '#7a77ff',
  right: '#727290',
  bottom: '#ff6492',
} as const;

export const Cube = memo(styled.div.attrs<SpinCubeProps>(({ $position }) => ({
  role: 'presentation',
  style: {
    '--cube-spin-animation-name': `cube-spin-${$position}`,
    '--cube-spin-fill': fillByPosition[$position],
  } as CSSProperties,
}))`
  --cube-spin-cube-border-width: calc(4 / 100 * var(--cube-spin-size));
  --cube-spin-cube-border-compensation: calc(
    -1 * (var(--cube-spin-cube-border-width))
  );
  --cube-spin-cube-size: calc(
    (100% - 2 * var(--cube-spin-cube-border-width)) / 2
  );

  box-sizing: content-box;
  position: absolute;
  top: var(--cube-spin-cube-border-compensation);
  left: var(--cube-spin-cube-border-compensation);
  width: var(--cube-spin-cube-size);
  height: var(--cube-spin-cube-size);
  border: var(--cube-spin-cube-border-width) solid transparent;
  overflow: hidden;
  contain: size layout style paint;
  pointer-events: none;
  user-select: none;

  animation-name: var(--cube-spin-animation-name);
  animation-duration: 2.2s;
  animation-iteration-count: infinite;
  animation-timing-function: cubic-bezier(0.5, 0.05, 0.3, 0.95);

  @media (prefers-reduced-motion) {
    animation-play-state: paused;
  }

  &::before {
    --cube-spin-cube-round-radius: calc((4 / 100) * var(--cube-spin-size));

    content: '';
    display: block;
    width: 100%;
    height: 100%;
    border-radius: var(--cube-spin-cube-round-radius);

    background-color: var(--cube-spin-fill);
  }

  @keyframes cube-spin-top {
    0% {
      transform: translate(0%, 0);
    }
    8% {
      transform: translate(100%, 0);
    }
    17% {
      transform: translate(100%, 0);
    }
    25% {
      transform: translate(100%, 0);
    }
    33% {
      transform: translate(100%, 100%);
    }
    42% {
      transform: translate(100%, 100%);
    }
    50% {
      transform: translate(100%, 100%);
    }
    58% {
      transform: translate(0, 100%);
    }
    67% {
      transform: translate(0, 100%);
    }
    75% {
      transform: translate(0, 100%);
    }
    83% {
      transform: translate(0, 0);
    }
    92% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(0, 0);
    }
  }

  @keyframes cube-spin-right {
    0% {
      transform: translate(100%, 100%);
    }
    8% {
      transform: translate(100%, 100%);
    }
    17% {
      transform: translate(100%, 100%);
    }
    25% {
      transform: translate(0, 100%);
    }
    33% {
      transform: translate(0, 100%);
    }
    42% {
      transform: translate(0, 100%);
    }
    50% {
      transform: translate(0, 0);
    }
    58% {
      transform: translate(0, 0);
    }
    67% {
      transform: translate(0, 0);
    }
    75% {
      transform: translate(100%, 0);
    }
    83% {
      transform: translate(100%, 0);
    }
    92% {
      transform: translate(100%, 0);
    }
    100% {
      transform: translate(100%, 100%);
    }
  }

  @keyframes cube-spin-bottom {
    0% {
      transform: translate(0, 100%);
    }
    8% {
      transform: translate(0, 100%);
    }
    17% {
      transform: translate(0, 0);
    }
    25% {
      transform: translate(0, 0);
    }
    33% {
      transform: translate(0, 0);
    }
    42% {
      transform: translate(100%, 0);
    }
    50% {
      transform: translate(100%, 0);
    }
    58% {
      transform: translate(100%, 0);
    }
    67% {
      transform: translate(100%, 100%);
    }
    75% {
      transform: translate(100%, 100%);
    }
    83% {
      transform: translate(100%, 100%);
    }
    92% {
      transform: translate(0, 100%);
    }
    100% {
      transform: translate(0, 100%);
    }
  }
`);
