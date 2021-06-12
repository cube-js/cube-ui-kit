export const OVERLAY_TRANSITION_CSS = `
  transform: translate(0, var(--gap));

  &.cube-overlay-transition-enter {
    opacity: 0;
    transform: translate(0, 0) scale(1, 0.5);
  }

  &.cube-overlay-transition-enter-active {
    opacity: 1;
    transition: all var(--transition) cubic-bezier(0, 0.5, 0, 1);
    transform: translate(0, var(--gap)) scale(1, 1);
  }

  &.cube-overlay-transition-exit {
    opacity: 1;
    transform: translate(0, var(--gap)) scale(1, 1);
  }

  &.cube-overlay-transition-exit-active {
    opacity: 0;
    transition: all var(--transition) ease-in;
    transform: translate(0, 0) scale(1, 0.5);
    pointer-events: none; 
  }
`;
