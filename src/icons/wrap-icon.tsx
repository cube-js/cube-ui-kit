import { ReactNode } from 'react';

import { IconContainerProps, IconContainer } from './IconContainer';

export function wrapIcon(name: string, icon: ReactNode) {
  function Icon(props: IconContainerProps) {
    return (
      <IconContainer qa={name} aria-hidden="true" {...props}>
        {icon}
      </IconContainer>
    );
  }

  Icon.displayName = name;

  return Icon;
}
