import { Styles } from '@tenphi/tasty';
import { isValidElement, ReactElement, ReactNode, RefObject } from 'react';
import { useIsSSR } from 'react-aria';

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
  const isSSR = useIsSSR();
  const { title, children, tooltipStyles, width, isDisabled, ...otherProps } =
    props;

  const isFunction = typeof children === 'function';

  // Render without the tooltip on the server, and while hydrating it.
  //
  // `useIsSSR` rather than a `rendered` state flipped from an effect: the
  // state version answered `false` on the first client render too, so every
  // client-rendered tree paid a second commit — and its trigger a remount —
  // one task after everything watching the mount had called it finished.
  if (isSSR) {
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
