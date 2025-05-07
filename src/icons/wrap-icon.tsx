import { ReactNode } from 'react';

import { CubeIconProps, Icon } from './Icon';

export function wrapIcon(name: string, icon: ReactNode) {
  function IconWrapper(props: CubeIconProps) {
    return (
      // use custom size to support legacy icons
      <Icon qa={name} aria-hidden="true" size="(@icon-size - 2px)" {...props}>
        {icon}
      </Icon>
    );
  }

  IconWrapper.displayName = name;

  return IconWrapper;
}
