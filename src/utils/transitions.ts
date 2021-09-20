const DIRECTION_MAP = {
  initial: 'top center',
  top: 'bottom center',
  right: 'center left',
  left: 'center right',
  bottom: 'top center',
};
const TRANSLATE_MAP = {
  initial: 'translate(0, calc(-1 * var(--overlay-offset)))',
  top: 'translate(0, calc(1 * var(--overlay-offset)))',
  right: 'translate(calc(-1 * var(--overlay-offset)), 0)',
  left: 'translate(calc(1 * var(--overlay-offset)), 0)',
  bottom: 'translate(0, calc(-1 * var(--overlay-offset)))',
};

export interface OverlayTransitionCSSProps {
  suffix?: string;
  placement?: string;
  minScale?: string;
  minOffset?: string;
}

export const getOverlayTransitionCSS = ({
  suffix = '',
  placement = 'initial',
  minScale = '0.9',
  minOffset = '0px',
} = {}) => `
  &${suffix} {
    transform: var(--overlay-position);
    transform-origin: ${DIRECTION_MAP[placement]};
    --overlay-offset: ${minOffset};
    --overlay-hidden-x-scale: ${
      placement === 'top' || placement === 'bottom' || placement === 'initial'
        ? '1'
        : minScale
    };
    --overlay-hidden-y-scale: ${
      placement === 'left' || placement === 'right' ? '1' : minScale
    };
    --overlay-translate-visible: translate(0, 0);
    --overlay-translate-hidden: ${TRANSLATE_MAP[placement]};
    --overlay-transition: 180ms;
    --overlay-hidden-scale: scale(var(--overlay-hidden-x-scale), var(--overlay-hidden-y-scale));
    --overlay-normal-scale: scale(1, 1);
  }

  &.cube-overlay-transition-enter${suffix} {
    opacity: 0;
    transform: var(--overlay-hidden-scale) var(--overlay-translate-hidden);
  }

  &.cube-overlay-transition-enter-active${suffix} {
    opacity: 1;
    transition: transform var(--overlay-transition) cubic-bezier(0, .66, 0, .66), opacity var(--overlay-transition) cubic-bezier(0, .66, 0, .66);
    transform: var(--overlay-normal-scale) var(--overlay-translate-visible);
  }

  &.cube-overlay-transition-exit${suffix} {
    opacity: 1;
    transform: var(--overlay-normal-scale) var(--overlay-translate-visible);
  }

  &.cube-overlay-transition-exit-active${suffix} {
    opacity: 0;
    transition: transform var(--overlay-transition) cubic-bezier(.66, 0, .66, 0), opacity var(--overlay-transition) cubic-bezier(.66, 0, .66, 0);
    transform: var(--overlay-hidden-scale) var(--overlay-translate-hidden);
    pointer-events: none;
  }
`;
