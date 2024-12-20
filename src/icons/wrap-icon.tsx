import { ReactNode } from 'react';

import { CubeIconProps, Icon } from './Icon';

export function wrapIcon(name: string, icon: ReactNode) {
  function IconWrapper(props: CubeIconProps) {
    return (
      <Icon qa={name} aria-hidden="true" {...props}>
        {icon}
      </Icon>
    );
  }

  IconWrapper.displayName = name;

  return IconWrapper;
}
