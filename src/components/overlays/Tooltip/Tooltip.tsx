import { createDOMRef } from '@react-spectrum/utils';
import { DOMRefValue } from '@react-types/shared';
import {
  ForwardedRef,
  forwardRef,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { AriaTooltipProps, useTooltip } from 'react-aria';

import { PlacementAxis } from '../../../shared';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  Styles,
  tasty,
} from '../../../tasty';
import { mergeProps, mergeRefs, useLayoutEffect } from '../../../utils/react';

import { TooltipContext } from './context';

export type { AriaTooltipProps };

const TooltipElement = tasty({
  styles: {
    display: 'block',
    fill: {
      '': '#dark.85',
      light: '#white',
    },
    color: {
      '': '#white',
      light: '#dark-02',
    },
    width: 'initial 36x max-content',
    radius: true,
    padding: '.75x 1x',
    preset: 't4',
    backdropFilter: 'blur(.5x)',
    whiteSpace: 'pre-line',
    pointerEvents: {
      '': 'none',
      material: 'auto',
    },
    filter: {
      '': false,
      light: 'drop-shadow(0 0 1px #dark.2)',
    },
    transition:
      'translate $transition ease-out, scale $transition ease-out, theme $transition ease-out',
    translate: {
      '': '0 0',
      'open & [data-placement="top"]': '0 0',
      '!open & [data-placement="top"]': '0 1x',
      'open & [data-placement="bottom"]': '0 0',
      '!open & [data-placement="bottom"]': '0 -1x',
      'open & [data-placement="left"]': '0 0',
      '!open & [data-placement="left"]': '1x 0',
      'open & [data-placement="right"]': '0 0',
      '!open & [data-placement="right"]': '-1x 0',
    },
    transformOrigin: {
      '': 'top center',
      '[data-placement="top"]': 'bottom center',
      '[data-placement="left"]': 'right center',
      '[data-placement="right"]': 'left center',
    },
    scale: {
      '': '1 1',
      '!open': '1 .8',
      '!open & ([data-placement="left"] | [data-placement="right"])': '.8 1',
    },
    opacity: {
      '': 1,
      '!open': 0.001,
    },
  },
});

const TooltipTipElement = tasty({
  styles: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    border: '.5x #clear',
    borderTop: {
      '': '.5x solid #dark.85',
      light: '.5x solid #white',
    },
    borderBottom: '0',
    top: {
      '': 'initial',
      '[data-placement="left"] | [data-placement="right"]': '50%',
      '[data-placement="top"]': '100%',
    },
    left: {
      '': 'initial',
      '[data-placement="top"] | [data-placement="bottom"]': '50%',
      '[data-placement="left"]': '100%',
    },
    right: {
      '': 'initial',
      '[data-placement="right"]': '100%',
    },
    bottom: {
      '': 'initial',
      '[data-placement="bottom"]': '100%',
    },
    transform: {
      '': 'translate((-.375x - 1px), 0)',
      '[data-placement="bottom"]':
        'translate((-.375x - 1px), 0) rotate(180deg)',
      '[data-placement="left"]': 'translate(-.25x, -.25x) rotate(270deg)',
      '[data-placement="right"]': 'translate(.25x, -.25x) rotate(90deg)',
    },
    transition: 'theme',
  },
});

export interface CubeTooltipProps
  extends BaseProps,
    ContainerStyleProps,
    AriaTooltipProps {
  tipStyles?: Styles;
  showIcon?: boolean;
  placement?: PlacementAxis;
  isMaterial?: boolean;
  isOpen?: boolean;
  isLight?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  defaultOpen?: boolean;
  shouldFlip?: boolean;
}

function Tooltip(
  props: CubeTooltipProps,
  ref: ForwardedRef<DOMRefValue<HTMLDivElement>>,
) {
  let {
    ref: overlayRef,
    transitionRef,
    arrowProps,
    state,
    overlayProps,
    minOffset,
    minScale,
    isMaterial: isMaterialContext,
    isLight: isLightContext,
    phase,
    isShown,
    updatePosition,
    ...tooltipProviderProps
  } = useContext(TooltipContext);

  const defaultRef = useRef<HTMLDivElement>(null);
  const combinedRef = mergeRefs(transitionRef, overlayRef ?? defaultRef);
  const finalOverlayRef = overlayRef ?? defaultRef;

  props = mergeProps(props, tooltipProviderProps);

  let {
    placement = 'top',
    isOpen,
    tipStyles,
    showIcon,
    isMaterial = isMaterialContext,
    isLight = isLightContext,
    ...otherProps
  } = props;

  const styles = extractStyles(otherProps, CONTAINER_STYLES);

  let { tooltipProps } = useTooltip(props, state);

  // Sync ref with overlayRef from context.
  useImperativeHandle(ref, () => createDOMRef(finalOverlayRef));

  if (typeof minOffset === 'number') {
    minOffset = `${minOffset}px`;
  }

  if (typeof minScale === 'number') {
    minScale = String(minScale);
  }

  // Extract primary placement direction for consistent styling
  const placementDirection = placement?.split(' ')[0] || placement || 'top';

  const mods = useMemo(() => {
    return {
      material: isMaterial,
      light: isLight,
      open: isShown ?? isOpen,
    };
  }, [isMaterial, isShown, isOpen, isLight]);

  // Update position when tooltip becomes visible
  useLayoutEffect(() => {
    updatePosition?.();
  }, []);

  return (
    <TooltipElement
      {...tooltipProps}
      {...overlayProps}
      ref={combinedRef}
      styles={styles}
      mods={mods}
      data-min-offset={minOffset}
      data-min-scale={minScale}
      data-placement={placementDirection}
      data-phase={phase}
    >
      {props.children}
      <TooltipTipElement
        data-placement={placementDirection}
        styles={tipStyles}
        mods={mods}
        {...arrowProps}
      />
    </TooltipElement>
  );
}

/**
 * Display container for Tooltip content. Has a directional arrow dependent on its placement.
 */
let _Tooltip = forwardRef(Tooltip);

_Tooltip.displayName = 'Tooltip';

export { _Tooltip as Tooltip };
