import { Meta, StoryFn } from '@storybook/react';
import { useState } from 'react';

import { Panel } from './Panel';
import { CubeResizablePanelProps, ResizablePanel } from './ResizablePanel';

export default {
  title: 'Layout/ResizablePanel',
  component: ResizablePanel,
  args: {},
} as Meta<CubeResizablePanelProps>;

const TemplateRight: StoryFn<CubeResizablePanelProps> = (args) => (
  <Panel isFlex isStretched height="min 30x" fill="#white">
    <ResizablePanel {...args} />
    <Panel fill="#purple-04.10"></Panel>
  </Panel>
);

const TemplateLeft: StoryFn<CubeResizablePanelProps> = (args) => {
  return (
    <Panel isFlex isStretched height="min 30x" fill="#white">
      <Panel fill="#purple-04.10"></Panel>
      <ResizablePanel {...args} />
    </Panel>
  );
};

const TemplateBottom: StoryFn<CubeResizablePanelProps> = (args) => (
  <Panel isFlex isStretched flow="column" fill="#white">
    <ResizablePanel {...args} />
    <Panel fill="#purple-04.10"></Panel>
  </Panel>
);

const TemplateTop: StoryFn<CubeResizablePanelProps> = (args) => {
  return (
    <Panel isFlex isStretched flow="column" fill="#white">
      <Panel fill="#purple-04.10"></Panel>
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

const GridTemplate: StoryFn<CubeResizablePanelProps> = (args) => (
  <Panel isStretched height="min 30x" fill="#white" gridColumns="auto 1fr">
    <ResizablePanel size={300} {...args} />
    <Panel fill="#purple-04.10"></Panel>
  </Panel>
);

const TemplateDisabled: StoryFn<CubeResizablePanelProps> = (args) => (
  <Panel isFlex isStretched height="min 30x" fill="#white">
    <ResizablePanel {...args} />
    <Panel fill="#purple-04.10"></Panel>
  </Panel>
);

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
  maxSize: 500,
};

export const Disabled = TemplateDisabled.bind({});
Disabled.args = {
  isDisabled: true,
};

export const InGridLayout = GridTemplate.bind({});
InGridLayout.args = {
  direction: 'right',
  maxSize: 500,
};
