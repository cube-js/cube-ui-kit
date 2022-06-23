import { memo } from 'react';
import styled from 'styled-components';
import { SpinCubeProps } from './types';

const fillByPosition = {
  top: '#7a77ff',
  right: '#727290',
  bottom: '#ff6492',
} as const;

export const Cube = memo(styled.div.attrs<SpinCubeProps>(({ position }) => ({
  role: 'presentation',
  style: {
    '--cube-spin-animation-name': `cube-spin-${position}`,
    '--cube-spin-fill': fillByPosition[position],
  },
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

  animation-name: var(--cube-spin-animation-name);
  animation-duration: 0.5s;
  animation-iteration-count: infinite;
  animation-timing-function: cubic-bezier(0.53, 0.11, 0.32, 0.84);

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
    33.3% {
      transform: translate(100%, 0%);
    }
    66.6% {
      transform: translate(100%, 0%);
    }
    100% {
      transform: translate(100%, 0%);
    }
  }

  @keyframes cube-spin-right {
    0% {
      transform: translate(100%, 100%);
    }
    33.3% {
      transform: translate(100%, 100%);
    }
    66.6% {
      transform: translate(100%, 100%);
    }
    100% {
      transform: translate(0%, 100%);
    }
  }

  @keyframes cube-spin-bottom {
    0% {
      transform: translate(0%, 100%);
    }
    33.3% {
      transform: translate(0%, 100%);
    }
    66.6% {
      transform: translate(0%, 0%);
    }
    100% {
      transform: translate(0%, 0%);
    }
  }
`);
