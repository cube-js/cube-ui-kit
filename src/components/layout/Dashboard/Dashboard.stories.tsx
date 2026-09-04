import { useRef, useState } from 'react';

import { AreaChartIcon } from '../../../icons/AreaChartIcon';
import { BarChartIcon } from '../../../icons/BarChartIcon';
import { ChartKPIIcon } from '../../../icons/ChartKPIIcon';
import { CloseIcon } from '../../../icons/CloseIcon';
import { LineChartIcon } from '../../../icons/LineChartIcon';
import { ReloadIcon } from '../../../icons/ReloadIcon';
import { TableIcon } from '../../../icons/TableIcon';
import { Button } from '../../actions/Button/Button';
import { Skeleton } from '../../content/Skeleton/Skeleton';
import { Text } from '../../content/Text';
import { Title } from '../../content/Title';
import { TextInput } from '../../fields/TextInput/TextInput';
import { Flow } from '../Flow';
import { Panel } from '../Panel';

import { Dashboard } from './Dashboard';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type {
  CubeDashboardProps,
  DashboardAddItemDefinition,
  DashboardAddItemInfo,
  DashboardPlacement,
  DashboardPlacementChangeInfo,
  DashboardPlacementChangeItem,
} from './Dashboard';

const meta = {
  title: 'Layout/Dashboard Playground',
  component: Dashboard,
  excludeStories: ['DashboardPlayground'],
  subcomponents: {
    Grid: Dashboard.Grid,
    HorizontalStack: Dashboard.HorizontalStack,
    VerticalStack: Dashboard.VerticalStack,
    Tabs: Dashboard.Tabs,
    Widget: Dashboard.Widget,
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A standalone Dashboard editor. Add top-level and nested containers, add constrained widget presets inside any container, move widgets and containers across nesting levels, resize them, and open settings in a floating Panel.',
      },
    },
  },
  args: {
    rowHeight: 96,
    gap: 16,
    selectionMode: 'multiple',
  },
  argTypes: {
    rowHeight: {
      control: { type: 'number', min: 56, max: 140, step: 4 },
    },
    gap: {
      control: { type: 'number', min: 8, max: 32, step: 1 },
    },
    selectionMode: {
      control: 'inline-radio',
      options: ['none', 'single', 'multiple'],
    },
  },
} satisfies Meta<typeof Dashboard>;

export default meta;

type Story = StoryObj<typeof meta>;
type WidgetType = 'compact' | 'wide' | 'insight' | 'chart' | 'table';
type ContainerKind = 'grid' | 'horizontal-stack' | 'vertical-stack' | 'tabs';
type NestedContainerKind = Exclude<ContainerKind, 'tabs'>;

interface WidgetDefinition {
  label: string;
  description: string;
  defaultColumns: number;
  defaultRows: number;
  minColumns: number;
  maxColumns: number;
  minRows: number;
  maxRows: number;
}

interface PlaygroundWidget extends DashboardPlacement {
  nodeType: 'widget';
  id: string;
  type: WidgetType;
  title: string;
  value?: string;
  change?: string;
  changeTone?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
}

interface PlaygroundContainer extends DashboardPlacement {
  nodeType: 'container';
  id: string;
  kind: ContainerKind;
  title: string;
  children: PlaygroundNode[];
  tabs?: PlaygroundTab[];
}

interface PlaygroundTab {
  id: string;
  title: string;
  children: PlaygroundContainer[];
}

type PlaygroundNode = PlaygroundWidget | PlaygroundContainer;

const TOP_LEVEL_ROWS = 6;

const WIDGET_DEFINITIONS: Record<WidgetType, WidgetDefinition> = {
  compact: {
    label: 'Compact KPI',
    description: 'Fixed 1×1',
    defaultColumns: 1,
    defaultRows: 1,
    minColumns: 1,
    maxColumns: 1,
    minRows: 1,
    maxRows: 1,
  },
  wide: {
    label: 'Wide metric',
    description: '2×1 to 6×1',
    defaultColumns: 2,
    defaultRows: 1,
    minColumns: 2,
    maxColumns: 6,
    minRows: 1,
    maxRows: 1,
  },
  insight: {
    label: 'Insight card',
    description: '2×2 to 4×4',
    defaultColumns: 2,
    defaultRows: 2,
    minColumns: 2,
    maxColumns: 4,
    minRows: 2,
    maxRows: 4,
  },
  chart: {
    label: 'Chart',
    description: '4×2 to 12×4',
    defaultColumns: 4,
    defaultRows: 2,
    minColumns: 3,
    maxColumns: 12,
    minRows: 2,
    maxRows: 4,
  },
  table: {
    label: 'Table',
    description: '6×3 to 12×6',
    defaultColumns: 6,
    defaultRows: 3,
    minColumns: 4,
    maxColumns: 12,
    minRows: 2,
    maxRows: 6,
  },
};

const ADD_ITEMS: readonly DashboardAddItemDefinition[] = [
  {
    id: 'widget:compact',
    name: 'Compact KPI',
    description: 'Fixed at 1×1',
    icon: <ChartKPIIcon />,
    defaultColumns: 1,
    defaultRows: 1,
    minColumns: 1,
    maxColumns: 1,
    minRows: 1,
    maxRows: 1,
  },
  {
    id: 'widget:wide',
    name: 'Wide metric',
    description: 'Starts at 2×1; resizes through 6×1',
    icon: <LineChartIcon />,
    defaultColumns: 2,
    defaultRows: 1,
    minColumns: 2,
    maxColumns: 6,
    minRows: 1,
    maxRows: 1,
  },
  {
    id: 'widget:insight',
    name: 'Insight card',
    description: 'Starts at 2×2; resizes through 4×4',
    icon: <BarChartIcon />,
    defaultColumns: 2,
    defaultRows: 2,
    minColumns: 2,
    maxColumns: 4,
    minRows: 2,
    maxRows: 4,
  },
  {
    id: 'widget:chart',
    name: 'Chart',
    description: 'Starts at 4×2; resizes through 12×4',
    icon: <AreaChartIcon />,
    defaultColumns: 4,
    defaultRows: 2,
    minColumns: 3,
    maxColumns: 12,
    minRows: 2,
    maxRows: 4,
  },
  {
    id: 'widget:table',
    name: 'Table',
    description: 'Starts at 6×3; resizes through 12×6',
    icon: <TableIcon />,
    defaultColumns: 6,
    defaultRows: 3,
    minColumns: 4,
    maxColumns: 12,
    minRows: 2,
    maxRows: 6,
  },
  {
    id: 'container:grid',
    name: 'Grid container',
    description: 'Nestable through level three',
    kind: 'grid',
    defaultColumns: 4,
    defaultRows: 2,
    minColumns: 1,
    maxColumns: 12,
    minRows: 1,
  },
  {
    id: 'container:horizontal-stack',
    name: 'Horizontal stack',
    description: 'Nestable through level three',
    kind: 'horizontal-stack',
    defaultColumns: 4,
    defaultRows: 2,
    minColumns: 1,
    maxColumns: 12,
    minRows: 1,
  },
  {
    id: 'container:vertical-stack',
    name: 'Vertical stack',
    description: 'Nestable through level three',
    kind: 'vertical-stack',
    defaultColumns: 4,
    defaultRows: 2,
    minColumns: 1,
    maxColumns: 12,
    minRows: 1,
  },
  {
    id: 'container:tabs',
    name: 'Tabs container',
    description: 'Top-level only, with an independent layout in every tab',
    kind: 'tabs',
    defaultColumns: 12,
    defaultRows: 4,
    minColumns: 12,
    maxColumns: 12,
    minRows: 1,
  },
];

const CONTAINER_LABELS: Record<ContainerKind, string> = {
  grid: 'Grid',
  'horizontal-stack': 'Horizontal stack',
  'vertical-stack': 'Vertical stack',
  tabs: 'Tabs',
};

const INITIAL_CONTAINERS: PlaygroundContainer[] = [
  {
    nodeType: 'container',
    id: 'tabs-1',
    kind: 'tabs',
    title: 'Commerce performance',
    column: 0,
    row: 0,
    columns: 12,
    rows: 6,
    children: [],
    tabs: [
      {
        id: 'overview',
        title: 'Overview',
        children: [
          {
            nodeType: 'container',
            id: 'grid-overview',
            kind: 'grid',
            title: 'Overview layout',
            column: 0,
            row: 0,
            columns: 12,
            rows: 6,
            children: [
              {
                nodeType: 'container',
                id: 'horizontal-kpi',
                kind: 'horizontal-stack',
                title: 'Headline metrics',
                column: 0,
                row: 0,
                columns: 12,
                rows: 1,
                children: [
                  {
                    nodeType: 'widget',
                    id: 'wide-1',
                    type: 'wide',
                    title: 'Net revenue',
                    value: '$128K',
                    change: '+12.4%',
                    column: 0,
                    row: 0,
                    columns: 3,
                    rows: 1,
                  },
                  {
                    nodeType: 'widget',
                    id: 'wide-2',
                    type: 'wide',
                    title: 'Orders',
                    value: '842',
                    change: '+6.1%',
                    column: 3,
                    row: 0,
                    columns: 3,
                    rows: 1,
                  },
                  {
                    nodeType: 'widget',
                    id: 'wide-3',
                    type: 'wide',
                    title: 'Gross margin',
                    value: '62.8%',
                    change: '+1.7 pp',
                    column: 6,
                    row: 0,
                    columns: 3,
                    rows: 1,
                  },
                  {
                    nodeType: 'widget',
                    id: 'compact-1',
                    type: 'compact',
                    title: 'Returns',
                    value: '19',
                    column: 9,
                    row: 0,
                    columns: 1,
                    rows: 1,
                  },
                  {
                    nodeType: 'widget',
                    id: 'compact-2',
                    type: 'compact',
                    title: 'Markets',
                    value: '24',
                    column: 10,
                    row: 0,
                    columns: 1,
                    rows: 1,
                  },
                ],
              },
              {
                nodeType: 'widget',
                id: 'chart-1',
                type: 'chart',
                title: 'Revenue by week',
                change: '+18.2%',
                column: 0,
                row: 1,
                columns: 7,
                rows: 3,
              },
              {
                nodeType: 'widget',
                id: 'chart-2',
                type: 'chart',
                title: 'Orders by channel',
                change: '+9.8%',
                column: 7,
                row: 1,
                columns: 5,
                rows: 3,
              },
              {
                nodeType: 'widget',
                id: 'table-1',
                type: 'table',
                title: 'Top products',
                change: '+4.6%',
                column: 0,
                row: 4,
                columns: 8,
                rows: 2,
              },
              {
                nodeType: 'widget',
                id: 'insight-1',
                type: 'insight',
                title: 'Inventory health',
                change: '-4.1%',
                changeTone: 'negative',
                subtitle: 'Low-stock products',
                column: 8,
                row: 4,
                columns: 4,
                rows: 2,
              },
            ],
          },
        ],
      },
      {
        id: 'revenue',
        title: 'Revenue',
        children: [
          {
            nodeType: 'container',
            id: 'grid-revenue',
            kind: 'grid',
            title: 'Revenue layout',
            column: 0,
            row: 0,
            columns: 12,
            rows: 6,
            children: [
              {
                nodeType: 'widget',
                id: 'chart-3',
                type: 'chart',
                title: 'Recognised revenue',
                change: '+14.0%',
                column: 0,
                row: 0,
                columns: 12,
                rows: 3,
              },
              {
                nodeType: 'container',
                id: 'vertical-revenue',
                kind: 'vertical-stack',
                title: 'Pipeline',
                column: 0,
                row: 3,
                columns: 5,
                rows: 3,
                children: [
                  {
                    nodeType: 'widget',
                    id: 'wide-4',
                    type: 'wide',
                    title: 'Qualified pipeline',
                    value: '$1.7M',
                    change: '+16.2%',
                    column: 0,
                    row: 0,
                    columns: 5,
                    rows: 1,
                  },
                  {
                    nodeType: 'widget',
                    id: 'wide-5',
                    type: 'wide',
                    title: 'Forecast',
                    value: '$146K',
                    change: '+14.0%',
                    column: 0,
                    row: 1,
                    columns: 5,
                    rows: 1,
                  },
                ],
              },
              {
                nodeType: 'widget',
                id: 'table-2',
                type: 'table',
                title: 'Revenue by account',
                change: '+11.3%',
                column: 5,
                row: 3,
                columns: 7,
                rows: 3,
              },
            ],
          },
        ],
      },
      {
        id: 'operations',
        title: 'Operations',
        children: [
          {
            nodeType: 'container',
            id: 'grid-operations',
            kind: 'grid',
            title: 'Operations layout',
            column: 0,
            row: 0,
            columns: 12,
            rows: 6,
            children: [
              {
                nodeType: 'widget',
                id: 'table-3',
                type: 'table',
                title: 'Fulfilment queue',
                change: '-2.4%',
                changeTone: 'negative',
                column: 0,
                row: 0,
                columns: 8,
                rows: 4,
              },
              {
                nodeType: 'widget',
                id: 'insight-2',
                type: 'insight',
                title: 'On-time delivery',
                change: '+3.2%',
                subtitle: 'Last eight weeks',
                column: 8,
                row: 0,
                columns: 4,
                rows: 4,
              },
            ],
          },
        ],
      },
      { id: 'build', title: 'Build a view', children: [] },
    ],
  },
  {
    nodeType: 'container',
    id: 'grid-1',
    kind: 'grid',
    title: 'Acquisition detail',
    column: 0,
    row: 1,
    columns: 12,
    rows: TOP_LEVEL_ROWS,
    children: [
      {
        nodeType: 'widget',
        id: 'compact-3',
        type: 'compact',
        title: 'Sessions',
        value: '94K',
        column: 0,
        row: 0,
        columns: 1,
        rows: 1,
      },
      {
        nodeType: 'widget',
        id: 'wide-8',
        type: 'wide',
        title: 'Signups',
        value: '3.1K',
        change: '+7.4%',
        column: 1,
        row: 0,
        columns: 2,
        rows: 1,
      },
      {
        nodeType: 'widget',
        id: 'insight-3',
        type: 'insight',
        title: 'Conversion quality',
        change: '+5.4%',
        subtitle: 'Qualified sessions',
        column: 3,
        row: 0,
        columns: 2,
        rows: 2,
      },
      {
        nodeType: 'widget',
        id: 'insight-4',
        type: 'insight',
        title: 'Retention curve',
        change: '+6.9%',
        subtitle: 'Week-one retention',
        column: 5,
        row: 0,
        columns: 2,
        rows: 2,
      },
      {
        nodeType: 'container',
        id: 'horizontal-1',
        kind: 'horizontal-stack',
        title: 'Acquisition KPIs',
        column: 7,
        row: 0,
        columns: 5,
        rows: 1,
        children: [
          {
            nodeType: 'widget',
            id: 'wide-6',
            type: 'wide',
            title: 'Acquisition cost',
            value: '$46',
            change: '-7.6%',
            column: 0,
            row: 0,
            columns: 3,
            rows: 1,
          },
          {
            nodeType: 'widget',
            id: 'wide-7',
            type: 'wide',
            title: 'ROAS',
            value: '3.4×',
            change: '+0.4×',
            column: 3,
            row: 0,
            columns: 2,
            rows: 1,
          },
        ],
      },
      {
        nodeType: 'widget',
        id: 'chart-4',
        type: 'chart',
        title: 'New customers by week',
        change: '+24.8%',
        column: 0,
        row: 3,
        columns: 7,
        rows: 3,
      },
      {
        nodeType: 'widget',
        id: 'table-4',
        type: 'table',
        title: 'Campaign performance',
        change: '+8.5%',
        column: 7,
        row: 3,
        columns: 5,
        rows: 3,
      },
    ],
  },
];

function overlaps(first: DashboardPlacement, second: DashboardPlacement) {
  return !(
    first.column + first.columns <= second.column ||
    second.column + second.columns <= first.column ||
    first.row + first.rows <= second.row ||
    second.row + second.rows <= first.row
  );
}

function getContainerColumns(container: PlaygroundContainer) {
  return Math.max(1, Math.min(12, container.columns));
}

function findFreeSpot(
  occupied: PlaygroundNode[],
  size: DashboardPlacement,
  columns: number,
  rows: number,
): { column: number; row: number } | null {
  for (let row = 0; row + size.rows <= rows; row += 1) {
    for (let column = 0; column + size.columns <= columns; column += 1) {
      const candidate = { ...size, column, row };

      if (!occupied.some((node) => overlaps(candidate, node))) {
        return { column, row };
      }
    }
  }

  return null;
}

function isWithinContainer(
  parent: PlaygroundContainer,
  placement: DashboardPlacement,
) {
  const parentColumns = getContainerColumns(parent);

  return (
    placement.columns <= parentColumns &&
    placement.rows <= parent.rows &&
    placement.column >= 0 &&
    placement.row >= 0 &&
    placement.column + placement.columns <= parentColumns &&
    placement.row + placement.rows <= parent.rows
  );
}

function normalizeStackChildren(
  parent: PlaygroundContainer,
  children = parent.children,
): PlaygroundNode[] {
  if (parent.kind === 'horizontal-stack') {
    let column = 0;

    return children.map((child) => {
      const next = { ...child, column, row: 0 };
      column += child.columns;

      return next;
    });
  }

  if (parent.kind === 'vertical-stack') {
    let row = 0;

    return children.map((child) => {
      const next = { ...child, column: 0, row };
      row += child.rows;

      return next;
    });
  }

  return children;
}

/**
 * Re-derive a stack's array order from the coordinates Dashboard just resolved.
 *
 * A stack's rendered order is its array order — `normalizeStackChildren` packs
 * children along the axis by position, ignoring whatever coordinates they
 * carry. So writing a resolved placement onto a stack child is a no-op on its
 * own: the reorder only lands once the array itself is sorted by the axis
 * coordinate. Grids are position-addressed and are left alone.
 */
function sortStackChildren(
  parent: PlaygroundContainer,
  children: PlaygroundNode[],
): PlaygroundNode[] {
  if (parent.kind !== 'horizontal-stack' && parent.kind !== 'vertical-stack') {
    return children;
  }

  const axis = parent.kind === 'horizontal-stack' ? 'column' : 'row';

  return [...children].sort((a, b) => a[axis] - b[axis]);
}

function normalizeTopLevel(containers: PlaygroundContainer[]) {
  return containers.map((container, row) => ({ ...container, row }));
}

function getChildContainers(
  container: PlaygroundContainer,
): PlaygroundContainer[] {
  return [
    ...container.children.filter(
      (child): child is PlaygroundContainer => child.nodeType === 'container',
    ),
    ...(container.tabs?.flatMap((tab) => tab.children) ?? []),
  ];
}

function findContainer(
  containers: PlaygroundContainer[],
  id: string,
): PlaygroundContainer | null {
  for (const container of containers) {
    if (container.id === id) return container;

    const nested = findContainer(getChildContainers(container), id);

    if (nested) return nested;
  }

  return null;
}

interface PlaygroundTabLayout {
  tabs: PlaygroundContainer;
  tab: PlaygroundTab;
  layoutId: string;
  depth: number;
}

function findTabLayout(
  containers: PlaygroundContainer[],
  layoutId: string,
  depth = 1,
): PlaygroundTabLayout | null {
  for (const container of containers) {
    for (const tab of container.tabs ?? []) {
      if (`${container.id}:${tab.id}` === layoutId) {
        return { tabs: container, tab, layoutId, depth };
      }
    }

    const nested = findTabLayout(
      getChildContainers(container),
      layoutId,
      depth + 1,
    );
    if (nested) return nested;
  }

  return null;
}

function updateTabLayout(
  containers: PlaygroundContainer[],
  tabsId: string,
  tabId: string,
  children: PlaygroundContainer[],
): PlaygroundContainer[] {
  return updateContainerTree(containers, tabsId, (container) => ({
    ...container,
    tabs: container.tabs?.map((tab) =>
      tab.id === tabId ? { ...tab, children } : tab,
    ),
  }));
}

function updateNodeTree(
  nodes: PlaygroundNode[],
  id: string,
  update: (container: PlaygroundContainer) => PlaygroundContainer,
): PlaygroundNode[] {
  return nodes.map((node) => {
    if (node.nodeType === 'widget') return node;

    const container = node.id === id ? update(node) : node;

    return {
      ...container,
      children: updateNodeTree(container.children, id, update),
      tabs: container.tabs?.map((tab) => ({
        ...tab,
        children: updateNodeTree(
          tab.children,
          id,
          update,
        ) as PlaygroundContainer[],
      })),
    };
  });
}

function updateContainerTree(
  containers: PlaygroundContainer[],
  id: string,
  update: (container: PlaygroundContainer) => PlaygroundContainer,
): PlaygroundContainer[] {
  return updateNodeTree(containers, id, update) as PlaygroundContainer[];
}

/**
 * Write a batch of placements wherever their nodes happen to live.
 *
 * A resize can reach past one parent's children: when a stack is resized,
 * Dashboard reports the stack's own placement *and* its children's new spans,
 * and those sit one level further down. Matching on id across the whole tree is
 * simpler than tracking which level each entry belongs to.
 */
function applyPlacements(
  nodes: PlaygroundNode[],
  placements: ReadonlyMap<string, DashboardPlacement>,
): PlaygroundNode[] {
  return nodes.map((node) => {
    const next = placements.get(node.id);
    const placed = next ? { ...node, ...next } : node;
    if (placed.nodeType === 'widget') return placed;

    return {
      ...placed,
      children: applyPlacements(placed.children, placements),
      tabs: placed.tabs?.map((tab) => ({
        ...tab,
        children: applyPlacements(
          tab.children,
          placements,
        ) as PlaygroundContainer[],
      })),
    };
  });
}

interface RemoveNodeResult {
  nodes: PlaygroundNode[];
  removed: PlaygroundNode | null;
}

function removePlaygroundNode(
  nodes: PlaygroundNode[],
  id: string,
): RemoveNodeResult {
  let removed: PlaygroundNode | null = null;
  const nextNodes: PlaygroundNode[] = [];

  for (const node of nodes) {
    if (node.id === id) {
      removed = node;
      continue;
    }

    if (node.nodeType === 'widget') {
      nextNodes.push(node);
      continue;
    }

    const nested = removePlaygroundNode(node.children, id);
    if (nested.removed) removed = nested.removed;
    const tabs = node.tabs?.map((tab) => {
      const tabRemoval = removePlaygroundNode(tab.children, id);
      if (tabRemoval.removed) removed = tabRemoval.removed;

      return {
        ...tab,
        children: tabRemoval.nodes as PlaygroundContainer[],
      };
    });
    nextNodes.push({
      ...node,
      children: normalizeStackChildren(node, nested.nodes),
      tabs,
    });
  }

  return { nodes: nextNodes, removed };
}

function getContainerDepth(
  containers: PlaygroundContainer[],
  id: string,
  depth = 1,
): number | null {
  for (const container of containers) {
    if (container.id === id) return depth;

    const nested = getContainerDepth(
      getChildContainers(container),
      id,
      depth + 1,
    );
    if (nested !== null) return nested;
  }

  return null;
}

function getDescendantContainerDepth(node: PlaygroundNode): number {
  if (node.nodeType === 'widget') return 0;

  return [
    ...node.children,
    ...(node.tabs?.flatMap((tab) => tab.children) ?? []),
  ].reduce(
    (depth, child) =>
      child.nodeType === 'container'
        ? Math.max(depth, 1 + getDescendantContainerDepth(child))
        : depth,
    0,
  );
}

interface TransferNodeResult {
  containers: PlaygroundContainer[];
  destinationTitle: string;
  error: string | null;
}

function transferPlaygroundNode(
  containers: PlaygroundContainer[],
  nodeId: string,
  destinationParentId: string | null,
  placement: DashboardPlacement,
): TransferNodeResult {
  const removal = removePlaygroundNode(containers, nodeId);
  const moving = removal.removed;
  if (!moving) {
    return {
      containers,
      destinationTitle: 'the destination',
      error: 'The item is no longer available.',
    };
  }

  const withoutMoving = removal.nodes as PlaygroundContainer[];

  if (destinationParentId === null) {
    if (moving.nodeType !== 'container') {
      return {
        containers,
        destinationTitle: 'the dashboard',
        error: 'Widgets must stay inside a container.',
      };
    }

    const nextContainer = {
      ...moving,
      ...placement,
      column: 0,
      columns: 12,
    };
    const targetIndex = Math.max(
      0,
      Math.min(withoutMoving.length, placement.row),
    );
    const next = [...withoutMoving];
    next.splice(targetIndex, 0, nextContainer);

    return {
      containers: normalizeTopLevel(next),
      destinationTitle: 'the dashboard',
      error: null,
    };
  }

  const tabLayout = findTabLayout(withoutMoving, destinationParentId);
  if (tabLayout) {
    if (moving.nodeType !== 'container' || moving.kind === 'tabs') {
      return {
        containers,
        destinationTitle: tabLayout.tab.title,
        error: 'A tab layout accepts one non-Tabs container.',
      };
    }
    if (tabLayout.tab.children.length > 0) {
      return {
        containers,
        destinationTitle: tabLayout.tab.title,
        error: 'That tab already has a layout container.',
      };
    }
    if (tabLayout.depth + 1 + getDescendantContainerDepth(moving) > 3) {
      return {
        containers,
        destinationTitle: tabLayout.tab.title,
        error: 'That move would exceed three levels of container nesting.',
      };
    }

    return {
      containers: updateTabLayout(
        withoutMoving,
        tabLayout.tabs.id,
        tabLayout.tab.id,
        [{ ...moving, ...placement, column: 0, columns: 12 }],
      ),
      destinationTitle: tabLayout.tab.title,
      error: null,
    };
  }

  const destination = findContainer(withoutMoving, destinationParentId);
  if (!destination) {
    return {
      containers,
      destinationTitle: 'the destination container',
      error: 'A container cannot be moved inside itself or its descendants.',
    };
  }

  if (moving.nodeType === 'container') {
    if (moving.kind === 'tabs') {
      return {
        containers,
        destinationTitle: destination.title,
        error: 'Tabs can only be placed at the dashboard top level.',
      };
    }

    const destinationDepth = getContainerDepth(
      withoutMoving,
      destinationParentId,
    );
    if (
      destinationDepth === null ||
      destinationDepth + 1 + getDescendantContainerDepth(moving) > 3
    ) {
      return {
        containers,
        destinationTitle: destination.title,
        error: 'That move would exceed three levels of container nesting.',
      };
    }
  }

  const movedNode = { ...moving, ...placement };
  if (acceptsPlacement(destination, nodeId, movedNode)) {
    return {
      containers,
      destinationTitle: destination.title,
      error: `There is no ${placement.columns}×${placement.rows} space in ${destination.title}.`,
    };
  }

  let nextChildren: PlaygroundNode[];
  if (
    destination.kind === 'horizontal-stack' ||
    destination.kind === 'vertical-stack'
  ) {
    const axis = destination.kind === 'horizontal-stack' ? 'column' : 'row';
    const span = destination.kind === 'horizontal-stack' ? 'columns' : 'rows';
    const insertionIndex = destination.children.findIndex(
      (child) => movedNode[axis] < child[axis] + child[span] / 2,
    );
    nextChildren = [...destination.children];
    nextChildren.splice(
      insertionIndex < 0 ? nextChildren.length : insertionIndex,
      0,
      movedNode,
    );
    nextChildren = normalizeStackChildren(destination, nextChildren);
  } else {
    nextChildren = [...destination.children, movedNode];
  }

  return {
    containers: updateContainerTree(
      withoutMoving,
      destinationParentId,
      (container) => ({ ...container, children: nextChildren }),
    ),
    destinationTitle: destination.title,
    error: null,
  };
}

function transferPlaygroundNodes(
  containers: PlaygroundContainer[],
  items: DashboardPlacementChangeItem[],
  destinationParentId: string | null,
): TransferNodeResult {
  let withoutMoving = containers as PlaygroundNode[];
  const movingNodes: PlaygroundNode[] = [];

  for (const item of items) {
    const removal = removePlaygroundNode(withoutMoving, item.id);
    if (!removal.removed) {
      return {
        containers,
        destinationTitle: 'the destination',
        error: 'A selected item is no longer available.',
      };
    }

    movingNodes.push({ ...removal.removed, ...item.placement });
    withoutMoving = removal.nodes;
  }

  const nextContainers = withoutMoving as PlaygroundContainer[];

  if (destinationParentId === null) {
    if (movingNodes.some((node) => node.nodeType !== 'container')) {
      return {
        containers,
        destinationTitle: 'the dashboard',
        error: 'Widgets must stay inside a container.',
      };
    }

    const insertionIndex = Math.max(
      0,
      Math.min(
        nextContainers.length,
        Math.min(...items.map((item) => item.placement.row)),
      ),
    );
    const ordered = [...movingNodes].sort((first, second) =>
      first.row === second.row
        ? first.column - second.column
        : first.row - second.row,
    ) as PlaygroundContainer[];
    const next = [...nextContainers];
    next.splice(insertionIndex, 0, ...ordered);

    return {
      containers: normalizeTopLevel(next),
      destinationTitle: 'the dashboard',
      error: null,
    };
  }

  const tabLayout = findTabLayout(nextContainers, destinationParentId);
  if (tabLayout) {
    if (
      movingNodes.length !== 1 ||
      movingNodes[0].nodeType !== 'container' ||
      movingNodes[0].kind === 'tabs' ||
      tabLayout.tab.children.length > 0
    ) {
      return {
        containers,
        destinationTitle: tabLayout.tab.title,
        error: 'A tab layout accepts exactly one non-Tabs container.',
      };
    }

    const moving = movingNodes[0] as PlaygroundContainer;
    if (tabLayout.depth + 1 + getDescendantContainerDepth(moving) > 3) {
      return {
        containers,
        destinationTitle: tabLayout.tab.title,
        error: 'That move would exceed three levels of container nesting.',
      };
    }

    return {
      containers: updateTabLayout(
        nextContainers,
        tabLayout.tabs.id,
        tabLayout.tab.id,
        [{ ...moving, column: 0, columns: 12 }],
      ),
      destinationTitle: tabLayout.tab.title,
      error: null,
    };
  }

  const destination = findContainer(nextContainers, destinationParentId);
  if (!destination) {
    return {
      containers,
      destinationTitle: 'the destination container',
      error: 'A selected container cannot be moved inside its descendants.',
    };
  }

  const destinationDepth = getContainerDepth(
    nextContainers,
    destinationParentId,
  );
  for (const node of movingNodes) {
    if (node.nodeType !== 'container') continue;
    if (node.kind === 'tabs') {
      return {
        containers,
        destinationTitle: destination.title,
        error: 'Tabs can only be placed at the dashboard top level.',
      };
    }
    if (
      destinationDepth === null ||
      destinationDepth + 1 + getDescendantContainerDepth(node) > 3
    ) {
      return {
        containers,
        destinationTitle: destination.title,
        error: 'That move would exceed three levels of container nesting.',
      };
    }
  }

  let prospectiveChildren = [...destination.children];
  for (const node of movingNodes) {
    const prospectiveParent = {
      ...destination,
      children: prospectiveChildren,
    };
    if (acceptsPlacement(prospectiveParent, node.id, node)) {
      return {
        containers,
        destinationTitle: destination.title,
        error: `There is not enough space for ${items.length} selected items in ${destination.title}.`,
      };
    }
    prospectiveChildren.push(node);
  }

  if (
    destination.kind === 'horizontal-stack' ||
    destination.kind === 'vertical-stack'
  ) {
    const axis = destination.kind === 'horizontal-stack' ? 'column' : 'row';
    const span = destination.kind === 'horizontal-stack' ? 'columns' : 'rows';
    const ordered = [...movingNodes].sort(
      (first, second) => first[axis] - second[axis],
    );
    const insertionPoint = ordered[0][axis];
    const insertionIndex = destination.children.findIndex(
      (child) => insertionPoint < child[axis] + child[span] / 2,
    );
    prospectiveChildren = [...destination.children];
    prospectiveChildren.splice(
      insertionIndex < 0 ? prospectiveChildren.length : insertionIndex,
      0,
      ...ordered,
    );
  }

  return {
    containers: updateContainerTree(
      nextContainers,
      destinationParentId,
      (container) => ({
        ...container,
        children: normalizeStackChildren(container, prospectiveChildren),
      }),
    ),
    destinationTitle: destination.title,
    error: null,
  };
}

function findPlaygroundNode(
  nodes: PlaygroundNode[],
  id: string,
): PlaygroundNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.nodeType === 'widget') continue;

    const nested = findPlaygroundNode(
      [...node.children, ...(node.tabs?.flatMap((tab) => tab.children) ?? [])],
      id,
    );
    if (nested) return nested;
  }

  return null;
}

function countNodes(nodes: PlaygroundNode[]): {
  containers: number;
  widgets: number;
} {
  return nodes.reduce(
    (count, node) => {
      if (node.nodeType === 'widget') {
        count.widgets += 1;
      } else {
        const nested = countNodes([
          ...node.children,
          ...(node.tabs?.flatMap((tab) => tab.children) ?? []),
        ]);
        count.containers += nested.containers + 1;
        count.widgets += nested.widgets;
      }

      return count;
    },
    { containers: 0, widgets: 0 },
  );
}

function acceptsPlacement(
  parent: PlaygroundContainer,
  widgetId: string,
  placement: DashboardPlacement,
): PlaygroundNode | null {
  const parentColumns = getContainerColumns(parent);
  const siblings = parent.children.filter((child) => child.id !== widgetId);
  if (!isWithinContainer(parent, placement)) {
    return parent;
  }

  // A stack child owns its span, so a resize only has to fit in what the
  // siblings leave over.
  if (parent.kind === 'horizontal-stack') {
    const usedColumns = siblings.reduce(
      (total, sibling) => total + sibling.columns,
      0,
    );

    return usedColumns + placement.columns <= parentColumns &&
      placement.rows <= parent.rows
      ? null
      : siblings[0] ?? null;
  }

  if (parent.kind === 'vertical-stack') {
    const usedRows = siblings.reduce(
      (total, sibling) => total + sibling.rows,
      0,
    );

    return usedRows + placement.rows <= parent.rows
      ? null
      : siblings[0] ?? null;
  }

  return siblings.find((sibling) => overlaps(sibling, placement)) ?? null;
}

function MiniBars() {
  const values = [34, 52, 40, 70, 58, 82, 76, 92];

  return (
    <Flow
      aria-hidden="true"
      display="flex"
      alignItems="end"
      gap="0.5x"
      height="100%"
      styles={{ minHeight: '6x' }}
    >
      {values.map((value, index) => (
        <Flow
          key={`${value}-${index}`}
          width="max 2x"
          height={`${value}%`}
          fill={index === values.length - 1 ? '#purple' : '#purple.20'}
          radius="0.5r 0.5r 0 0"
        />
      ))}
    </Flow>
  );
}

function WidgetContent({ widget }: { widget: PlaygroundWidget }) {
  const changeColor =
    widget.changeTone === 'negative'
      ? '#danger-text'
      : widget.changeTone === 'neutral'
        ? '#dark.60'
        : '#success-text';

  if (widget.type === 'compact') {
    return (
      <Flow padding="1x" gap="0.25x" height="100%" placeContent="center">
        <Text preset="c3" color="#dark.60" ellipsis>
          {widget.title}
        </Text>
        <Title level={3} preset="h5">
          {widget.value ?? '842'}
        </Title>
      </Flow>
    );
  }

  if (widget.type === 'chart' || widget.type === 'table') {
    return (
      <Flow
        padding="1.5x"
        display="grid"
        gridRows="auto minmax(0, 1fr)"
        gap="1x"
        height="100%"
      >
        <Flow display="flex" placeContent="space-between" alignItems="start">
          <Title level={3} preset="h5" ellipsis>
            {widget.title}
          </Title>
          <Text preset="c3" color={changeColor}>
            {widget.change ?? '+9.4%'}
          </Text>
        </Flow>
        {/* `isStatic` everywhere: a shimmering placeholder is a flaky snapshot.
            `height="100%"` overrides the chart layout's own fixed height. */}
        <Skeleton
          layout={widget.type}
          isStatic
          columns={widget.type === 'table' ? 4 : 10}
          rows={3}
          height="100%"
          styles={{ minHeight: 0 }}
        />
      </Flow>
    );
  }

  if (widget.type === 'wide') {
    return (
      <Flow
        padding="1.5x"
        display="grid"
        gridColumns="1fr auto"
        alignItems="center"
        gap="1x"
        height="100%"
      >
        <Flow gap="0.25x" styles={{ minWidth: 0 }}>
          <Text preset="c3" color="#dark.60" ellipsis>
            {widget.title}
          </Text>
          <Title level={3} preset="h4">
            {widget.value ?? '$128K'}
          </Title>
        </Flow>
        <Text preset="c3" color={changeColor}>
          {widget.change ?? '+12.4%'}
        </Text>
      </Flow>
    );
  }

  return (
    <Flow
      padding="1.5x"
      display="grid"
      gridRows="auto minmax(0, 1fr)"
      gap="1x"
      height="100%"
    >
      <Flow display="flex" placeContent="space-between" alignItems="start">
        <Flow gap="0.25x" styles={{ minWidth: 0 }}>
          <Title level={3} preset="h5" ellipsis>
            {widget.title}
          </Title>
          <Text preset="c3" color="#dark.60">
            {widget.subtitle ?? 'Last eight weeks'}
          </Text>
        </Flow>
        <Text preset="c3" color={changeColor}>
          {widget.change ?? '+18.2%'}
        </Text>
      </Flow>
      <MiniBars />
    </Flow>
  );
}

function WidgetPresetLegend() {
  return (
    <Flow
      display="grid"
      gridColumns="repeat(auto-fit, minmax(140px, 1fr))"
      gap="1x"
    >
      {(Object.keys(WIDGET_DEFINITIONS) as WidgetType[]).map((type) => {
        const definition = WIDGET_DEFINITIONS[type];

        return (
          <Flow
            key={type}
            padding="1x 1.5x"
            fill="#surface"
            border="1bw #border"
            radius
            gap="0.25x"
          >
            <Text preset="c2">{definition.label}</Text>
            <Text preset="c3" color="#dark.60">
              {definition.description}
            </Text>
          </Flow>
        );
      })}
    </Flow>
  );
}

function SettingsPanel({
  node,
  onClose,
}: {
  node: PlaygroundNode;
  onClose: () => void;
}) {
  const typeLabel =
    node.nodeType === 'widget'
      ? WIDGET_DEFINITIONS[node.type].label
      : CONTAINER_LABELS[node.kind];

  return (
    <Panel
      isFloating
      isCard
      isFlex
      width="336px"
      height="100%"
      inset="0 0 0 auto"
      zIndex={30}
      fill="#surface"
      shadow="$dialog-shadow"
      padding="2x"
      flow="column"
      gap="2x"
      qa="DashboardSettingsPanel"
    >
      <Flow display="grid" gridColumns="1fr auto" alignItems="start" gap="1x">
        <Flow gap="0.5x">
          <Title level={2} preset="h4">
            {node.nodeType === 'widget' ? 'Widget settings' : 'Layout settings'}
          </Title>
          <Text preset="c2" color="#dark.60">
            {typeLabel} · {node.columns}×{node.rows}
          </Text>
        </Flow>
        <Button
          type="clear"
          size="small"
          icon={<CloseIcon />}
          aria-label="Close settings"
          onPress={onClose}
        />
      </Flow>
      <Flow key={node.id} gap="1.5x">
        <TextInput label="Title" defaultValue={node.title} />
        {node.nodeType === 'widget' ? (
          <>
            <TextInput label="Data source" defaultValue="Sales analytics" />
            <TextInput label="Date range" defaultValue="Last 8 weeks" />
          </>
        ) : (
          <TextInput label="Layout behavior" defaultValue={typeLabel} />
        )}
      </Flow>
      <Flow
        display="flex"
        placeContent="end"
        gap="1x"
        styles={{ marginTop: 'auto' }}
      >
        <Button onPress={onClose}>Cancel</Button>
        <Button type="primary" onPress={onClose}>
          Apply
        </Button>
      </Flow>
    </Panel>
  );
}

export function DashboardPlayground({
  rowHeight,
  gap,
  selectionMode,
}: Pick<CubeDashboardProps, 'rowHeight' | 'gap' | 'selectionMode'>) {
  const nextId = useRef(10);
  const [containers, setContainers] =
    useState<PlaygroundContainer[]>(INITIAL_CONTAINERS);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const addTopLevelContainer = (
    kind: ContainerKind,
    placement: DashboardPlacement = {
      column: 0,
      row: containers.length,
      columns: 12,
      rows: TOP_LEVEL_ROWS,
    },
  ) => {
    const index = nextId.current;
    nextId.current += 1;
    const container: PlaygroundContainer = {
      nodeType: 'container',
      id: `${kind}-${index}`,
      kind,
      title: `${CONTAINER_LABELS[kind]} ${index}`,
      ...placement,
      children: [],
      ...(kind === 'tabs' && {
        tabs: [
          { id: 'main', title: 'Main view', children: [] },
          { id: 'comparison', title: 'Comparison', children: [] },
        ],
      }),
    };

    setContainers(normalizeTopLevel([...containers, container]));
    setNotice(`${CONTAINER_LABELS[kind]} added at the top level.`);
  };

  const addWidget = (
    parentId: string,
    type: WidgetType,
    placement: DashboardPlacement,
  ) => {
    const parent = findContainer(containers, parentId);
    if (!parent) return;

    const definition = WIDGET_DEFINITIONS[type];
    const index = nextId.current;
    nextId.current += 1;
    const widget: PlaygroundWidget = {
      nodeType: 'widget',
      id: `${type}-${index}`,
      type,
      title: `${definition.label} ${index}`,
      ...placement,
    };

    setContainers(
      updateContainerTree(containers, parentId, (container) => ({
        ...container,
        children: normalizeStackChildren(container, [
          ...container.children,
          widget,
        ]),
      })),
    );
    setNotice(`${definition.label} added inside ${parent.title}.`);
  };

  const addNestedContainer = (
    parentId: string,
    kind: NestedContainerKind,
    placement: DashboardPlacement,
  ) => {
    const parent = findContainer(containers, parentId);
    if (!parent) return;

    const index = nextId.current;
    nextId.current += 1;
    const nested: PlaygroundContainer = {
      nodeType: 'container',
      id: `${kind}-${index}`,
      kind,
      title: `${CONTAINER_LABELS[kind]} ${index}`,
      ...placement,
      children: [],
    };

    setContainers(
      updateContainerTree(containers, parentId, (container) => ({
        ...container,
        children: normalizeStackChildren(container, [
          ...container.children,
          nested,
        ]),
      })),
    );
    setNotice(`${CONTAINER_LABELS[kind]} added inside ${parent.title}.`);
  };

  const addRegisteredItem = (itemId: string, info: DashboardAddItemInfo) => {
    const [nodeType, value] = itemId.split(':');

    if (info.parentKind === 'root') {
      addTopLevelContainer(value as ContainerKind, info.placement);
      return;
    }

    if (info.parentKind === 'tabs' && info.tabsId && info.tabId) {
      const index = nextId.current;
      nextId.current += 1;
      const kind = value as NestedContainerKind;
      const container: PlaygroundContainer = {
        nodeType: 'container',
        id: `${kind}-${index}`,
        kind,
        title: `${CONTAINER_LABELS[kind]} ${index}`,
        ...info.placement,
        children: [],
      };
      setContainers(
        updateTabLayout(containers, info.tabsId, info.tabId, [container]),
      );
      setNotice(`${CONTAINER_LABELS[kind]} added to the ${info.tabId} tab.`);
      return;
    }

    if (!info.parentId) return;

    if (nodeType === 'widget') {
      addWidget(info.parentId, value as WidgetType, info.placement);
    } else {
      addNestedContainer(
        info.parentId,
        value as NestedContainerKind,
        info.placement,
      );
    }
  };

  // `onDuplicatePress` is opt-in, and the playground opts in for widgets only —
  // duplicating a container would mean remapping every descendant id.
  const duplicateWidget = (parentId: string, widget: PlaygroundWidget) => {
    const parent = findContainer(containers, parentId);
    if (!parent) return;

    const spot =
      parent.kind === 'grid'
        ? findFreeSpot(
            normalizeStackChildren(parent),
            widget,
            getContainerColumns(parent),
            parent.rows,
          )
        : { column: 0, row: 0 };

    if (!spot) {
      setNotice(`No room to duplicate ${widget.title} in ${parent.title}.`);
      return;
    }

    const index = nextId.current;
    nextId.current += 1;
    const copy: PlaygroundWidget = {
      ...widget,
      ...spot,
      id: `${widget.type}-${index}`,
      title: `${widget.title} copy`,
    };

    setContainers(
      updateContainerTree(containers, parentId, (container) => ({
        ...container,
        children: normalizeStackChildren(container, [
          ...container.children,
          copy,
        ]),
      })),
    );
    setNotice(`${widget.title} duplicated in ${parent.title}.`);
  };

  const deleteNode = (id: string, title: string) => {
    const removal = removePlaygroundNode(containers, id);
    if (!removal.removed) return;

    setContainers(normalizeTopLevel(removal.nodes as PlaygroundContainer[]));
    setSettingsId((current) => (current === id ? null : current));
    setNotice(`${title} deleted.`);
  };

  const handleCrossParentPlacement = (
    sourceParentId: string | null,
    nodeId: string,
    nodeTitle: string,
    placement: DashboardPlacement,
    info: DashboardPlacementChangeInfo,
  ) => {
    if (
      info.reason !== 'move' ||
      info.destinationParentId === undefined ||
      info.destinationParentId === sourceParentId
    ) {
      return false;
    }

    const movementItems = info.items ?? [{ id: nodeId, placement }];
    const result =
      movementItems.length > 1
        ? transferPlaygroundNodes(
            containers,
            movementItems,
            info.destinationParentId,
          )
        : transferPlaygroundNode(
            containers,
            nodeId,
            info.destinationParentId,
            placement,
          );

    if (result.error) {
      setNotice(result.error);
      return true;
    }

    if (info.phase === 'commit') {
      setContainers(result.containers);
      setNotice(
        movementItems.length > 1
          ? `${movementItems.length} selected items moved into ${result.destinationTitle}.`
          : `${nodeTitle} moved into ${result.destinationTitle}.`,
      );
    } else {
      setNotice(
        movementItems.length > 1
          ? `Release to move ${movementItems.length} selected items into ${result.destinationTitle}.`
          : `Release to move ${nodeTitle} into ${result.destinationTitle}.`,
      );
    }

    return true;
  };

  const updatePlacement = (
    parentId: string,
    nodeId: string,
    placement: DashboardPlacement,
    info: DashboardPlacementChangeInfo,
  ) => {
    const parent = findContainer(containers, parentId);
    if (!parent) return;
    const node = parent.children.find((child) => child.id === nodeId);
    if (
      node &&
      handleCrossParentPlacement(parentId, nodeId, node.title, placement, info)
    ) {
      return;
    }

    // Dashboard resolves move occupancy itself — swapping a Grid occupant into
    // the vacated box, reordering a stack — and reports the whole arrangement
    // through `info.items`. The consumer's job is to write it down.
    if (info.reason === 'move') {
      if (info.isBlocked) {
        setNotice('That item cannot swap with the current occupants.');
        return;
      }

      if (info.phase === 'commit') {
        setNotice(
          info.items && info.items.length > 1
            ? `${info.items.length} items moved.`
            : `Moved to ${placement.columns}×${placement.rows} at column ${placement.column + 1}, row ${placement.row + 1}.`,
        );
        return;
      }

      const placements = new Map(
        [
          ...(info.items ?? [{ id: nodeId, placement }]),
          ...(info.displaced ?? []),
        ].map((item) => [item.id, item.placement]),
      );

      setContainers(
        updateContainerTree(containers, parentId, (container) => ({
          ...container,
          children: sortStackChildren(
            container,
            container.children.map((child) => {
              const next = placements.get(child.id);

              return next ? { ...child, ...next } : child;
            }),
          ),
        })),
      );
      setNotice(null);
      return;
    }

    const resized = `Resized to ${placement.columns}×${placement.rows} at column ${placement.column + 1}, row ${placement.row + 1}.`;

    // A drag has already written every step by the time it commits. A menu size
    // command is a single `commit` with no preview behind it, so it still has to
    // be applied here.
    if (info.phase === 'commit' && info.input !== 'command') {
      setNotice(resized);
      return;
    }

    if (acceptsPlacement(parent, nodeId, placement)) {
      setNotice('That resize is blocked by another item.');
      return;
    }

    // Resizing a stack changes its children's spans too, and Dashboard reports
    // them in `info.displaced` — one level below `parentId`, so they are
    // written by id rather than by position.
    const resizes = new Map(
      [{ id: nodeId, placement }, ...(info.displaced ?? [])].map((item) => [
        item.id,
        item.placement,
      ]),
    );

    setContainers(
      applyPlacements(containers, resizes) as PlaygroundContainer[],
    );

    setNotice(info.input === 'command' ? resized : null);
  };

  const updateTopLevelContainerPlacement = (
    container: PlaygroundContainer,
    placement: DashboardPlacement,
    info: DashboardPlacementChangeInfo,
  ) => {
    if (
      handleCrossParentPlacement(
        null,
        container.id,
        container.title,
        placement,
        info,
      )
    ) {
      return;
    }

    if (info.reason === 'move' && info.items && info.items.length > 1) {
      if (info.phase === 'commit') {
        setNotice(`${info.items.length} selected containers moved.`);
        return;
      }

      const movingIds = new Set(info.items.map((item) => item.id));
      const stationary = containers.filter(
        (current) => !movingIds.has(current.id),
      );
      const moving = containers.filter((current) => movingIds.has(current.id));
      const insertionIndex = Math.max(
        0,
        Math.min(
          stationary.length,
          Math.min(...info.items.map((item) => item.placement.row)),
        ),
      );
      const next = [...stationary];
      next.splice(insertionIndex, 0, ...moving);
      setContainers(normalizeTopLevel(next));
      setNotice(null);
      return;
    }

    const resized = `${container.title} resized to ${placement.columns}×${placement.rows}.`;

    // As above: a menu size command commits without ever previewing.
    if (info.phase === 'commit' && info.input !== 'command') {
      setNotice(info.reason === 'move' ? `${container.title} moved.` : resized);
      return;
    }

    if (info.reason === 'move') {
      const sourceIndex = containers.findIndex(
        (current) => current.id === container.id,
      );
      const targetIndex = Math.max(
        0,
        Math.min(containers.length - 1, placement.row),
      );

      if (sourceIndex >= 0 && sourceIndex !== targetIndex) {
        const reordered = [...containers];
        const [moving] = reordered.splice(sourceIndex, 1);
        reordered.splice(targetIndex, 0, moving);
        setContainers(normalizeTopLevel(reordered));
      }

      setNotice(null);

      return;
    }

    setContainers(
      updateContainerTree(containers, container.id, (current) => ({
        ...current,
        ...placement,
      })),
    );

    setNotice(info.input === 'command' ? resized : null);
  };

  const renderWidget = (
    widget: PlaygroundWidget,
    parent: PlaygroundContainer,
  ) => {
    const definition = WIDGET_DEFINITIONS[widget.type];

    return (
      <Dashboard.Widget
        key={widget.id}
        id={widget.id}
        aria-label={widget.title}
        column={widget.column}
        row={widget.row}
        columns={widget.columns}
        rows={widget.rows}
        minColumns={definition.minColumns}
        maxColumns={definition.maxColumns}
        minRows={definition.minRows}
        maxRows={definition.maxRows}
        isMovable
        isResizable
        isCard
        moveLabel={`Move ${widget.title}`}
        resizeLabel={`Resize ${widget.title}`}
        settingsLabel={`Settings for ${widget.title}`}
        duplicateLabel={`Duplicate ${widget.title}`}
        deleteLabel={`Delete ${widget.title}`}
        onPlacementChange={(placement, info) =>
          updatePlacement(parent.id, widget.id, placement, info)
        }
        onSettingsPress={() => setSettingsId(widget.id)}
        onDuplicatePress={() => duplicateWidget(parent.id, widget)}
        onDeletePress={() => deleteNode(widget.id, widget.title)}
      >
        <WidgetContent widget={widget} />
      </Dashboard.Widget>
    );
  };

  const renderContainer = (
    container: PlaygroundContainer,
    depth: number,
    parent: PlaygroundContainer | null,
    tabParent?: { tabsId: string; tabId: string; layoutId: string },
  ) => {
    const layoutContainer = {
      ...container,
      children: normalizeStackChildren(container),
    };
    const children = layoutContainer.children.map((child) =>
      child.nodeType === 'widget'
        ? renderWidget(child, layoutContainer)
        : renderContainer(child, depth + 1, layoutContainer),
    );
    const props = {
      id: container.id,
      'aria-label': container.title,
      column: container.column,
      row: container.row,
      columns: container.columns,
      rows: container.rows,
      isMovable: true,
      isResizable: true,
      moveLabel: `Move ${container.title}`,
      resizeLabel: `Resize ${container.title}`,
      settingsLabel: `Settings for ${container.title}`,
      deleteLabel: `Delete ${container.title}`,
      onSettingsPress: () => setSettingsId(container.id),
      onDeletePress: () => deleteNode(container.id, container.title),
      onPlacementChange: (
        placement: DashboardPlacement,
        info: DashboardPlacementChangeInfo,
      ) => {
        if (tabParent) {
          if (
            handleCrossParentPlacement(
              tabParent.layoutId,
              container.id,
              container.title,
              placement,
              info,
            )
          ) {
            return;
          }

          if (info.phase === 'preview') {
            setContainers(
              updateContainerTree(containers, container.id, (current) => ({
                ...current,
                ...placement,
              })),
            );
            setNotice(null);
          } else {
            setNotice(
              `${info.reason === 'move' ? 'Moved' : 'Resized'} ${container.title} to ${placement.columns}×${placement.rows}.`,
            );
          }
          return;
        }

        return parent
          ? updatePlacement(parent.id, container.id, placement, info)
          : updateTopLevelContainerPlacement(container, placement, info);
      },
    };

    if (container.kind === 'horizontal-stack') {
      return (
        <Dashboard.HorizontalStack key={container.id} {...props}>
          {children}
        </Dashboard.HorizontalStack>
      );
    }

    if (container.kind === 'vertical-stack') {
      return (
        <Dashboard.VerticalStack key={container.id} {...props}>
          {children}
        </Dashboard.VerticalStack>
      );
    }

    if (container.kind === 'tabs') {
      const tabs = container.tabs ?? [
        { id: 'main', title: 'Main view', children: [] },
      ];

      return (
        <Dashboard.Tabs key={container.id} {...props}>
          {tabs.map((tab) => (
            <Dashboard.Tab key={tab.id} id={tab.id} title={tab.title}>
              {tab.children.map((layout) =>
                renderContainer(layout, depth + 1, null, {
                  tabsId: container.id,
                  tabId: tab.id,
                  layoutId: `${container.id}:${tab.id}`,
                }),
              )}
            </Dashboard.Tab>
          ))}
        </Dashboard.Tabs>
      );
    }

    return (
      <Dashboard.Grid key={container.id} {...props}>
        {children}
      </Dashboard.Grid>
    );
  };

  const reset = () => {
    nextId.current = 10;
    setContainers(normalizeTopLevel(INITIAL_CONTAINERS));
    setSettingsId(null);
    setNotice('Dashboard reset.');
  };

  const settingsNode = settingsId
    ? findPlaygroundNode(containers, settingsId)
    : null;
  const totals = countNodes(containers);

  return (
    <Flow
      position="relative"
      display="grid"
      gridRows="auto minmax(0, 1fr)"
      height="100vh"
      fill="#surface-2"
      overflow="hidden"
    >
      <Flow
        display="grid"
        gridColumns="minmax(0, 1fr) auto"
        alignItems="center"
        gap="2x"
        padding="2x 3x"
        fill="#surface"
        styles={{ borderBottom: '1bw #border' }}
      >
        <Flow gap="0.5x">
          <Title preset="h3">Dashboard Playground</Title>
          <Text preset="c2" color="#dark.60">
            Drag widgets or containers from any non-action surface, or press and
            drag the add button to claim an area before choosing what fills it.
            Every node's actions — including the size commands — sit behind its
            menu. Stacks reflow blockers, Grid swaps when both placements fit,
            and items move into or out of nested containers through level three.
          </Text>
        </Flow>
        <Flow display="flex" gap="1x">
          <Button icon={<ReloadIcon />} onPress={reset}>
            Reset
          </Button>
        </Flow>
      </Flow>

      <Flow padding="2x 3x" gap="2x" overflow="auto" styles={{ minHeight: 0 }}>
        <WidgetPresetLegend />
        <Flow
          role="status"
          aria-live="polite"
          color={
            notice?.includes('blocked') || notice?.startsWith('No ')
              ? '#danger-text'
              : '#dark.60'
          }
          preset="c2"
          styles={{ minHeight: '2x' }}
        >
          {notice ??
            `${totals.containers} containers · ${totals.widgets} widgets · maximum depth 3`}
        </Flow>

        <Dashboard
          aria-label="Editable commerce dashboard"
          rowHeight={rowHeight}
          gap={gap}
          isEditing
          selectionMode={selectionMode}
          addItems={ADD_ITEMS}
          onAddItem={addRegisteredItem}
        >
          {containers.map((container) => renderContainer(container, 1, null))}
        </Dashboard>
      </Flow>

      {settingsNode ? (
        <SettingsPanel
          node={settingsNode}
          onClose={() => setSettingsId(null)}
        />
      ) : null}
    </Flow>
  );
}

export const Playground: Story = {
  render: ({ rowHeight, gap, selectionMode }) => (
    <DashboardPlayground
      rowHeight={rowHeight}
      gap={gap}
      selectionMode={selectionMode}
    />
  ),
};
