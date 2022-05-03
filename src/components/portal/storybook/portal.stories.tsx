import { useRef } from 'react';
import { ComponentMeta, Story } from '@storybook/react';

import { Portal } from '../Portal';
import { PortalProps } from '../types';
import { Basic, PortalOrderTemplate } from './templates';

export default {
  title: 'Helpers/Portal',
  component: Portal,
  parameters: { layout: 'centered' },
} as ComponentMeta<typeof Portal>;

export const Default = Basic.bind({});

export const Disabled = Basic.bind({});

export const Playground = Basic.bind({});
Disabled.args = {
  isDisabled: true,
};

export const CustomRoot: Story<PortalProps> = (args) => {
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

CustomRoot.parameters = {
  source: {
    type: 'code',
  },
};

export { PortalOrderTemplate as PortalOrder };
