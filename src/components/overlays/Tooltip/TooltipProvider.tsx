import { ReactNode, useEffect, useState } from 'react';

import { Styles } from '../../../tasty';

import { CubeTooltipTriggerProps, TooltipTrigger } from './TooltipTrigger';
import { CubeTooltipProps, Tooltip } from './Tooltip';

export interface CubeTooltipProviderProps
  extends Omit<CubeTooltipTriggerProps, 'children'> {
  children: CubeTooltipTriggerProps['children'][0];
  title?: ReactNode;
  tooltipStyles?: Styles;
  width?: CubeTooltipProps['width'];
}

export function TooltipProvider(props: CubeTooltipProviderProps) {
  const [rendered, setRendered] = useState(false);
  const { title, children, tooltipStyles, width, ...otherProps } = props;

  useEffect(() => {
    setRendered(true);
  }, []);

  return rendered ? (
    <TooltipTrigger {...otherProps}>
      {children}
      <Tooltip styles={tooltipStyles} {...(width ? { width } : null)}>
        {title}
      </Tooltip>
    </TooltipTrigger>
  ) : (
    <>{children}</>
  );
}
