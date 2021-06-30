export const OVERLAY_TRANSITION_CSS = `
  transform: var(--overlay-position);
  transform-origin: calc(100% + calc(2 * var(--gap))) center;
  --overlay-translate: translate(0, 0); 
  --overlay-transition: 180ms;
  --overlay-hidden-scale: scale(1, 0.9);
  --overlay-normal-scale: scale(1, 1);

  &.cube-overlay-transition-enter {
    opacity: 0;
    transform: var(--overlay-hidden-scale) var(--overlay-translate);
  }

  &.cube-overlay-transition-enter-active {
    opacity: 1;
    transition: transform var(--overlay-transition) cubic-bezier(0, .66, 0, .66), opacity var(--overlay-transition) cubic-bezier(0, .66, 0, .66);
    transform: var(--overlay-normal-scale) var(--overlay-translate);
  }

  &.cube-overlay-transition-exit {
    opacity: 1;
    transform: var(--overlay-normal-scale) var(--overlay-translate);
  }

  &.cube-overlay-transition-exit-active {
    opacity: 0;
    transition: transform var(--overlay-transition) cubic-bezier(.66, 0, .66, 0), opacity var(--overlay-transition) cubic-bezier(.66, 0, .66, 0);
    transform: var(--overlay-hidden-scale) var(--overlay-translate);
    pointer-events: none; 
  }
`;
