import { useState } from 'react';

import { Text } from '../../content/Text';
import { Flow } from '../../layout/Flow';

import { DataTable } from './DataTable';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CubeTableCellRange, CubeTableSort } from '../TableBase/types';
import type { CubeDataTableColumn } from './types';

interface ResultRow {
  id: string;
  region: string;
  channel: string;
  orders: number;
  revenue: number;
  conversion: number;
}

const REGIONS = ['us-east-1', 'us-west-2', 'eu-central-1', 'ap-south-1'];
const CHANNELS = ['organic', 'paid', 'email', 'referral'];

const ROWS: ResultRow[] = Array.from({ length: 240 }, (_, i) => ({
  id: `r${i}`,
  region: REGIONS[i % REGIONS.length],
  channel: CHANNELS[(i >> 2) % CHANNELS.length],
  orders: ((i * 37) % 900) + 12,
  revenue: ((i * 7919) % 250_000) + 1_500,
  conversion: (((i * 13) % 780) + 40) / 1000,
}));

const COLUMNS: CubeDataTableColumn<ResultRow>[] = [
  { key: 'region', title: 'Region', isSortable: true, minWidth: 140 },
  { key: 'channel', title: 'Channel', isSortable: true, minWidth: 120 },
  {
    key: 'orders',
    title: 'Orders',
    dataType: 'number',
    isSortable: true,
    minWidth: 110,
    format: (value) => value.toLocaleString(),
  },
  {
    key: 'revenue',
    title: 'Revenue',
    dataType: 'number',
    isSortable: true,
    minWidth: 140,
    format: (value) =>
      value.toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
  },
  {
    key: 'conversion',
    title: 'Conversion',
    dataType: 'number',
    isSortable: true,
    minWidth: 130,
    format: (value) =>
      value.toLocaleString(undefined, {
        style: 'percent',
        minimumFractionDigits: 1,
      }),
  },
];

const TOTALS: ResultRow[] = [
  {
    id: 'total',
    region: 'Total',
    channel: '',
    orders: ROWS.reduce((sum, row) => sum + row.orders, 0),
    revenue: ROWS.reduce((sum, row) => sum + row.revenue, 0),
    conversion:
      ROWS.reduce((sum, row) => sum + row.conversion, 0) / ROWS.length,
  },
];

const meta: Meta<typeof DataTable> = {
  title: 'Data/DataTable',
  component: DataTable,
  args: {
    data: ROWS,
    columns: COLUMNS,
    ariaLabel: 'Query results',
    shape: 'card',
    // Bounded from the meta so every story is, the way Cloud embeds these:
    // a result grid always lives in a pane with a height. An unbounded one
    // sizes to its content, which for a full page of rows is a wall of table
    // and takes the scroller — and the sticky header — out of the picture.
    height: '420px',
  },
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof DataTable<ResultRow>>;

/**
 * The defaults are an analytical grid's rather than a list's: `t4` type, banded
 * rows, `small` density, and resizable columns. A `number` column right-aligns
 * and takes tabular figures, so digits line up down the column.
 */
export const Default: Story = {};

/**
 * Sorting is **multi-column**, which is the main behavioural difference from
 * `ItemTable`. Click a second header and it joins the sort rather than
 * replacing it; each sorted column shows its position in the precedence.
 *
 * A column cycles `ascending → descending → unsorted` as usual, and dropping
 * one leaves the others in order.
 */
export const MultiColumnSort: Story = {
  render: (args) => {
    const [sorts, setSorts] = useState<CubeTableSort[]>([
      { columnKey: 'region', direction: 'asc' },
      { columnKey: 'revenue', direction: 'desc' },
    ]);

    return (
      <Flow gap="1x">
        <DataTable<ResultRow>
          {...args}
          sorts={sorts}
          onSortsChange={setSorts}
        />
        <Text color="#dark-03">
          {sorts.length
            ? sorts
                .map(
                  (sort, index) =>
                    `${index + 1}. ${sort.columnKey} ${sort.direction}`,
                )
                .join(' · ')
            : 'unsorted'}
        </Text>
      </Flow>
    );
  },
};

/**
 * `pinnedTopRows` and `pinnedBottomRows` stick to the edges of the scroller
 * while the rest scrolls under them. They are ordinary rows as far as the
 * columns are concerned — the grid does not know what a total is, so a
 * subtotal, a grand total and a forecast are all just rows.
 */
export const PinnedTotals: Story = {
  args: { pinnedBottomRows: TOTALS, paginationMode: 'off' },
};

/**
 * Pagination and a pinned total together — the shape a paged query result
 * actually has.
 *
 * The total is not paged: it sits outside the page window, so it stays put as
 * you move through the pages and keeps summing the whole result rather than the
 * rows currently on screen. It is excluded from sorting for the same reason.
 *
 * `isCellSelectable` vetoes its label cell. `"Total"` is a caption for the row,
 * not a figure, so there is nothing useful to do with it selected — the cell is
 * inert, and a range that spans the column simply skips it and copies an empty
 * field in its place, keeping the block's shape.
 */
export const PaginatedWithTotals: Story = {
  args: {
    pinnedBottomRows: TOTALS,
    defaultPageSize: 25,
    pageSizeOptions: [25, 50, 100],
    isCellSelectable: ({ section, columnKey }) =>
      !(
        section === 'pinnedBottom' &&
        (columnKey === 'region' || columnKey === 'channel')
      ),
  },
};

/**
 * `showRowNumbers` puts a continuous count down the side. It stays continuous
 * across pages — row 101 is row 101, not row 1 of page two.
 */
export const RowNumbers: Story = {
  args: {
    showRowNumbers: true,
    defaultPageSize: 50,
    pageSizeOptions: [25, 50, 100],
  },
};

/**
 * The whole result at once. Above `virtualizeThreshold` a bounded grid
 * virtualizes on its own, so turning pagination off is a reasonable default for
 * a query result the user wants to scroll.
 */
export const Unpaginated: Story = {
  args: {
    paginationMode: 'off',
    showRowNumbers: true,
    pinnedBottomRows: TOTALS,
  },
};

/**
 * The same loading, empty and error states as `ItemTable`, since they come from
 * the shared renderer.
 */
export const States: Story = {
  render: (args) => (
    <Flow gap="4x">
      <DataTable<ResultRow> {...args} height="200px" data={[]} isLoading />
      <DataTable<ResultRow> {...args} height="200px" data={[]} />
      <DataTable<ResultRow>
        {...args}
        height="200px"
        data={[]}
        error="The query failed to run."
      />
    </Flow>
  ),
};

/**
 * A result grid is read by cell, so a cell is what you select. Click one,
 * shift-click or drag to grow a rectangle, and `⌘/Ctrl+C` puts the block on the
 * clipboard as tab-separated values — which Excel and Sheets both paste as a
 * grid rather than as one run of text. `Escape` clears it.
 *
 * Pinned rows and the structural columns stay out of every range: a total is
 * not part of the block, and the row numbers are the grid's own furniture.
 */
export const CellSelection: Story = {
  render: (args) => {
    const [range, setRange] = useState<CubeTableCellRange | null>(null);

    return (
      <Flow gap="1x">
        <DataTable<ResultRow>
          {...args}
          pinnedBottomRows={TOTALS}
          paginationMode="off"
          selectedCellRange={range}
          onCellRangeChange={setRange}
        />
        <Text color="#dark-03">
          {range
            ? `${range.fromColumnKey}…${range.toColumnKey} × rows ${range.fromRowKey}…${range.toRowKey} — press ⌘/Ctrl+C to copy`
            : 'no cells selected'}
        </Text>
      </Flow>
    );
  },
};
