import type { ComponentProps, ComponentType, ReactNode } from 'react';

import { isTextOnly } from './isTextOnly';

export function wrapText(
  children: ReactNode,
  WrapperComponent: ComponentType,
  wrapperProps: ComponentProps<typeof WrapperComponent> = {},
) {
  if (isTextOnly(children)) {
    return (
      <WrapperComponent {...wrapperProps}>
        {children}
      </WrapperComponent>
    )
  }

  return children;
}
