import { forwardRef, useContext, useImperativeHandle, useRef } from 'react';
import { mergeProps } from '@react-aria/utils';
import { createDOMRef } from '@react-spectrum/utils';
import { TooltipContext } from './context';
import { useTooltip } from '@react-aria/tooltip';
import { Base } from '../../components/Base';
import { extractStyles } from '../../utils/styles';
import { CONTAINER_STYLES } from '../../styles/list';
import { useContextStyles } from '../../providers/Styles';
import { getOverlayTransitionCSS } from '../../utils/transitions';
import { Styles } from '../../styles/types';
import { BaseProps, ContainerStyleProps } from '../../components/types';
import { AriaTooltipProps } from '@react-types/tooltip';
import { PlacementAxis } from '../../shared';

const TOOLTIP_STYLES: Styles = {
  display: 'block',
  fill: '#dark.70',
  color: '#white',
  width: 'initial 28x max-content',
  radius: true,
  padding: '.5x 1x',
  size: 'sm',
};

const TIP_STYLES: Styles = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  border: '.75x #clear',
  borderTop: '.75x solid #dark.70',
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
    '[data-placement="bottom"]': 'translate((-.375x - 1px), 0) rotate(180deg)',
    '[data-placement="left"]':
      'translate(-.375x, (-.375x - 1px)) rotate(270deg)',
    '[data-placement="right"]':
      'translate(.375x, (-.375x - 1px)) rotate(90deg)',
  },
};

export interface CubeTooltipProps
  extends BaseProps,
    ContainerStyleProps,
    AriaTooltipProps {
  tipStyles?: Styles;
  showIcon?: boolean;
  placement?: PlacementAxis;
}

function Tooltip(props: CubeTooltipProps, ref) {
  let {
    ref: overlayRef,
    arrowProps,
    state,
    overlayProps,
    ...tooltipProviderProps
  } = useContext(TooltipContext);

  let defaultRef = useRef<HTMLDivElement>(null);

  overlayRef = overlayRef || defaultRef;

  props = mergeProps(props, tooltipProviderProps);

  let { placement = 'top', isOpen, tipStyles, showIcon, ...otherProps } = props;

  const styles = extractStyles(otherProps, CONTAINER_STYLES, {
    ...TOOLTIP_STYLES,
    ...useContextStyles('Tooltip', props),
  });

  tipStyles = {
    ...TIP_STYLES,
    ...useContextStyles('Tooltip_Tip'),
    ...tipStyles,
  };

  let { tooltipProps } = useTooltip(props, state);

  // Sync ref with overlayRef from context.
  useImperativeHandle(ref, () =>
    overlayRef ? createDOMRef(overlayRef) : null,
  );

  return (
    <Base
      {...tooltipProps}
      {...overlayProps}
      css={getOverlayTransitionCSS({ placement })}
      styles={styles}
      mods={{
        open: isOpen,
      }}
      data-placement={placement}
      ref={overlayRef}
    >
      {props.children}
      <Base data-placement={placement} styles={tipStyles} {...arrowProps} />
    </Base>
  );
}

/**
 * Display container for Tooltip content. Has a directional arrow dependent on its placement.
 */
let _Tooltip = forwardRef(Tooltip);
export { _Tooltip as Tooltip };
