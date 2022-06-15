import { memo } from 'react';
import styled, { css } from 'styled-components';
import { SpinCubeProps } from './types';
import { buildSpinAnimation } from './build-spin-animation';

export const SpinCube = memo(styled.div.attrs(() => ({
  role: 'presentation',
}))<SpinCubeProps>`
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

  ${({ position }) => {
    if (position === 'top') {
      return css`
        animation-name: spin-top;
        @keyframes spin-top {
          ${buildSpinAnimation([0, 0], 0)}
        }
      `;
    }
    if (position === 'right') {
      return css`
        animation-name: spin-right;
        @keyframes spin-right {
          ${buildSpinAnimation([1, 1], 1)}
        }
      `;
    }
    if (position === 'bottom') {
      return css`
        animation-name: spin-bottom;
        @keyframes spin-bottom {
          ${buildSpinAnimation([0, 1], 2)}
        }
      `;
    }
  }}
  @media (prefers-reduced-motion) {
    animation-play-state: paused;
  }
  &:: before {
    --cube-spin-cube-round-radius: calc((4 / 100) * var(--cube-spin-size));

    content: '';
    display: block;
    width: 100%;
    height: 100%;
    border-radius: var(--cube-spin-cube-round-radius);

    ${({ position }) => {
      if (position === 'top') {
        return css`
          background-color: #7a77ff;
        `;
      }
      if (position === 'right') {
        return css`
          background-color: #727290;
        `;
      }
      if (position === 'bottom') {
        return css`
          background-color: #ff6492;
        `;
      }
    }}
  }
`);
