import { Meta, StoryFn } from '@storybook/react-vite';
import { useState } from 'react';

import { Text } from '../../content/Text';
import { Title } from '../../content/Title';
import { Tab, Tabs } from '../../navigation/Tabs';
import { Flow } from '../Flow';

import { Board } from './index';

import type { CubeBoardProps } from './Board';
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
            fill="#purple-04.10"
            padding=".5x"
            radius="1r"
            flexGrow={1}
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

const TabsBoardTemplate: StoryFn<CubeBoardProps> = (args) => (
  <Board.Provider>
    <Board
      id="root"
      fill="#light"
      padding="1x"
      radius="1r"
      rowHeight={120}
      defaultLayout={[
        { i: 'summary', x: 0, y: 0, w: 4, h: 2 },
        { i: 'kpis', x: 4, y: 0, w: 4, h: 2 },
        { i: 'tabs', x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 2 },
        { i: 'nested', x: 0, y: 2, w: 8, h: 4, minW: 4, minH: 2 },
      ]}
      {...args}
    >
      <Board.Widget id="summary">
        <WidgetBody title="Summary" text="A top-level widget" />
      </Board.Widget>
      <Board.Widget id="kpis">
        <WidgetBody title="KPIs" text="Another top-level widget" />
      </Board.Widget>
      <Board.Widget id="tabs">
        <Flow display="flex" gap="0.5x" padding="1x" height="100%">
          <Title level={6} preset="h6">
            Tabbed board
          </Title>
          <Tabs
            defaultActiveKey="sales"
            isReorderable={false}
            flexGrow={1}
            minHeight="100%"
          >
            <Tab key="sales" title="Sales">
              <Board
                id="tab-sales"
                fill="#purple-04.10"
                padding=".5x"
                radius="1r"
                cols={6}
                rowHeight={80}
                defaultLayout={[
                  { i: 'sales-1', x: 0, y: 0, w: 3, h: 2 },
                  { i: 'sales-2', x: 3, y: 0, w: 3, h: 2 },
                ]}
              >
                <Board.Widget id="sales-1">
                  <WidgetBody title="Revenue" text="Drag me out" />
                </Board.Widget>
                <Board.Widget id="sales-2">
                  <WidgetBody title="Deals" text="Drag me out" />
                </Board.Widget>
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
                defaultLayout={[
                  { i: 'traffic-1', x: 0, y: 0, w: 2, h: 2 },
                  { i: 'traffic-2', x: 2, y: 0, w: 2, h: 2 },
                  { i: 'traffic-3', x: 4, y: 0, w: 2, h: 2 },
                ]}
              >
                <Board.Widget id="traffic-1">
                  <WidgetBody title="Visitors" />
                </Board.Widget>
                <Board.Widget id="traffic-2">
                  <WidgetBody title="Sources" />
                </Board.Widget>
                <Board.Widget id="traffic-3">
                  <WidgetBody title="Bounce" />
                </Board.Widget>
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
                defaultLayout={[
                  { i: 'errors-1', x: 0, y: 0, w: 6, h: 2 },
                  { i: 'errors-2', x: 0, y: 2, w: 3, h: 2 },
                ]}
              >
                <Board.Widget id="errors-1">
                  <WidgetBody title="Error rate" text="Drag me out" />
                </Board.Widget>
                <Board.Widget id="errors-2">
                  <WidgetBody title="Top errors" />
                </Board.Widget>
              </Board>
            </Tab>
          </Tabs>
        </Flow>
      </Board.Widget>
      <Board.Widget id="nested">
        <Flow display="flex" gap="0.5x" padding="1x" height="100%">
          <Title level={6} preset="h6">
            Nested board (drag the whole container)
          </Title>
          <Board
            id="nested-inner"
            fill="#purple-04.10"
            padding=".5x"
            radius="1r"
            flexGrow={1}
            cols={8}
            rowHeight={80}
            defaultLayout={[
              { i: 'nested-1', x: 0, y: 0, w: 4, h: 2 },
              { i: 'nested-2', x: 4, y: 0, w: 4, h: 2 },
            ]}
          >
            <Board.Widget id="nested-1">
              <WidgetBody title="Nested A" text="Drag me out" />
            </Board.Widget>
            <Board.Widget id="nested-2">
              <WidgetBody title="Nested B" text="Drag me out" />
            </Board.Widget>
          </Board>
        </Flow>
      </Board.Widget>
    </Board>
  </Board.Provider>
);

export const TabsBoard = TabsBoardTemplate.bind({});
TabsBoard.args = {};
