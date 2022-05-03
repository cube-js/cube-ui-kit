import { Story } from '@storybook/react';
import { useRef } from 'react';
import { Portal } from '../../Portal';
import { PortalProps } from '../../types';

export const CustomRootTemplate: Story<PortalProps> = (args) => {
  const rootRef = useRef(null);

  return (
    <>
      Disabled portal's content should be there {' -> '}
      <Portal {...args} root={rootRef}>
        Portal's content
      </Portal>
      <div ref={rootRef}>
        Using custom portal root content should be there {' -> '}
      </div>
      By default, Portal content should be there {' -> '}
    </>
  );
};
