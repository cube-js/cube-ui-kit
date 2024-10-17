import { ReactNode } from 'react';

import { CubeIconProps, IconContainer } from './IconContainer';

export function wrapIcon(name: string, icon: ReactNode) {
  function Icon(props: CubeIconProps) {
    return (
      <IconContainer qa={name} aria-hidden="true" {...props}>
        {icon}
      </IconContainer>
    );
  }

  Icon.displayName = name;

  return Icon;
}
