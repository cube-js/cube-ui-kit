import { CubeTooltipTriggerProps, TooltipTrigger } from './TooltipTrigger';
import { Tooltip } from './Tooltip';
import { ReactNode } from 'react';
import { Styles } from '../../../styles/types';

export interface CubeTooltipProviderProps
  extends Omit<CubeTooltipTriggerProps, 'children'> {
  children: CubeTooltipTriggerProps['children'][0];
  title?: ReactNode;
  tooltipStyles?: Styles;
}

function TooltipProvider(props: CubeTooltipProviderProps) {
  const { title, children, tooltipStyles, ...otherProps } = props;

  return (
    <TooltipTrigger {...otherProps}>
      {children}
      <Tooltip styles={tooltipStyles}>{title}</Tooltip>
    </TooltipTrigger>
  );
}

let _TooltipProvider = TooltipProvider;
export { _TooltipProvider as TooltipProvider };
