const DIRECTION_MAP = {
  top: 'bottom center',
  right: 'center left',
  left: 'center right',
  bottom: 'top center',
};

export const getOverlayTransitionCSS = ({
  placement = 'initial',
  suffix = '',
  minScale = '0.9',
} = {}) => `
  &${suffix} {
    transform: var(--overlay-position);
    transform-origin: ${DIRECTION_MAP[placement]};
    --overlay-hidden-x-scale: ${
      placement === 'top' || placement === 'bottom' || placement === 'initial'
        ? '1'
        : minScale
    };
    --overlay-hidden-y-scale: ${
      placement === 'left' || placement === 'right' ? '1' : minScale
    };
    --overlay-translate: translate(0, 0);
    --overlay-transition: 180ms;
    --overlay-hidden-scale: scale(var(--overlay-hidden-x-scale), var(--overlay-hidden-y-scale));
    --overlay-normal-scale: scale(1, 1);
  }

  &.cube-overlay-transition-enter${suffix} {
    opacity: 0;
    transform: var(--overlay-hidden-scale) var(--overlay-translate);
  }

  &.cube-overlay-transition-enter-active${suffix} {
    opacity: 1;
    transition: transform var(--overlay-transition) cubic-bezier(0, .66, 0, .66), opacity var(--overlay-transition) cubic-bezier(0, .66, 0, .66);
    transform: var(--overlay-normal-scale) var(--overlay-translate);
  }

  &.cube-overlay-transition-exit${suffix} {
    opacity: 1;
    transform: var(--overlay-normal-scale) var(--overlay-translate);
  }

  &.cube-overlay-transition-exit-active${suffix} {
    opacity: 0;
    transition: transform var(--overlay-transition) cubic-bezier(.66, 0, .66, 0), opacity var(--overlay-transition) cubic-bezier(.66, 0, .66, 0);
    transform: var(--overlay-hidden-scale) var(--overlay-translate);
    pointer-events: none;
  }
`;
