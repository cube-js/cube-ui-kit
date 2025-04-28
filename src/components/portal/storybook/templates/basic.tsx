import { StoryFn } from '@storybook/react';

import { Divider } from '../../../content/Divider';
import { Portal } from '../../Portal';
import { PortalProps } from '../../types';

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
