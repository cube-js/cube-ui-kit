import React, { HTMLAttributes, RefObject } from 'react';
import { TooltipTriggerState } from '@react-stately/tooltip';
import { PlacementAxis } from '../../shared';
import { Props } from '../../components/types';

interface TooltipContextProps {
  state?: TooltipTriggerState;
  ref?: RefObject<HTMLDivElement>;
  placement?: PlacementAxis;
  arrowProps?: HTMLAttributes<HTMLElement>;
  overlayProps?: Props;
}

export const TooltipContext = React.createContext<TooltipContextProps>({});
