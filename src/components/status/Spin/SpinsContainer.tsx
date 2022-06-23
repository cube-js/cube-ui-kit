import styled from 'styled-components';

export const SpinsContainer = styled.div.attrs<{ ownSize: number }>(
  ({ ownSize }) => ({
    role: 'presentation',
    style: { '--cube-spin-size': `${ownSize * 8}px` },
  }),
)`
  box-sizing: border-box;
  position: relative;
  display: inline-flex;
  place-content: center;
  padding: calc(10 / 100 * var(--cube-spin-size));
  width: var(--cube-spin-size);
  height: var(--cube-spin-size);
  opacity: 0.8;
  contain: size layout style paint;

  animation: cube-spin-rotate 2s infinite steps(4);

  @keyframes cube-spin-rotate {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion) {
    animation: cube-spin-reduced-motion 2s infinite ease-in-out;

    @keyframes cube-spin-reduced-motion {
      0% {
        opacity: 0.4;
      }
      50% {
        opacity: 0.8;
      }
      100% {
        opacity: 0.4;
      }
    }
  }
`;
