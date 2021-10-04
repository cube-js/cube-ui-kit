import { CubeTooltipTriggerProps, TooltipTrigger } from './TooltipTrigger';
import { CubeTooltipProps, Tooltip } from './Tooltip';
import { ReactNode } from 'react';
import { Styles } from '../../../styles/types';

export interface CubeTooltipProviderProps
  extends Omit<CubeTooltipTriggerProps, 'children'> {
  children: CubeTooltipTriggerProps['children'][0];
  title?: ReactNode;
  tooltipStyles?: Styles;
  width?: CubeTooltipProps['width'];
}

function TooltipProvider(props: CubeTooltipProviderProps) {
  const { title, children, tooltipStyles, width, ...otherProps } = props;

  return (
    <TooltipTrigger {...otherProps}>
      {children}
      <Tooltip styles={tooltipStyles} {...(width ? { width } : null)}>
        {title}
      </Tooltip>
    </TooltipTrigger>
  );
}

let _TooltipProvider = TooltipProvider;
export { _TooltipProvider as TooltipProvider };
