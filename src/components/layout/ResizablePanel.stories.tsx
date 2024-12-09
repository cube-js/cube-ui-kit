import { Meta, StoryFn } from '@storybook/react';

import { Panel } from './Panel';
import { ResizablePanel, ResizablePanelProps } from './ResizablePanel';

export default {
  title: 'Layout/ResizablePanel',
  component: ResizablePanel,
  args: {},
} as Meta<ResizablePanelProps>;

const TemplateRight: StoryFn<ResizablePanelProps> = (args) => (
  <Panel isFlex isStretched height="min 30x" fill="#white">
    <ResizablePanel {...args} />
    <Panel fill="#light"></Panel>
  </Panel>
);

const TemplateLeft: StoryFn<ResizablePanelProps> = (args) => {
  return (
    <Panel isFlex isStretched height="min 30x" fill="#white">
      <Panel fill="#light"></Panel>
      <ResizablePanel {...args} />
    </Panel>
  );
};

const TemplateBottom: StoryFn<ResizablePanelProps> = (args) => (
  <Panel isFlex isStretched flow="column" height="min 30x" fill="#white">
    <ResizablePanel {...args} />
    <Panel fill="#light"></Panel>
  </Panel>
);

const TemplateTop: StoryFn<ResizablePanelProps> = (args) => {
  return (
    <Panel isFlex isStretched flow="column" height="min 30x" fill="#white">
      <Panel fill="#light"></Panel>
      <ResizablePanel {...args} />
    </Panel>
  );
};

export const ResizeRight = TemplateRight.bind({});
ResizeRight.args = {
  direction: 'right',
};

export const ResizeLeft = TemplateLeft.bind({});
ResizeLeft.args = {
  direction: 'left',
};

export const ResizeBottom = TemplateBottom.bind({});
ResizeBottom.args = {
  direction: 'bottom',
};

export const ResizeTop = TemplateTop.bind({});
ResizeTop.args = {
  direction: 'top',
};
