import { useRef } from 'react';
import { Story } from '@storybook/react';
import { Portal } from '../Portal';
import { PortalProps } from '../types';
import { Basic } from './templates';

// eslint-disable-next-line storybook/default-exports
export const Default = Basic.bind({});

export const Disabled = Basic.bind({});

export const Playground = Basic.bind({});
Disabled.args = {
  isDisabled: true,
};

const CustomRootTemplate: Story<PortalProps> = function PortalWithCustomRoot(
  args,
) {
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

export const CustomRoot = CustomRootTemplate.bind({});
CustomRoot.parameters = {
  docs: {
    source: {
      type: 'code',
    },
  },
};
