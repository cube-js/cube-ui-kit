import { Meta, StoryFn } from '@storybook/react';
import { useState } from 'react';

import { Panel } from './Panel';
import { ResizablePanel, CubeResizablePanelProps } from './ResizablePanel';

export default {
  title: 'Layout/ResizablePanel',
  component: ResizablePanel,
  args: {},
} as Meta<CubeResizablePanelProps>;

const TemplateRight: StoryFn<CubeResizablePanelProps> = (args) => (
  <Panel isFlex isStretched height="min 30x" fill="#white">
    <ResizablePanel {...args} />
    <Panel fill="#light"></Panel>
  </Panel>
);

const TemplateLeft: StoryFn<CubeResizablePanelProps> = (args) => {
  return (
    <Panel isFlex isStretched height="min 30x" fill="#white">
      <Panel fill="#light"></Panel>
      <ResizablePanel {...args} />
    </Panel>
  );
};

const TemplateBottom: StoryFn<CubeResizablePanelProps> = (args) => (
  <Panel isFlex isStretched flow="column" height="min 30x" fill="#white">
    <ResizablePanel {...args} />
    <Panel fill="#light"></Panel>
  </Panel>
);

const TemplateTop: StoryFn<CubeResizablePanelProps> = (args) => {
  return (
    <Panel isFlex isStretched flow="column" height="min 30x" fill="#white">
      <Panel fill="#light"></Panel>
      <ResizablePanel {...args} />
    </Panel>
  );
};

const TemplateControllable: StoryFn<CubeResizablePanelProps> = (args) => {
  const [size, setSize] = useState(200);

  return (
    <ResizablePanel
      size={size}
      flow="column"
      height="min 30x"
      fill="#light"
      onSizeChange={(size) => setSize(Math.min(500, Math.max(100, size)))}
      {...args}
    ></ResizablePanel>
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

export const Controllable = TemplateControllable.bind({});
Controllable.args = {
  direction: 'right',
};

export const Disabled = TemplateRight.bind({});
Disabled.args = {
  isDisabled: true,
};
