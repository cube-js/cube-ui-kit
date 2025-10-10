import React, { HTMLAttributes, RefCallback, RefObject } from 'react';
import { TooltipTriggerState } from 'react-stately';

import { PlacementAxis } from '../../../shared';
import { Props } from '../../../tasty';

type Phase = 'enter' | 'entered' | 'exit' | 'unmounted';

interface TooltipContextProps {
  state?: TooltipTriggerState;
  ref?: RefObject<HTMLDivElement>;
  transitionRef?: RefCallback<HTMLDivElement>;
  placement?: PlacementAxis;
  arrowProps?: HTMLAttributes<HTMLElement>;
  overlayProps?: Props;
  minScale?: string | number;
  minOffset?: string | number;
  isMaterial?: boolean;
  isLight?: boolean;
  phase?: Phase;
  isShown?: boolean;
  updatePosition?: () => void;
}

export const TooltipContext = React.createContext<TooltipContextProps>({});
