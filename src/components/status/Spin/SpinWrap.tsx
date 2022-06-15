import styled from 'styled-components';

export const SpinWrap = styled.div.attrs<{ ownSize: number }>(
  ({ ownSize }) => ({
    role: 'presentation',
    style: { '--cube-spin-size': `${ownSize * 8}px` },
  }),
)`
  position: relative;
  display: inline-flex;
  width: var(--cube-spin-size);
  height: var(--cube-spin-size);
  opacity: 0.8;
  contain: size layout style paint;
  pointer-events: none;
  user-select: none;

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
