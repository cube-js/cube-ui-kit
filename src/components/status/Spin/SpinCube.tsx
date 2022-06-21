import { memo } from 'react';
import styled from 'styled-components';
import { SpinCubeProps } from './types';

const fillByPosition = {
  top: '#7a77ff',
  right: '#727290',
  bottom: '#ff6492',
} as const;

export const SpinCube = memo(styled.div.attrs<SpinCubeProps>(
  ({ position }) => ({
    role: 'presentation',
    style: {
      '--cube-spin-animation-name': `cube-spin-${position}`,
      '--cube-spin-fill': fillByPosition[position],
    },
  }),
)`
  --cube-spin-cube-size: calc(var(--cube-spin-size) / 3);
  --cube-spin-cube-border-width: calc(4 / 100 * var(--cube-spin-size));
  --cube-spin-cube-position: calc((10 / 100) * var(--cube-spin-size));

  box-sizing: content-box;
  position: absolute;
  top: var(--cube-spin-cube-position);
  left: var(--cube-spin-cube-position);
  width: var(--cube-spin-cube-size);
  height: var(--cube-spin-cube-size);
  border: var(--cube-spin-cube-border-width) solid transparent;
  overflow: hidden;
  contain: size layout style paint;

  animation-duration: 2s;
  animation-iteration-count: infinite;
  animation-timing-function: cubic-bezier(0.53, 0.11, 0.32, 0.84);
  animation-name: var(--cube-spin-animation-name);

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
      transform: translate(0%, 0%);
    }
    9.09% {
      transform: translate(100%, 0%);
    }
    27.27% {
      transform: translate(100%, 0%);
    }
    36.36% {
      transform: translate(100%, 100%);
    }
    54.54% {
      transform: translate(100%, 100%);
    }
    63.63% {
      transform: translate(0%, 100%);
    }
    81.81% {
      transform: translate(0%, 100%);
    }
    90.9% {
      transform: translate(0%, 0%);
    }
    100% {
      transform: translate(0%, 0%);
    }
  }

  @keyframes cube-spin-bottom {
    0% {
      transform: translate(0%, 100%);
    }
    8.3% {
      transform: translate(0%, 100%);
    }
    16.6% {
      transform: translate(0%, 0%);
    }
    33.3% {
      transform: translate(0%, 0%);
    }
    41.6% {
      transform: translate(100%, 0%);
    }
    58.3% {
      transform: translate(100%, 0%);
    }
    66.6% {
      transform: translate(100%, 100%);
    }
    83.3% {
      transform: translate(100%, 100%);
    }
    91.6% {
      transform: translate(0%, 100%);
    }
    100% {
      transform: translate(0%, 100%);
    }
  }

  @keyframes cube-spin-right {
    0% {
      transform: translate(100%, 100%);
    }
    16.6% {
      transform: translate(100%, 100%);
    }
    25% {
      transform: translate(0%, 100%);
    }
    41.6% {
      transform: translate(0%, 100%);
    }
    50% {
      transform: translate(0%, 0%);
    }
    66.6% {
      transform: translate(0%, 0%);
    }
    75% {
      transform: translate(100%, 0%);
    }
    91.6% {
      transform: translate(100%, 0%);
    }
    100% {
      transform: translate(100%, 100%);
    }
  }
`);
