import { Meta, StoryFn } from '@storybook/react-vite';
import { useState } from 'react';

import { Text } from '../../content/Text';
import { Title } from '../../content/Title';
import { Tab, Tabs } from '../../navigation/Tabs';
import { Flow } from '../Flow';

import { Board } from './index';

import type { CubeBoardProps } from './Board';
import type { WidgetTransferInfo } from './board-context';
import type { LayoutItem } from './grid-core';

export default {
  title: 'Layout/Board',
  component: Board,
  argTypes: {
    cols: {
      control: { type: 'number' },
      description: 'Number of columns.',
      table: { defaultValue: { summary: '12' } },
    },
    rowHeight: {
      control: { type: 'number' },
      description: 'Row height in pixels.',
      table: { defaultValue: { summary: '100' } },
    },
    compact: {
      control: { type: 'radio' },
      options: ['vertical', 'horizontal', 'free', null],
      description: 'Compaction behavior.',
      table: { defaultValue: { summary: 'vertical' } },
    },
    isDraggable: {
      control: { type: 'boolean' },
      table: { defaultValue: { summary: 'true' } },
    },
    isResizable: {
      control: { type: 'boolean' },
      table: { defaultValue: { summary: 'true' } },
    },
    allowOverlap: {
      control: { type: 'boolean' },
      table: { defaultValue: { summary: 'false' } },
    },
  },
} as Meta<CubeBoardProps>;

function WidgetBody({ title, text }: { title: string; text?: string }) {
  return (
    <Flow gap="0.5x" padding="1.5x" height="100%">
      <Title level={5} preset="h6">
        {title}
      </Title>
      {text ? <Text color="#dark-03">{text}</Text> : null}
    </Flow>
  );
}

const defaultLayout: LayoutItem[] = [
  { i: 'a', x: 0, y: 0, w: 4, h: 2 },
  { i: 'b', x: 4, y: 0, w: 4, h: 2 },
  { i: 'c', x: 8, y: 0, w: 4, h: 2 },
  { i: 'd', x: 0, y: 2, w: 6, h: 2 },
  { i: 'e', x: 6, y: 2, w: 6, h: 2 },
];

const Template: StoryFn<CubeBoardProps> = (args) => (
  <Board
    fill="#light"
    padding="1x"
    radius="1r"
    defaultLayout={defaultLayout}
    {...args}
  >
    <Board.Widget id="a">
      <WidgetBody title="Revenue" text="Drag or resize me" />
    </Board.Widget>
    <Board.Widget id="b">
      <WidgetBody title="Active users" text="Drag or resize me" />
    </Board.Widget>
    <Board.Widget id="c">
      <WidgetBody title="Latency" text="Drag or resize me" />
    </Board.Widget>
    <Board.Widget id="d">
      <WidgetBody title="Requests over time" />
    </Board.Widget>
    <Board.Widget id="e">
      <WidgetBody title="Errors over time" />
    </Board.Widget>
  </Board>
);

export const Default = Template.bind({});
Default.args = {};

export const FreePositioning = Template.bind({});
FreePositioning.args = {
  compact: 'free',
};

export const HorizontalCompaction = Template.bind({});
HorizontalCompaction.args = {
  compact: 'horizontal',
};

export const NonResizable = Template.bind({});
NonResizable.args = {
  isResizable: false,
};

const ControlledTemplate: StoryFn<CubeBoardProps> = (args) => {
  const [layout, setLayout] = useState<LayoutItem[]>(defaultLayout);

  return (
    <Flow gap="1x">
      <Board
        fill="#light"
        padding="1x"
        radius="1r"
        layout={layout}
        onLayoutChange={setLayout}
        {...args}
      >
        <Board.Widget id="a">
          <WidgetBody title="A" />
        </Board.Widget>
        <Board.Widget id="b">
          <WidgetBody title="B" />
        </Board.Widget>
        <Board.Widget id="c">
          <WidgetBody title="C" />
        </Board.Widget>
        <Board.Widget id="d">
          <WidgetBody title="D" />
        </Board.Widget>
        <Board.Widget id="e">
          <WidgetBody title="E" />
        </Board.Widget>
      </Board>
      <Text preset="c2" color="#dark-03">
        Layout:{' '}
        {layout.map((l) => `${l.i}(${l.x},${l.y} ${l.w}x${l.h})`).join(' ')}
      </Text>
    </Flow>
  );
};

export const Controlled = ControlledTemplate.bind({});
Controlled.args = {};

const CrossBoardTemplate: StoryFn<CubeBoardProps> = (args) => (
  <Board.Provider>
    <Flow gap="1x" gridColumns="1fr 1fr" display="grid">
      <Flow gap="0.5x">
        <Title level={6} preset="h6">
          Board One
        </Title>
        <Board
          id="board-one"
          fill="#light"
          padding="1x"
          radius="1r"
          cols={6}
          defaultLayout={[
            { i: 'one-1', x: 0, y: 0, w: 3, h: 2 },
            { i: 'one-2', x: 3, y: 0, w: 3, h: 2 },
            { i: 'one-3', x: 0, y: 2, w: 6, h: 2 },
          ]}
          {...args}
        >
          <Board.Widget id="one-1">
            <WidgetBody title="Widget 1" text="Drag me across" />
          </Board.Widget>
          <Board.Widget id="one-2">
            <WidgetBody title="Widget 2" text="Drag me across" />
          </Board.Widget>
          <Board.Widget id="one-3">
            <WidgetBody title="Widget 3" text="Drag me across" />
          </Board.Widget>
        </Board>
      </Flow>
      <Flow gap="0.5x">
        <Title level={6} preset="h6">
          Board Two
        </Title>
        <Board
          id="board-two"
          fill="#light"
          padding="1x"
          radius="1r"
          cols={6}
          defaultLayout={[{ i: 'two-1', x: 0, y: 0, w: 6, h: 2 }]}
          {...args}
        >
          <Board.Widget id="two-1">
            <WidgetBody title="Widget 4" text="Drop widgets here" />
          </Board.Widget>
        </Board>
      </Flow>
    </Flow>
  </Board.Provider>
);

export const CrossBoardDragging = CrossBoardTemplate.bind({});
CrossBoardDragging.args = {};

const NestedTemplate: StoryFn<CubeBoardProps> = (args) => (
  <Board.Provider>
    <Board
      id="outer"
      fill="#light"
      padding="1x"
      radius="1r"
      rowHeight={120}
      defaultLayout={[
        // minW/minH keep the container from being resized smaller than the
        // inner board needs to fit its widgets (the resize handle stops there).
        { i: 'container', x: 0, y: 0, w: 7, h: 4, minW: 3, minH: 2 },
        { i: 'side', x: 7, y: 0, w: 5, h: 4 },
      ]}
      {...args}
    >
      <Board.Widget id="container">
        <Flow display="flex" gap="0.5x" padding="1x" height="100%">
          <Title level={6} preset="h6">
            Container widget (drag the whole container)
          </Title>
          <Board
            id="inner"
            align
            fill="#purple-04.10"
            padding=".5x"
            radius="1r"
            flexGrow={1}
            // cols/rowHeight are fallbacks used only until the parent metrics
            // resolve; `align` then derives the column count from the parent's
            // pitch and inherits its row height.
            cols={6}
            rowHeight={70}
            defaultLayout={[
              { i: 'child-1', x: 0, y: 0, w: 3, h: 2 },
              { i: 'child-2', x: 3, y: 0, w: 3, h: 2 },
            ]}
          >
            <Board.Widget id="child-1">
              <WidgetBody title="Child 1" text="Drag me out" />
            </Board.Widget>
            <Board.Widget id="child-2">
              <WidgetBody title="Child 2" text="Drag me out" />
            </Board.Widget>
          </Board>
        </Flow>
      </Board.Widget>
      <Board.Widget id="side">
        <WidgetBody title="Sibling" text="Drop children here" />
      </Board.Widget>
    </Board>
  </Board.Provider>
);

export const NestedBoards = NestedTemplate.bind({});
NestedBoards.args = {};

// Static content for the transferable leaf widgets, keyed by id. Because the
// content lives here (not inline in a tab that can unmount), any board can
// re-declare a widget it owns whenever it mounts - which is what keeps content
// from disappearing on a tab switch.
const WIDGET_CONTENT: Record<string, { title: string; text?: string }> = {
  'sales-1': { title: 'Revenue', text: 'Drag me out' },
  'sales-2': { title: 'Deals', text: 'Drag me out' },
  'traffic-1': { title: 'Visitors' },
  'traffic-2': { title: 'Sources' },
  'traffic-3': { title: 'Bounce' },
  'errors-1': { title: 'Error rate', text: 'Drag me out' },
  'errors-2': { title: 'Top errors' },
  'nested-1': { title: 'Nested A', text: 'Drag me out' },
  'nested-2': { title: 'Nested B', text: 'Drag me out' },
};

const TABS_INITIAL_LAYOUTS: Record<string, LayoutItem[]> = {
  root: [
    { i: 'summary', x: 0, y: 0, w: 4, h: 2 },
    { i: 'kpis', x: 4, y: 0, w: 4, h: 2 },
    { i: 'tabs', x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 2 },
    { i: 'nested', x: 0, y: 2, w: 8, h: 4, minW: 4, minH: 2 },
  ],
  'tab-sales': [
    { i: 'sales-1', x: 0, y: 0, w: 3, h: 2 },
    { i: 'sales-2', x: 3, y: 0, w: 3, h: 2 },
  ],
  'tab-traffic': [
    { i: 'traffic-1', x: 0, y: 0, w: 2, h: 2 },
    { i: 'traffic-2', x: 2, y: 0, w: 2, h: 2 },
    { i: 'traffic-3', x: 4, y: 0, w: 2, h: 2 },
  ],
  'tab-errors': [
    { i: 'errors-1', x: 0, y: 0, w: 6, h: 2 },
    { i: 'errors-2', x: 0, y: 2, w: 3, h: 2 },
  ],
  'nested-inner': [
    { i: 'nested-1', x: 0, y: 0, w: 4, h: 2 },
    { i: 'nested-2', x: 4, y: 0, w: 4, h: 2 },
  ],
};

// Which container currently owns (declares) each transferable leaf widget. Root
// starts with none; each inner board owns its own leaves.
const TABS_INITIAL_OWNER: Record<string, string[]> = {
  root: [],
  'tab-sales': ['sales-1', 'sales-2'],
  'tab-traffic': ['traffic-1', 'traffic-2', 'traffic-3'],
  'tab-errors': ['errors-1', 'errors-2'],
  'nested-inner': ['nested-1', 'nested-2'],
};

function renderLeaf(id: string) {
  const content = WIDGET_CONTENT[id];
  if (!content) return null;
  return (
    <Board.Widget key={id} id={id}>
      <WidgetBody title={content.title} text={content.text} />
    </Board.Widget>
  );
}

const TabsBoardTemplate: StoryFn<CubeBoardProps> = (args) => {
  const [layouts, setLayouts] = useState<Record<string, LayoutItem[]>>(
    () => TABS_INITIAL_LAYOUTS,
  );
  const [owner, setOwner] = useState<Record<string, string[]>>(
    () => TABS_INITIAL_OWNER,
  );

  const handleLayoutChange = (boardId: string) => (next: LayoutItem[]) =>
    setLayouts((prev) => ({ ...prev, [boardId]: next }));

  // Move the widget's declaration into the destination container so its content
  // follows it across the (unmountable) tab boundary.
  const handleTransfer = ({
    widgetId,
    fromBoardId,
    toBoardId,
  }: WidgetTransferInfo) => {
    if (fromBoardId === toBoardId) return;
    setOwner((prev) => ({
      ...prev,
      [fromBoardId]: (prev[fromBoardId] ?? []).filter((id) => id !== widgetId),
      [toBoardId]: [
        ...(prev[toBoardId] ?? []).filter((id) => id !== widgetId),
        widgetId,
      ],
    }));
  };

  return (
    <Board.Provider onWidgetTransfer={handleTransfer}>
      <Board
        id="root"
        fill="#light"
        padding="1x"
        radius="1r"
        rowHeight={120}
        layout={layouts.root}
        onLayoutChange={handleLayoutChange('root')}
        {...args}
      >
        <Board.Widget id="summary">
          <WidgetBody title="Summary" text="A top-level widget" />
        </Board.Widget>
        <Board.Widget id="kpis">
          <WidgetBody title="KPIs" text="Another top-level widget" />
        </Board.Widget>
        <Board.Widget id="tabs">
          <Tabs defaultActiveKey="sales" height="100%">
            <Tab key="sales" title="Sales">
              <Board
                id="tab-sales"
                fill="#purple-04.10"
                padding=".5x"
                radius="1r"
                cols={6}
                rowHeight={80}
                layout={layouts['tab-sales']}
                onLayoutChange={handleLayoutChange('tab-sales')}
              >
                {owner['tab-sales'].map(renderLeaf)}
              </Board>
            </Tab>
            <Tab key="traffic" title="Traffic">
              <Board
                id="tab-traffic"
                fill="#purple-04.10"
                padding=".5x"
                radius="1r"
                cols={6}
                rowHeight={80}
                layout={layouts['tab-traffic']}
                onLayoutChange={handleLayoutChange('tab-traffic')}
              >
                {owner['tab-traffic'].map(renderLeaf)}
              </Board>
            </Tab>
            <Tab key="errors" title="Errors">
              <Board
                id="tab-errors"
                fill="#purple-04.10"
                padding=".5x"
                radius="1r"
                cols={6}
                rowHeight={80}
                layout={layouts['tab-errors']}
                onLayoutChange={handleLayoutChange('tab-errors')}
              >
                {owner['tab-errors'].map(renderLeaf)}
              </Board>
            </Tab>
          </Tabs>
        </Board.Widget>
        <Board.Widget id="nested">
          <Flow display="flex" gap="0.5x" padding="1x" height="100%">
            <Title level={6} preset="h6">
              Nested board (drag the whole container)
            </Title>
            <Board
              id="nested-inner"
              align
              fill="#purple-04.10"
              padding=".5x"
              radius="1r"
              flexGrow={1}
              cols={8}
              rowHeight={80}
              layout={layouts['nested-inner']}
              onLayoutChange={handleLayoutChange('nested-inner')}
            >
              {owner['nested-inner'].map(renderLeaf)}
            </Board>
          </Flow>
        </Board.Widget>
        {owner.root.map(renderLeaf)}
      </Board>
    </Board.Provider>
  );
};

export const TabsBoard = TabsBoardTemplate.bind({});
TabsBoard.args = {};
