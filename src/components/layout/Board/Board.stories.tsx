import { Meta, StoryFn } from '@storybook/react-vite';
import { ReactNode, useState } from 'react';

import { Button } from '../../actions/Button';
import { Text } from '../../content/Text';
import { Title } from '../../content/Title';
import { TextInput } from '../../fields/TextInput';
import { Tab, Tabs } from '../../navigation/Tabs';
import { Flow } from '../Flow';

import { Board } from './index';

import type { CubeBoardProps } from './Board';
import type { WidgetTransferInfo } from './board-context';
import type { CubeBoardResponsiveProps } from './BoardResponsive';
import type { LayoutItem } from './grid-core';
import type { ResponsiveLayouts } from './responsive-utils';

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
    showGridLines: {
      control: { type: 'radio' },
      options: [false, 'drag', 'any-drag', true],
      description:
        'Show grid lines behind the widgets. `drag` scopes them to the board owning the active drag; `any-drag` shows them on every board under a shared `Board.Provider`.',
      table: { defaultValue: { summary: 'false' } },
    },
    collisionMode: {
      control: { type: 'radio' },
      options: ['revert', 'downscale', 'swap'],
      description:
        'How to resolve a drop the grid would otherwise refuse. Only applies where a collision blocks a move (`compact="free"`, or `preventCollision`).',
      table: { defaultValue: { summary: 'revert' } },
    },
    resizeGripPlacement: {
      control: { type: 'radio' },
      options: ['inside', 'corner'],
      description:
        "Where the corner resize grips sit: inside the widget box, or centred on the widget's corner.",
      table: { defaultValue: { summary: 'inside' } },
    },
    selectionMode: {
      control: { type: 'radio' },
      options: ['none', 'single', 'multiple'],
      description:
        'Whether widgets can be selected, and how many at a time. `multiple` also enables the marquee and group movement.',
      table: { defaultValue: { summary: 'none' } },
    },
    allowMarqueeSelection: {
      control: { type: 'boolean' },
      description:
        'Draw a rubber-band selection when a drag starts on empty board space.',
      table: { defaultValue: { summary: "selectionMode === 'multiple'" } },
    },
    extraRows: {
      control: { type: 'number' },
      description:
        'Empty grid rows kept below the content, so there is always somewhere to start a marquee and somewhere to drop a widget past the end.',
      table: { defaultValue: { summary: '0' } },
    },
    selectionCancel: {
      control: { type: 'text' },
      description:
        'CSS selector for descendants whose clicks must never change the selection.',
      table: { defaultValue: { summary: 'BOARD_SELECTION_CANCEL' } },
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
    widgetProps={{ isCard: true }}
    defaultLayout={defaultLayout}
    {...args}
  >
    <Board.Widget id="a" aria-label="Revenue">
      <WidgetBody title="Revenue" text="Drag or resize me" />
    </Board.Widget>
    <Board.Widget id="b" aria-label="Active users">
      <WidgetBody title="Active users" text="Drag or resize me" />
    </Board.Widget>
    <Board.Widget id="c" aria-label="Latency">
      <WidgetBody title="Latency" text="Drag or resize me" />
    </Board.Widget>
    <Board.Widget id="d" aria-label="Requests over time">
      <WidgetBody title="Requests over time" />
    </Board.Widget>
    <Board.Widget id="e" aria-label="Errors over time">
      <WidgetBody title="Errors over time" />
    </Board.Widget>
  </Board>
);

export const Selection = Template.bind({});
Selection.args = {
  selectionMode: 'multiple',
  showGridLines: 'drag',
};
Selection.parameters = {
  docs: {
    description: {
      story:
        'Press a widget to select it and <kbd>Shift</kbd>-press to add or remove one — the same press also arms a drag, so move and it drags, stay still and it was just a selection. Grabbing an unselected widget makes it the selection; grabbing a selected one moves the whole block, which keeps its shape for the whole drag. Drag from empty canvas to lasso: the widgets the band covers preview the selected edge at half strength while the button is down, and no text is selected under it. Selection behaves like focus: pressing a control inside a widget, or moving focus off the board, drops it. <kbd>Space</kbd> toggles the focused widget, <kbd>Escape</kbd> clears.',
    },
  },
};

const SelectionCancelTemplate: StoryFn<CubeBoardProps> = (args) => (
  <Board
    fill="#light"
    padding="1x"
    radius="1r"
    widgetProps={{ isCard: true }}
    defaultLayout={[
      { i: 'a', x: 0, y: 0, w: 4, h: 2 },
      { i: 'b', x: 4, y: 0, w: 4, h: 2 },
    ]}
    {...args}
  >
    <Board.Widget id="a" aria-label="Filters">
      <Flow gap="1x" padding="1.5x" height="100%">
        <Title level={5} preset="h6">
          Filters
        </Title>
        <TextInput aria-label="Search" placeholder="Typing never selects" />
        <Button size="small">Pressing never selects</Button>
      </Flow>
    </Board.Widget>
    <Board.Widget id="b" aria-label="Revenue">
      <WidgetBody title="Revenue" text="Click anywhere here to select" />
    </Board.Widget>
  </Board>
);

export const SelectionCancel = SelectionCancelTemplate.bind({});
SelectionCancel.args = { selectionMode: 'multiple' };
SelectionCancel.parameters = {
  docs: {
    description: {
      story:
        "Interactive descendants keep their own clicks and their native focus: a press on one neither selects the widget nor starts a drag, and it drops the selection, because interacting with a widget's content means you have moved on. On a selectable board this doubles as the drag guard, so the input below is typeable without configuring `dragCancel`. The default `selectionCancel` selector covers native controls and ARIA widget roles; add `data-no-select` to opt a custom control out.",
    },
  },
};

const ControlledSelectionTemplate: StoryFn<CubeBoardProps> = (args) => {
  const [layout, setLayout] = useState<LayoutItem[]>(defaultLayout);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  return (
    <Flow gap="1x">
      <Text>
        Selected: {selectedKeys.length ? selectedKeys.join(', ') : 'nothing'}
        {' — press Delete to remove'}
      </Text>
      <Board
        fill="#light"
        padding="1x"
        radius="1r"
        widgetProps={{ isCard: true }}
        layout={layout}
        selectedKeys={selectedKeys}
        onLayoutChange={setLayout}
        onSelectionChange={setSelectedKeys}
        // Board reports the intent; removing the widgets is the app's job.
        onWidgetsDelete={(keys) =>
          setLayout((prev) => prev.filter((it) => !keys.includes(it.i)))
        }
        {...args}
      >
        {layout.map((item) => (
          <Board.Widget
            key={item.i}
            id={item.i}
            aria-label={`Widget ${item.i}`}
          >
            <WidgetBody title={`Widget ${item.i}`} />
          </Board.Widget>
        ))}
      </Board>
    </Flow>
  );
};

export const ControlledSelection = ControlledSelectionTemplate.bind({});
ControlledSelection.args = { selectionMode: 'multiple' };
ControlledSelection.parameters = {
  docs: {
    description: {
      story:
        'A fully controlled selection. `onWidgetsDelete` fires on <kbd>Delete</kbd>/<kbd>Backspace</kbd> — Board never mutates the layout itself, so the app decides what removal means (and can make it undoable).',
    },
  },
};

const RestyledSelectionTemplate: StoryFn<CubeBoardProps> = (args) => (
  <Board
    fill="#light"
    padding="1x"
    radius="1r"
    widgetProps={{
      isCard: true,
      // The `selected` and `pre-selected` modifiers are available to any style
      // map a consumer passes, so restyling the selection — including the
      // preview a live marquee paints — needs no dedicated API.
      styles: {
        border: {
          '': true,
          'pre-selected': '#note-border',
          selected: '#note-border',
        },
        shadow: {
          '': false,
          'pre-selected': '0 0 0 1bw #note.40',
          selected: '0 0 0 1bw #note',
        },
      },
    }}
    defaultLayout={defaultLayout}
    {...args}
  >
    {defaultLayout.map((item) => (
      <Board.Widget key={item.i} id={item.i} aria-label={`Widget ${item.i}`}>
        <WidgetBody title={`Widget ${item.i}`} />
      </Board.Widget>
    ))}
  </Board>
);

export const RestyledSelection = RestyledSelectionTemplate.bind({});
RestyledSelection.args = { selectionMode: 'multiple' };

export const Default = Template.bind({});
Default.args = {};

export const FreePositioning = Template.bind({});
FreePositioning.args = {
  compact: 'free',
};
FreePositioning.parameters = {
  docs: {
    description: {
      story:
        'With `compact="free"` a widget is placed exactly where you drop it and its neighbours never move. Without `allowOverlap`, dragging onto an occupied cell is blocked - the widget stays at its last free spot instead of pushing or swapping the others.',
    },
  },
};

export const FreePositioningOverlap = Template.bind({});
FreePositioningOverlap.args = {
  compact: 'free',
  allowOverlap: true,
};
FreePositioningOverlap.parameters = {
  docs: {
    description: {
      story:
        'Combining `compact="free"` with `allowOverlap` lets widgets be dropped anywhere, stacking on top of each other. Neighbours are still never pushed around.',
    },
  },
};

export const HorizontalCompaction = Template.bind({});
HorizontalCompaction.args = {
  compact: 'horizontal',
};

export const NonResizable = Template.bind({});
NonResizable.args = {
  isResizable: false,
};

export const ReadOnly = Template.bind({});
ReadOnly.args = {
  isDraggable: false,
  isResizable: false,
};
ReadOnly.parameters = {
  docs: {
    description: {
      story:
        'With `isDraggable={false}` and `isResizable={false}` the board is fully read-only: widgets can neither be moved nor resized. Their content stays fully interactive - you can still select text inside a widget.',
    },
  },
};

// Per-widget `resizeHandles` restrict a widget to a single axis. Edge handles
// (`e`/`s`) render a dotted grip revealed on hover/focus/resize.
const SingleAxisTemplate: StoryFn<CubeBoardProps> = (args) => (
  <Board
    fill="#light"
    padding="1x"
    radius="1r"
    widgetProps={{ isCard: true }}
    defaultLayout={[
      { i: 'h', x: 0, y: 0, w: 4, h: 2, minW: 2 },
      { i: 'v', x: 4, y: 0, w: 4, h: 2, minH: 1 },
      { i: 'both', x: 8, y: 0, w: 4, h: 2 },
    ]}
    {...args}
  >
    <Board.Widget id="h" resizeHandles={['e']}>
      <WidgetBody title="Horizontal only" text="Resize from the right edge" />
    </Board.Widget>
    <Board.Widget id="v" resizeHandles={['s']}>
      <WidgetBody title="Vertical only" text="Resize from the bottom edge" />
    </Board.Widget>
    <Board.Widget id="both">
      <WidgetBody title="Corner" text="Default se handle" />
    </Board.Widget>
  </Board>
);

export const SingleAxisResize = SingleAxisTemplate.bind({});
SingleAxisResize.args = {};
SingleAxisResize.parameters = {
  docs: {
    description: {
      story:
        'Set per-widget `resizeHandles` to a single edge to constrain resizing to one axis: `["e"]` for horizontal-only, `["s"]` for vertical-only. Edge handles show a dotted grip (matching `Layout.Pane`) that is revealed on hover, focus, or while resizing.',
    },
  },
};

// Per-widget min/max size. `minW`/`maxW` are in grid columns, `minH`/`maxH` in
// grid rows. Resizing a widget stops at these bounds (the handle won't grow or
// shrink past them).
const MinMaxTemplate: StoryFn<CubeBoardProps> = (args) => (
  <Board
    fill="#light"
    padding="1x"
    radius="1r"
    widgetProps={{ isCard: true }}
    showGridLines="drag"
    defaultLayout={[
      { i: 'clamped', x: 0, y: 0, w: 4, h: 2 },
      { i: 'wide', x: 4, y: 0, w: 4, h: 2 },
      { i: 'tall', x: 8, y: 0, w: 4, h: 2 },
    ]}
    {...args}
  >
    <Board.Widget id="clamped" minW={2} maxW={6} minH={2} maxH={4}>
      <WidgetBody title="Clamped" text="min 2x2 - max 6x4" />
    </Board.Widget>
    <Board.Widget id="wide" minW={3} maxW={8}>
      <WidgetBody title="Width bound" text="min 3, max 8 cols" />
    </Board.Widget>
    <Board.Widget id="tall" minH={2} maxH={5}>
      <WidgetBody title="Height bound" text="min 2, max 5 rows" />
    </Board.Widget>
  </Board>
);

export const MinMaxSize = MinMaxTemplate.bind({});
MinMaxSize.args = {};
MinMaxSize.parameters = {
  docs: {
    description: {
      story:
        'Set per-widget `minW`/`maxW` (grid columns) and `minH`/`maxH` (grid rows) on `Board.Widget` to bound resizing. The resize handle stops at each limit, so a widget can never be dragged smaller than its minimum or larger than its maximum. Grid lines are shown while resizing so the bounds are easy to read.',
    },
  },
};

export const GridLines = Template.bind({});
GridLines.args = {
  showGridLines: 'drag',
};
GridLines.parameters = {
  docs: {
    description: {
      story:
        'Grid lines appear behind the widgets while a widget is being dragged or resized (`showGridLines="drag"`). Use `true` to always show them. Under a shared `Board.Provider`, `"drag"` lights up only the board the drag belongs to (its source, and whichever board the widget is currently over); `"any-drag"` lights up every board, advertising all of them as somewhere to land.',
    },
  },
};

// Two boards under one provider, so the grid-line scope is visible: drag a widget
// and watch which boards light up.
const ScopedGridLinesTemplate: StoryFn<CubeBoardProps> = (args) => (
  <Board.Provider>
    <Flow gap="2x">
      {(['left', 'right'] as const).map((side) => (
        <Board
          key={side}
          id={side}
          fill="#light"
          padding="1x"
          radius="1r"
          cols={6}
          extraRows={1}
          widgetProps={{ isCard: true }}
          defaultLayout={[
            { i: `${side}-1`, x: 0, y: 0, w: 2, h: 2 },
            { i: `${side}-2`, x: 2, y: 0, w: 2, h: 2 },
          ]}
          {...args}
        >
          <Board.Widget id={`${side}-1`}>
            <WidgetBody title={`${side} A`} text="Drag me across" />
          </Board.Widget>
          <Board.Widget id={`${side}-2`}>
            <WidgetBody title={`${side} B`} text="Or me" />
          </Board.Widget>
        </Board>
      ))}
    </Flow>
  </Board.Provider>
);

export const ScopedGridLines = ScopedGridLinesTemplate.bind({});
ScopedGridLines.args = {
  showGridLines: 'drag',
};
ScopedGridLines.parameters = {
  docs: {
    description: {
      story:
        'Two boards sharing one `Board.Provider`. With `showGridLines="drag"` only the board taking part in the gesture shows its grid — the source, plus whichever board the widget is currently over. Switch the control to `"any-drag"` to light up both from the first pixel of any drag.',
    },
  },
};

// The resize grip centred on the widget's corner, mirroring a control centred on
// the opposite one.
const CornerGripTemplate: StoryFn<CubeBoardProps> = (args) => (
  <Board
    fill="#light"
    padding="2x"
    radius="1r"
    widgetProps={{ isCard: true }}
    defaultLayout={[
      { i: 'a', x: 0, y: 0, w: 4, h: 2 },
      { i: 'b', x: 4, y: 0, w: 4, h: 2 },
    ]}
    {...args}
  >
    <Board.Widget id="a">
      <WidgetBody title="Corner grip" text="Hover the bottom-right corner" />
    </Board.Widget>
    <Board.Widget id="b" resizeGripPlacement="inside">
      <WidgetBody title="Inside grip" text="The default, for comparison" />
    </Board.Widget>
  </Board>
);

export const CornerResizeGrip = CornerGripTemplate.bind({});
CornerResizeGrip.args = {
  resizeGripPlacement: 'corner',
};
CornerResizeGrip.parameters = {
  docs: {
    description: {
      story:
        'With `resizeGripPlacement="corner"` the grip is centred on the widget\'s corner instead of tucked inside it, so it lines up with a control centred on the opposite corner. It is drawn outside the widget box (a widget clips its own content), so give the board enough `containerPadding` for it to show in full at the board\'s edge. Per-widget `resizeGripPlacement` overrides the board default — the second widget here opts back into `"inside"`.',
    },
  },
};

// One board per mode, rather than one board and a control: on the docs page there
// is no control to flip, and a widget that says "drop me onto another widget"
// while the board is in `downscale` is a promise the mode cannot keep.
const CollisionBoard = ({
  mode,
  caption,
  layout,
  children,
}: {
  mode: 'downscale' | 'swap';
  caption: string;
  layout: LayoutItem[];
  children: ReactNode;
}) => (
  <Flow gap="1x" flexGrow={1}>
    <Text preset="t3" color="#dark-02">
      <code>collisionMode=&quot;{mode}&quot;</code> — {caption}
    </Text>
    <Board
      fill="#light"
      padding="1x"
      radius="1r"
      cols={6}
      extraRows={1}
      compact="free"
      collisionMode={mode}
      showGridLines="drag"
      widgetProps={{ isCard: true }}
      defaultLayout={layout}
    >
      {children}
    </Board>
  </Flow>
);

const CollisionModesTemplate: StoryFn<CubeBoardProps> = () => (
  <Flow gap="3x">
    <CollisionBoard
      mode="downscale"
      caption="drag the wide widget onto the row below"
      layout={[
        { i: 'wide', x: 0, y: 0, w: 4, h: 1 },
        { i: 'blocker', x: 3, y: 1, w: 3, h: 1 },
      ]}
    >
      <Board.Widget id="wide">
        <WidgetBody title="Wide — 4 columns" text="Drag me down one row" />
      </Board.Widget>
      <Board.Widget id="blocker">
        <WidgetBody title="Blocker" text="Leaves 3 free columns" />
      </Board.Widget>
    </CollisionBoard>

    <CollisionBoard
      mode="swap"
      caption="drop one widget onto another"
      layout={[
        { i: 'top-left', x: 0, y: 0, w: 2, h: 1 },
        { i: 'top-right', x: 2, y: 0, w: 2, h: 1 },
        { i: 'bottom', x: 0, y: 1, w: 2, h: 1 },
      ]}
    >
      <Board.Widget id="top-left">
        <WidgetBody title="Top left" />
      </Board.Widget>
      <Board.Widget id="top-right">
        <WidgetBody title="Top right" />
      </Board.Widget>
      <Board.Widget id="bottom">
        <WidgetBody title="Bottom" text="Drop me onto one of the others" />
      </Board.Widget>
    </CollisionBoard>
  </Flow>
);

export const CollisionModes = CollisionModesTemplate.bind({});
CollisionModes.args = {};
CollisionModes.parameters = {
  // Each board fixes its own mode, so a `collisionMode` control here would be dead.
  controls: { exclude: ['collisionMode'] },
  docs: {
    description: {
      story:
        'A `compact="free"` board refuses a drop onto occupied cells; `collisionMode` resolves it instead. **Downscale** — drag the 4-column widget onto the middle row and it shrinks to the 3 columns free beside the blocker, instead of snapping back. **Swap** — drop one widget onto another and they trade places: the dragged widget takes the other\'s cell, the displaced one takes the cell the drag began at, and each keeps as much of its own size as fits there. A drag exchanges once no matter how many widgets it is swept over, and dragging back retraces the original arrangement. Neither mode ever grows a widget. The default, `"revert"`, is what every other story on this page shows: the widget snaps back.',
    },
  },
};
// Widgets are filled (`#surface-2`) and rounded by default, but borderless. Add
// a card border per widget with `isCard`, or for the whole board at once with
// `widgetProps={{ isCard: true }}` (per-widget `isCard` still overrides that
// default).
const CardWidgetsTemplate: StoryFn<CubeBoardProps> = (args) => (
  <Board
    fill="#light"
    padding="1x"
    radius="1r"
    showGridLines="drag"
    widgetProps={{ isCard: true }}
    defaultLayout={[
      { i: 'card-a', x: 0, y: 0, w: 4, h: 2 },
      { i: 'card-b', x: 4, y: 0, w: 4, h: 2 },
      { i: 'flat', x: 8, y: 0, w: 4, h: 2 },
    ]}
    {...args}
  >
    <Board.Widget id="card-a">
      <WidgetBody title="Card" text="bordered via widgetProps" />
    </Board.Widget>
    <Board.Widget id="card-b">
      <WidgetBody title="Card" text="bordered via widgetProps" />
    </Board.Widget>
    {/* Override the board default to render this one without a border. */}
    <Board.Widget id="flat" isCard={false}>
      <WidgetBody title="Flat" text="isCard={false} override" />
    </Board.Widget>
  </Board>
);

export const CardWidgets = CardWidgetsTemplate.bind({});
CardWidgets.args = {};
CardWidgets.parameters = {
  docs: {
    description: {
      story:
        'Widgets are filled (`#surface-2`) and rounded by default, but borderless. Set `widgetProps={{ isCard: true }}` on the `Board` to add a card border to every widget, or set `isCard` on a single `Board.Widget` to opt in/out individually — per-widget `isCard` overrides the board default.',
    },
  },
};

// A widget whose interactive controls must not start a drag. `dragCancel`
// matches those elements (plus a `.no-drag` escape hatch) so the widget can
// still be dragged from its empty areas.
const DragCancelTemplate: StoryFn<CubeBoardProps> = (args) => (
  <Board
    fill="#light"
    padding="1x"
    radius="1r"
    widgetProps={{ isCard: true }}
    dragCancel="input,textarea,button,a,.no-drag"
    defaultLayout={[
      { i: 'form', x: 0, y: 0, w: 6, h: 3 },
      { i: 'plain', x: 6, y: 0, w: 6, h: 3 },
    ]}
    {...args}
  >
    <Board.Widget id="form">
      <Flow gap="1x" padding="1.5x" height="100%">
        <Title level={5} preset="h6">
          Filters (drag from the header)
        </Title>
        <TextInput aria-label="Search" placeholder="Type here - no drag" />
        <Button>Apply</Button>
      </Flow>
    </Board.Widget>
    <Board.Widget id="plain">
      <WidgetBody title="Chart" text="Drag me anywhere" />
    </Board.Widget>
  </Board>
);

export const DragCancel = DragCancelTemplate.bind({});
DragCancel.args = {};
DragCancel.parameters = {
  docs: {
    description: {
      story:
        'A pointer press on an element matching `dragCancel` (inputs, buttons, links, `.no-drag`) never starts a drag, so form controls inside a widget stay interactive. Keyboard moves only run when the widget host itself is focused, not when focus is inside a nested control.',
    },
  },
};

const ControlledTemplate: StoryFn<CubeBoardProps> = (args) => {
  const [layout, setLayout] = useState<LayoutItem[]>(defaultLayout);

  return (
    <Flow gap="1x">
      <Board
        fill="#light"
        padding="1x"
        radius="1r"
        widgetProps={{ isCard: true }}
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

const RESPONSIVE_BREAKPOINTS = { lg: 800, md: 500, sm: 0 };
const RESPONSIVE_COLS = { lg: 12, md: 6, sm: 2 };
const RESPONSIVE_LAYOUTS: ResponsiveLayouts = {
  lg: [
    { i: 'a', x: 0, y: 0, w: 4, h: 2 },
    { i: 'b', x: 4, y: 0, w: 4, h: 2 },
    { i: 'c', x: 8, y: 0, w: 4, h: 2 },
  ],
  md: [
    { i: 'a', x: 0, y: 0, w: 3, h: 2 },
    { i: 'b', x: 3, y: 0, w: 3, h: 2 },
    { i: 'c', x: 0, y: 2, w: 6, h: 2 },
  ],
  sm: [
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 0, y: 2, w: 2, h: 2 },
    { i: 'c', x: 0, y: 4, w: 2, h: 2 },
  ],
};

const ResponsiveTemplate: StoryFn<CubeBoardResponsiveProps> = (args) => {
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(RESPONSIVE_LAYOUTS);
  const [breakpoint, setBreakpoint] = useState('lg');
  const [width, setWidth] = useState<number | null>(null);

  return (
    <Flow gap="1x">
      <Text preset="c2" color="#dark-03">
        Resize the window/preview — active breakpoint: <b>{breakpoint}</b>
        {width != null ? ` — width: ${Math.round(width)}px` : null}
      </Text>
      <Board.Responsive
        fill="#light"
        padding="1x"
        radius="1r"
        widgetProps={{ isCard: true }}
        breakpoints={RESPONSIVE_BREAKPOINTS}
        cols={RESPONSIVE_COLS}
        layouts={layouts}
        onLayoutChange={(_current, all) => setLayouts(all)}
        onBreakpointChange={setBreakpoint}
        onWidthChange={setWidth}
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
      </Board.Responsive>
    </Flow>
  );
};

export const Responsive = ResponsiveTemplate.bind({});
Responsive.args = {};
Responsive.parameters = {
  docs: {
    description: {
      story:
        '`Board.Responsive` selects a layout and column count per breakpoint from the measured width (mirroring react-grid-layout `Responsive`). `onLayoutChange` reports both the active layout and the full map.',
    },
  },
};

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
          widgetProps={{ isCard: true }}
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
          widgetProps={{ isCard: true }}
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

const NestedTemplate: StoryFn<CubeBoardProps> = (args) => {
  // Keep the inner board controlled so its positions survive the remount that
  // happens when the container widget is dragged in the outer board. With an
  // uncontrolled inner board the layout state lives inside the remounted
  // subtree and resets to `defaultLayout` on every outer drag.
  const [outerLayout, setOuterLayout] = useState<LayoutItem[]>([
    // minW/minH keep the container from being resized smaller than the
    // inner board needs to fit its widgets (the resize handle stops there).
    { i: 'container', x: 0, y: 0, w: 7, h: 4, minW: 3, minH: 2 },
    { i: 'side', x: 7, y: 0, w: 5, h: 4 },
  ]);
  const [innerLayout, setInnerLayout] = useState<LayoutItem[]>([
    { i: 'child-1', x: 0, y: 0, w: 3, h: 2 },
    { i: 'child-2', x: 3, y: 0, w: 3, h: 2 },
  ]);

  return (
    <Board.Provider>
      <Board
        id="outer"
        padding="1x"
        radius="1r"
        rowHeight={120}
        showGridLines="drag"
        layout={outerLayout}
        onLayoutChange={setOuterLayout}
        {...args}
      >
        {/* isAutoHeight grows this container in the outer grid until the inner
            board's rows fit at the parent's row height (only ever increases). */}
        <Board.Widget id="container" isAutoHeight fill="#surface">
          <Flow display="flex" flow="column" gap="1x" height="100%">
            <Flow padding="1x 1.5x" fill="#light">
              <Title level={6} preset="h6">
                Container widget (drag the whole container)
              </Title>
            </Flow>
            <Board
              id="inner"
              isAligned
              flexGrow={1}
              // cols/rowHeight are fallbacks used only until the parent metrics
              // resolve; `isAligned` then derives the column count from the
              // parent's pitch and inherits its row height.
              cols={6}
              rowHeight={70}
              layout={innerLayout}
              onLayoutChange={setInnerLayout}
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
};

export const NestedBoards = NestedTemplate.bind({});
NestedBoards.args = {};

// Nested boards with no padding, fill, border, or radius of their own — only a
// header above the grid. With `isAligned`, the inner board inherits the parent's
// column pitch, and because it adds no insets, its columns line up exactly with
// the outer board's. Grid lines are shown on both while dragging so the
// alignment is verifiable.
const AlignedNestedTemplate: StoryFn<CubeBoardProps> = (args) => {
  // Controlled inner/outer layouts so inner widget positions survive the
  // container widget remount during an outer drag (see NestedTemplate).
  const [outerLayout, setOuterLayout] = useState<LayoutItem[]>([
    { i: 'aligned-container', x: 0, y: 0, w: 7, h: 4, minW: 3, minH: 2 },
    { i: 'aligned-side', x: 7, y: 0, w: 5, h: 4 },
  ]);
  const [innerLayout, setInnerLayout] = useState<LayoutItem[]>([
    { i: 'aligned-a', x: 0, y: 0, w: 3, h: 2 },
    { i: 'aligned-b', x: 3, y: 0, w: 3, h: 2 },
    { i: 'aligned-c', x: 0, y: 2, w: 6, h: 2 },
  ]);

  return (
    <Board.Provider>
      <Board
        id="outer-aligned"
        padding="1x"
        radius="1r"
        rowHeight={120}
        showGridLines="drag"
        layout={outerLayout}
        onLayoutChange={setOuterLayout}
        {...args}
      >
        <Board.Widget id="aligned-container" isAutoHeight fill="#surface">
          <Flow display="flex" flow="column" gap="1x" height="100%">
            <Flow padding="1x 1.5x" fill="#light">
              <Title level={6} preset="h6">
                Aligned nested board
              </Title>
            </Flow>
            <Board
              id="inner-aligned"
              isAligned
              // No fill/border/radius: the inner grid's origin sits flush on the
              // container widget's edge, which already coincides with the outer
              // board's column-0 origin. `isAligned` defaults the inner board's
              // `containerPadding` to zero, so its columns line up exactly with
              // the outer board's without any extra chrome.
              flexGrow={1}
              cols={6}
              rowHeight={70}
              layout={innerLayout}
              onLayoutChange={setInnerLayout}
            >
              <Board.Widget id="aligned-a">
                <WidgetBody title="Child A" text="Columns align with parent" />
              </Board.Widget>
              <Board.Widget id="aligned-b">
                <WidgetBody title="Child B" text="Columns align with parent" />
              </Board.Widget>
              <Board.Widget id="aligned-c">
                <WidgetBody title="Child C" text="Spans the full width" />
              </Board.Widget>
            </Board>
          </Flow>
        </Board.Widget>
        <Board.Widget id="aligned-side">
          <WidgetBody title="Sibling" text="Outer grid reference" />
        </Board.Widget>
      </Board>
    </Board.Provider>
  );
};

export const AlignedNestedBoards = AlignedNestedTemplate.bind({});
AlignedNestedBoards.args = {};
AlignedNestedBoards.parameters = {
  docs: {
    description: {
      story:
        'A nested `Board` with `isAligned` and no padding, fill, border, or radius of its own — only a header above the grid — inherits the parent column pitch with zero offset, so its columns line up exactly with the outer board. Grid lines are shown on both boards while dragging to verify the alignment.',
    },
  },
};

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
  // Controlled so a drag (which portals/remounts the widget's subtree) doesn't
  // reset the active tab back to the first one.
  const [activeTab, setActiveTab] = useState('sales');

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
        padding="1x"
        radius="1r"
        rowHeight={120}
        showGridLines="drag"
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
        <Board.Widget id="tabs" fill="#surface">
          <Tabs activeKey={activeTab} onChange={setActiveTab} height="100%">
            <Tab key="sales" title="Sales">
              <Board
                id="tab-sales"
                containerPadding={[0, 8]}
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
                containerPadding={[0, 8]}
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
                containerPadding={[0, 8]}
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
        <Board.Widget id="nested" isAutoHeight fill="#surface">
          <Flow display="flex" flow="column" gap="1x" height="100%">
            <Flow padding="1x 1.5x" fill="#light">
              <Title level={6} preset="h6">
                Nested board (drag the whole container)
              </Title>
            </Flow>
            <Board
              id="nested-inner"
              isAligned
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
