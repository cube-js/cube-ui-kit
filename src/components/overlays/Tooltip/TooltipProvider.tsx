import {
  isValidElement,
  ReactElement,
  ReactNode,
  RefObject,
  useEffect,
  useState,
} from 'react';

import { Styles } from '../../../tasty';

import { CubeTooltipProps, Tooltip } from './Tooltip';
import {
  CubeTooltipTriggerProps,
  TooltipTrigger,
  TooltipTriggerFunction,
} from './TooltipTrigger';

export interface CubeTooltipProviderProps
  extends Omit<CubeTooltipTriggerProps, 'children'> {
  children: ReactNode | TooltipTriggerFunction;
  title?: ReactNode;
  tooltipStyles?: Styles;
  width?: CubeTooltipProps['width'];
}

export function TooltipProvider(props: CubeTooltipProviderProps): ReactElement {
  const [rendered, setRendered] = useState(false);
  const { title, children, tooltipStyles, width, isDisabled, ...otherProps } =
    props;

  useEffect(() => {
    setRendered(true);
  }, []);

  const isFunction = typeof children === 'function';

  // SSR: render without tooltip
  if (!rendered) {
    return (
      <>
        {isFunction
          ? children({}, { current: null } as unknown as RefObject<HTMLElement>)
          : children}
      </>
    ) as ReactElement;
  }

  // Both patterns pass through to TooltipTrigger
  // The difference is whether we pass function or element as first child
  return (
    <TooltipTrigger
      {...otherProps}
      isDisabled={isDisabled}
      disableFocusableProvider={isFunction}
    >
      {isFunction ||
      isValidElement(children) ||
      typeof children === 'string' ? (
        children
      ) : (
        <>{children}</>
      )}
      {isDisabled ? (
        <div />
      ) : (
        <Tooltip styles={tooltipStyles} {...(width ? { width } : null)}>
          {title}
        </Tooltip>
      )}
    </TooltipTrigger>
  );
}
