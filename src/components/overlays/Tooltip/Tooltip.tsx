import { createDOMRef } from '@react-spectrum/utils';
import { DOMRefValue } from '@react-types/shared';
import {
  ForwardedRef,
  forwardRef,
  useContext,
  useImperativeHandle,
  useRef,
} from 'react';
import { AriaTooltipProps, useTooltip } from 'react-aria';
import styled from 'styled-components';

import { PlacementAxis } from '../../../shared';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  Styles,
  tasty,
} from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { getOverlayTransitionCSS } from '../../../utils/transitions';

import { TooltipContext } from './context';

export type { AriaTooltipProps };

const TooltipElement = tasty({
  styles: {
    display: 'block',
    fill: '#dark.85',
    color: '#white',
    width: 'initial 36x max-content',
    radius: true,
    padding: '.75x 1x',
    preset: 't3',
    backdropFilter: 'blur(.5x)',
    whiteSpace: 'pre-line',
    pointerEvents: {
      '': 'none',
      material: 'auto',
    },
  },
});

const TooltipTipElement = tasty({
  styles: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    border: '.5x #clear',
    borderTop: '.5x solid #dark.85',
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

const StyledTooltipElement = styled(TooltipElement)`
  ${(props) => {
    return getOverlayTransitionCSS({
      placement: props?.['data-position'],
      minOffset: '0',
      minScale: 1,
    });
  }}
`;

export interface CubeTooltipProps
  extends BaseProps,
    ContainerStyleProps,
    AriaTooltipProps {
  tipStyles?: Styles;
  showIcon?: boolean;
  placement?: PlacementAxis;
  isMaterial?: boolean;
  isOpen?: boolean;
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
    arrowProps,
    state,
    overlayProps,
    minOffset,
    minScale,
    ...tooltipProviderProps
  } = useContext(TooltipContext);

  let defaultRef = useRef<HTMLDivElement>(null);

  const finalOverlayRef = overlayRef ?? defaultRef;

  props = mergeProps(props, tooltipProviderProps);

  let {
    placement = 'top',
    isOpen,
    tipStyles,
    showIcon,
    isMaterial,
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

  return (
    <StyledTooltipElement
      {...tooltipProps}
      {...overlayProps}
      ref={overlayRef}
      styles={styles}
      mods={{
        open: isOpen,
        material: isMaterial,
      }}
      data-min-offset={minOffset}
      data-min-scale={minScale}
      data-placement={placement}
    >
      {props.children}
      <TooltipTipElement
        data-placement={placement}
        styles={tipStyles}
        {...arrowProps}
      />
    </StyledTooltipElement>
  );
}

/**
 * Display container for Tooltip content. Has a directional arrow dependent on its placement.
 */
let _Tooltip = forwardRef(Tooltip);

_Tooltip.displayName = 'Tooltip';

export { _Tooltip as Tooltip };
