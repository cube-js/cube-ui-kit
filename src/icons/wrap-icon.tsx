import { ReactElement } from 'react';

import { CubeIconProps, Icon } from './Icon';

export function wrapIcon(name: string, icon: ReactElement) {
  function IconWrapper(props: CubeIconProps) {
    return (
      // use custom size to support legacy icons
      <Icon qa={name} aria-hidden="true" {...props}>
        {icon}
      </Icon>
    );
  }

  IconWrapper.displayName = name;

  return IconWrapper;
}
