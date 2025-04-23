const DIRECTION_MAP = {
  initial: 'top center',
  top: 'bottom center',
  right: 'center left',
  left: 'center right',
  bottom: 'top center',
};
const TRANSLATE_MAP = {
  initial: 'translate(0px, calc(-1 * var(--overlay-offset)))',
  top: 'translate(0px, calc(1 * var(--overlay-offset)))',
  right: 'translate(calc(-1 * var(--overlay-offset)), 0px)',
  left: 'translate(calc(1 * var(--overlay-offset)), 0px)',
  bottom: 'translate(0px, calc(-1 * var(--overlay-offset)))',
};

export interface OverlayTransitionCSSProps {
  suffix?: string;
  placement?: string;
  minScale?: string | number;
  minOffset?: string;
  forChild?: boolean;
}

export const getOverlayTransitionCSS = ({
  suffix = '',
  placement = 'initial',
  minScale = 0.8,
  minOffset = '8px',
}: OverlayTransitionCSSProps = {}) => `
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
    --overlay-translate-visible: translate(0px, 0px);
    --overlay-translate-hidden: ${TRANSLATE_MAP[placement]};
    --overlay-transition: 120ms;
    --overlay-hidden-scale: scale(var(--overlay-hidden-x-scale), var(--overlay-hidden-y-scale));
    --overlay-normal-scale: scale(1, 1);
  }

  &.cube-overlay-transition-enter${suffix} {
    opacity: 0;
    transform: var(--overlay-translate-hidden) var(--overlay-hidden-scale);
  }

  &.cube-overlay-transition-enter-active${suffix} {
    opacity: 1;
    transform: var(--overlay-translate-visible) var(--overlay-normal-scale);
    transition: transform var(--overlay-transition) cubic-bezier(0, .66, 0, .66), opacity var(--overlay-transition) cubic-bezier(0, .66, 0, .66);
    pointer-events: none;
  }

  &.cube-overlay-transition-exit${suffix} {
    opacity: 1;
    transform: var(--overlay-translate-visible) var(--overlay-normal-scale);
  }

  &.cube-overlay-transition-exit-active${suffix} {
    opacity: 0;
    transform: var(--overlay-translate-hidden) var(--overlay-hidden-scale);
    pointer-events: none;
    transition: transform var(--overlay-transition) cubic-bezier(.66, 0, .66, 0), opacity var(--overlay-transition) cubic-bezier(.66, 0, .66, 0);
  }
`;
