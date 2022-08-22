import { Story } from '@storybook/react';

import { Block } from '../../../Block';
import { Portal } from '../../Portal';
import { PortalProps } from '../../types';

export const PortalOrderTemplate: Story<PortalProps> = (args) => (
  <>
    <Portal {...args}>
      <Block>Portal 1</Block>
      <Portal>
        <Block>Portal 3</Block>
      </Portal>
      <Portal>
        <Block>Portal 4</Block>
      </Portal>
    </Portal>
    <Portal>
      <Block>Portal 2</Block>
    </Portal>
  </>
);
