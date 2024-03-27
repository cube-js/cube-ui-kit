import { StoryFn } from '@storybook/react';

import { Portal } from '../../Portal';
import { PortalProps } from '../../types';
import { Divider } from '../../../content/Divider';

export const Basic: StoryFn<PortalProps> = (args) => (
  <>
    By default, Portal content should be there {' -> '}
    <Portal {...args}>
      Portal's content.
      {!args.isDisabled && " But, if you disable me, I'll be near the arrow"}
    </Portal>
    <Divider />
  </>
);
