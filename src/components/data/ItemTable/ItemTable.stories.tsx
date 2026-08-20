import { useEffect, useMemo, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { DatabaseIcon, FolderIcon, PlusIcon, UserIcon } from '../../../icons';
import { Button, Menu } from '../../actions';
import { Tag } from '../../content/Tag/Tag';
import { Text } from '../../content/Text';
import { FilterPicker } from '../../fields/FilterPicker';
import { SearchInput } from '../../fields/SearchInput';
import { Flow } from '../../layout/Flow';
import { Space } from '../../layout/Space';

import { ItemTable } from './ItemTable';

import type { Key } from '@react-types/shared';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CubeTableSort } from '../TableBase/types';
import type { CubeItemTableColumn, CubeTableBulkAction } from './types';

interface Deployment {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'failed';
  owner: { name: string; email: string };
  region: string;
  queries: number;
}

type TreeDeployment = Deployment & { children?: TreeDeployment[] };

const DEPLOYMENTS: Deployment[] = [
  {
    id: 'd1',
    name: 'analytics-prod',
    status: 'running',
    owner: { name: 'Ada Lovelace', email: 'ada@cube.dev' },
    region: 'us-east-1',
    queries: 128_402,
  },
  {
    id: 'd2',
    name: 'analytics-staging',
    status: 'stopped',
    owner: { name: 'Grace Hopper', email: 'grace@cube.dev' },
    region: 'us-west-2',
    queries: 4_182,
  },
  {
    id: 'd3',
    name: 'billing-etl',
    status: 'failed',
    owner: { name: 'Alan Turing', email: 'alan@cube.dev' },
    region: 'eu-central-1',
    queries: 91,
  },
  {
    id: 'd4',
    name: 'growth-marts',
    status: 'running',
    owner: { name: 'Katherine Johnson', email: 'katherine@cube.dev' },
    region: 'eu-west-1',
    queries: 55_910,
  },
  {
    id: 'd5',
    name: 'ml-features',
    status: 'running',
    owner: { name: 'Barbara Liskov', email: 'barbara@cube.dev' },
    region: 'ap-south-1',
    queries: 12_004,
  },
];

const TREE_DEPLOYMENTS: TreeDeployment[] = [
  {
    ...DEPLOYMENTS[0],
    id: 'production',
    name: 'Production',
    children: [
      {
        ...DEPLOYMENTS[1],
        id: 'analytics',
        name: 'Analytics',
        children: [
          { ...DEPLOYMENTS[2], id: 'billing', name: 'Billing pipeline' },
        ],
      },
      { ...DEPLOYMENTS[3], id: 'growth', name: 'Growth marts' },
    ],
  },
  { ...DEPLOYMENTS[4], id: 'sandbox', name: 'Sandbox' },
];

const STATUS_THEME = {
  running: 'success',
  stopped: 'default',
  failed: 'danger',
} as const;

/** Distinct values, the way a real filter's options come from the data. */
const REGIONS = [...new Set(DEPLOYMENTS.map((d) => d.region))].sort();
const STATUSES = [...new Set(DEPLOYMENTS.map((d) => d.status))];

const COLUMNS: CubeItemTableColumn<Deployment>[] = [
  {
    key: 'name',
    title: 'Name',
    isRowHeader: true,
    flex: 2,
    header: { icon: <DatabaseIcon /> },
  },
  {
    key: 'status',
    title: 'Status',
    width: 140,
    render: (value: Deployment['status']) => (
      <Tag theme={STATUS_THEME[value]}>{value}</Tag>
    ),
  },
  {
    // Dot notation reads a nested path without a `getValue` closure.
    key: 'owner.name',
    title: 'Owner',
    header: { icon: <UserIcon /> },
  },
  { key: 'region', title: 'Region', width: 160 },
  {
    key: 'queries',
    title: 'Queries',
    width: 140,
    align: 'end',
    format: (value: number) => value.toLocaleString('en-US'),
  },
];

/**
 * `COLUMNS` with every column opted in.
 *
 * Only the sorting stories use this. Everything else shows the component's real
 * default — inert headers, no hover — because sorting is opt in per column and a
 * shared fixture that quietly turns it on misrepresents every story built on it.
 */
const SORTABLE_COLUMNS: CubeItemTableColumn<Deployment>[] = COLUMNS.map(
  (column) => ({ ...column, isSortable: true }),
);

const meta = {
  title: 'Data/ItemTable',
  component: ItemTable,
  parameters: { layout: 'padded' },
  args: {
    data: DEPLOYMENTS,
    columns: COLUMNS,
    ariaLabel: 'Deployments',
  },
  argTypes: {
    /* Content */
    data: {
      control: { type: null },
      description: 'The rows to render',
      table: { type: { summary: 'T[]' } },
    },
    columns: {
      control: { type: null },
      description: 'Column definitions',
      table: { type: { summary: 'CubeItemTableColumn<T>[]' } },
    },
    rowKey: {
      control: 'text',
      description: 'Property used as the row key',
      table: {
        defaultValue: { summary: 'id' },
        type: { summary: 'string' },
      },
    },

    /* Presentation */
    shape: {
      control: 'radio',
      options: ['plain', 'card'],
      table: {
        defaultValue: { summary: 'plain' },
        type: { summary: "'plain' | 'card'" },
      },
    },
    size: {
      control: 'radio',
      options: ['xsmall', 'small', 'medium', 'large', 'xlarge'],
      table: {
        defaultValue: { summary: 'medium' },
        type: { summary: 'SizeName' },
      },
    },
    rowHeight: {
      control: 'number',
      description: 'Row height in px. Defaults to the height implied by `size`',
      table: { type: { summary: 'number' } },
    },
    headerHeight: {
      control: 'number',
      table: { type: { summary: 'number' } },
    },
    isStriped: {
      control: 'boolean',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    isHeaderHidden: {
      control: 'boolean',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    isHeaderSticky: {
      control: 'boolean',
      table: {
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean' },
      },
    },

    /* State */
    isLoading: {
      control: 'boolean',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    skeletonRowCount: {
      control: 'number',
      table: {
        defaultValue: { summary: '6' },
        type: { summary: 'number' },
      },
    },
    emptyLabel: {
      control: 'text',
      description: 'Shown when there is nothing at all',
      table: { type: { summary: 'ReactNode' } },
    },
    noResultsLabel: {
      control: 'text',
      description: 'Shown instead of `emptyLabel` when a filter is active',
      table: { type: { summary: 'ReactNode' } },
    },
    error: {
      control: 'text',
      description: 'Takes precedence over both labels',
      table: { type: { summary: 'ReactNode' } },
    },

    /* Sorting */
    sortMode: {
      control: 'radio',
      options: ['client', 'server', 'off'],
      description: 'Who does the sorting',
      table: {
        defaultValue: { summary: "'client' when any column is sortable" },
        type: { summary: "'client' | 'server' | 'off'" },
      },
    },
    sort: {
      control: { type: null },
      description: 'Controlled sort state',
      table: { type: { summary: 'CubeTableSort | null' } },
    },
    defaultSort: {
      control: { type: null },
      description: 'Initial sort for uncontrolled usage',
      table: { type: { summary: 'CubeTableSort | null' } },
    },

    /* Events */
    onSortChange: { action: 'sortChange', table: { category: 'Events' } },
  },
} satisfies Meta<typeof ItemTable<Deployment>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * Nested source rows opt into a native treegrid. The disclosure is independent
 * from row activation, and multiple selection cascades through descendants.
 */
export const TreeRows: Story = {
  args: {
    data: TREE_DEPLOYMENTS,
    getRowChildren: (row) => (row as TreeDeployment).children,
    treeColumnKey: 'name',
    selectionMode: 'multiple',
    paginationMode: 'off',
    shape: 'card',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: /^Expand Production/ }),
    );

    await waitFor(() => {
      expect(canvas.getByText('Analytics')).toBeVisible();
      expect(
        canvas.getByRole('button', { name: /^Collapse Production/ }),
      ).toBeVisible();
    });
  },
};

/**
 * `shape="card"` frames the table, `isStriped` bands the rows, and `size` drives
 * both row and header height.
 */
export const Appearance: Story = {
  render: (args) => (
    <Flow gap="4x">
      <ItemTable {...args} shape="card" />
      <ItemTable {...args} shape="card" isStriped />
      <ItemTable {...args} shape="card" size="small" />
      <ItemTable {...args} shape="card" isHeaderHidden />
    </Flow>
  ),
};

/**
 * The four states a table can be in besides "has rows". `isFiltered` is what
 * separates "no matches" from "nothing exists" — the built-in search sets it
 * automatically.
 */
export const States: Story = {
  render: (args) => (
    <Flow gap="4x">
      <ItemTable {...args} shape="card" data={[]} isLoading />
      <ItemTable {...args} shape="card" data={[]} />
      <ItemTable
        {...args}
        shape="card"
        data={[]}
        isFiltered
        noResultsLabel="No deployments match “etl”"
      />
      <ItemTable
        {...args}
        shape="card"
        data={[]}
        error="Could not load deployments."
      />
    </Flow>
  ),
};

/** Roughly a real query over the wire — long enough to see, short enough to use. */
const LATENCY = 700;

/**
 * Stands in for a query: every dependency change re-fetches, and the result
 * lands one `LATENCY` later.
 *
 * The delay is the point. Without it a server story is indistinguishable from a
 * client one, and the window where the table still holds the *previous* answer —
 * which is what `loadingIndicator` governs — never appears.
 */
function useServerQuery<T>(compute: () => T, deps: unknown[]) {
  const [data, setData] = useState(compute);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    const timer = setTimeout(() => {
      setData(compute());
      setIsLoading(false);
    }, LATENCY);

    // A newer request supersedes the one in flight, so the table never shows
    // the answer to a question the user has already moved on from.
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, isLoading };
}

/**
 * Click a header to cycle `ascending → descending → unsorted`. Client mode
 * reorders with a locale-aware collator, and a column with `format` sorts the
 * way it reads.
 *
 * `sortMode="server"` never reorders — the second table owns its data and
 * re-sorts on `onSortChange`, over a 700ms round trip. The header shows
 * the new direction immediately while the rows lag behind it.
 */
/**
 * Sorting is **opt in, per column** — this is what a table looks like without it.
 *
 * No column sets `isSortable`, so no header is clickable and none takes a tab
 * stop. `sortMode="client"` still orders the rows, so the list arrives in the
 * order you asked for and the user cannot disturb it. Most lists want exactly
 * this: the order is a property of the data, not a control.
 *
 * The sorted column keeps `aria-sort`, so the order is announced even though the
 * header cannot be operated. It is deliberately not drawn — the arrow belongs to
 * the clickable affordance — so `Name` carries its own `↑` through
 * `header.suffix` to show how you would mark it.
 *
 * Rows already in the right order need none of this: pass them and set nothing.
 */
export const FixedSort: Story = {
  args: {
    // `COLUMNS` as-is — no column opts in. Compare with `Sorting` below, which
    // uses `SORTABLE_COLUMNS`.
    columns: COLUMNS.map((column) =>
      column.key === 'name'
        ? { ...column, header: { suffix: <Text color="#dark-04">↑</Text> } }
        : column,
    ),
    sortMode: 'client',
    sort: { columnKey: 'name', direction: 'asc' },
  },
};

export const Sorting: Story = {
  render: (args) => {
    const [sort, setSort] = useState<CubeTableSort | null>({
      columnKey: 'name',
      direction: 'asc',
    });

    const { data: rows, isLoading } = useServerQuery(() => {
      if (!sort) return DEPLOYMENTS;

      const direction = sort.direction === 'asc' ? 1 : -1;
      const read = (row: Deployment) =>
        sort.columnKey === 'owner.name'
          ? row.owner.name
          : (row[sort.columnKey as keyof Deployment] as string | number);

      return [...DEPLOYMENTS].sort((a, b) => {
        const left = read(a);
        const right = read(b);

        return left === right ? 0 : (left < right ? -1 : 1) * direction;
      });
    }, [sort]);

    return (
      <Flow gap="4x">
        <ItemTable
          {...args}
          shape="card"
          columns={SORTABLE_COLUMNS}
          defaultSort={{ columnKey: 'queries', direction: 'desc' }}
        />
        <ItemTable
          {...args}
          shape="card"
          columns={SORTABLE_COLUMNS}
          data={rows}
          isLoading={isLoading}
          sortMode="server"
          sort={sort}
          onSortChange={setSort}
        />
      </Flow>
    );
  },
};

/**
 * `isSearchable` puts the input in the toolbar and the table filters itself.
 * The matcher tests each column's **display text**, so a formatted column
 * matches what the user sees and a dotted key like `owner.name` is searchable.
 */
export const Search: Story = {
  render: (args) => {
    const [regions, setRegions] = useState<Key[]>([]);

    const rows = useMemo(
      () =>
        regions.length
          ? DEPLOYMENTS.filter((d) => regions.includes(d.region))
          : DEPLOYMENTS,
      [regions],
    );

    return (
      <ItemTable
        {...args}
        shape="card"
        data={rows}
        isSearchable
        // The built-in search sets `isFiltered` on its own; a filter the page
        // owns has to say so. Without it an empty result would claim "no
        // deployments exist" rather than "none match".
        isFiltered={regions.length > 0}
        searchPlaceholder="Search deployments..."
        noResultsLabel="No deployments match"
        filters={
          <FilterPicker
            aria-label="Filter by region"
            size="small"
            selectionMode="multiple"
            placeholder="All regions"
            searchPlaceholder="Search regions..."
            selectedKeys={regions}
            onSelectionChange={(keys) => setRegions(keys as Key[])}
          >
            {REGIONS.map((region) => (
              <FilterPicker.Item key={region}>{region}</FilterPicker.Item>
            ))}
          </FilterPicker>
        }
        actions={
          <Button type="primary" size="small" icon={<PlusIcon />}>
            Create
          </Button>
        }
        onRefresh={() => {}}
      />
    );
  },
};

/**
 * `searchMode="server"` reports the debounced term without filtering, and the
 * query does the work — here behind a 700ms round trip on top of the debounce.
 * The previous matches stay on screen, dimmed, rather than the table blanking
 * on every keystroke.
 */
export const ServerSearch: Story = {
  render: (args) => {
    const [term, setTerm] = useState('');

    const { data: rows, isLoading } = useServerQuery(() => {
      const q = term.trim().toLowerCase();

      return q
        ? DEPLOYMENTS.filter((d) => d.name.toLowerCase().includes(q))
        : DEPLOYMENTS;
    }, [term]);

    return (
      <ItemTable
        {...args}
        shape="card"
        data={rows}
        isLoading={isLoading}
        isSearchable
        searchMode="server"
        searchPlaceholder="Search the server..."
        searchValue={term}
        noResultsLabel={`Nothing on the server matches “${term}”`}
        onSearchChange={setTerm}
      />
    );
  },
};

/**
 * The input does not have to live in the table. `isSearchable={false}` hides the
 * built-in one while a controlled `searchValue` still drives the matcher — the
 * page-header pattern, as a first-class path rather than a workaround.
 *
 * The second table rebuilds the toolbar entirely; `ItemTable.Search` reads the
 * table's state from context, so the term still has one owner.
 */
export const CustomSearchPlacement: Story = {
  render: (args) => {
    const [term, setTerm] = useState('');
    const [status, setStatus] = useState<Key | null>(null);

    const byStatus = useMemo(
      () =>
        status ? DEPLOYMENTS.filter((d) => d.status === status) : DEPLOYMENTS,
      [status],
    );

    return (
      <Flow gap="4x">
        <Flow gap="1x">
          <Space placeContent="space-between" placeItems="center">
            <SearchInput
              isClearable
              aria-label="Search deployments"
              placeholder="Search from the page header..."
              value={term}
              width="max 320px"
              onChange={setTerm}
            />
            <Text color="#dark-03">{`${DEPLOYMENTS.length} total`}</Text>
          </Space>
          <ItemTable
            {...args}
            shape="card"
            isSearchable={false}
            searchValue={term}
            noResultsLabel="No deployments match"
          />
        </Flow>

        <ItemTable
          {...args}
          shape="card"
          data={byStatus}
          isSearchable
          isFiltered={status != null}
          searchPlaceholder="Quick find..."
          noResultsLabel="No deployments match"
          toolbar={
            <ItemTable.Toolbar
              isSearchable
              filters={
                <FilterPicker
                  isClearable
                  aria-label="Filter by status"
                  type="clear"
                  size="small"
                  placeholder="Status: any"
                  selectedKey={status}
                  onSelectionChange={(key) => setStatus(key as Key | null)}
                >
                  {STATUSES.map((value) => (
                    <FilterPicker.Item key={value}>{value}</FilterPicker.Item>
                  ))}
                </FilterPicker>
              }
              actions={<Button size="small">Export</Button>}
            />
          }
        />
      </Flow>
    );
  },
};

const MANY = Array.from({ length: 137 }, (_, i) => ({
  ...DEPLOYMENTS[i % DEPLOYMENTS.length],
  id: `row-${i}`,
  name: `deployment-${String(i + 1).padStart(3, '0')}`,
  queries: (i * 7919) % 200_000,
}));

/**
 * Pagination lives in the footer and is on by default. The page-size selector
 * appears whenever `pageSizeOptions` is set, and `summary` prints the localized
 * item range.
 */
export const Pagination_: Story = {
  name: 'Pagination',
  args: {
    shape: 'card',
    data: MANY,
    defaultPageSize: 5,
    pageSizeOptions: [5, 10, 20],
  },
};

/**
 * The footer has three named slots. `footerStart` is where Cloud's "Load all
 * results" button belongs — the thing that today needs a `MutationObserver` to
 * inject into ag-grid's paging panel, because Community has no status bar.
 */
export const FooterSlots: Story = {
  args: {
    shape: 'card',
    data: MANY,
    defaultPageSize: 5,
    pageSizeOptions: [5, 10, 20],
    footerStart: (
      // The footer's own controls are `xsmall`; a slot button should match them
      // rather than the toolbar above.
      <Button size="xsmall">Load all results</Button>
    ),
    footerCenter: <Text color="#dark-03">Partial result set</Text>,
  },
};

/**
 * `paginationMode="server"` never slices — it reflects `page` and reports
 * changes, and `total` comes from the query. Paging takes 700ms here, so the
 * pagination control and the rows are visibly out of step for a moment; that
 * gap is what `loadingIndicator` is about.
 */
export const ServerPagination: Story = {
  render: (args) => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    // Stands in for a query with LIMIT/OFFSET.
    const { data: rows, isLoading } = useServerQuery(
      () => MANY.slice((page - 1) * pageSize, page * pageSize),
      [page, pageSize],
    );

    return (
      <ItemTable
        {...args}
        shape="card"
        data={rows}
        isLoading={isLoading}
        paginationMode="server"
        page={page}
        pageSize={pageSize}
        total={MANY.length}
        pageSizeOptions={[5, 10, 20]}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    );
  },
};

/**
 * What the table does while a refresh is in flight over rows it already has.
 * Page through all three at once and watch them diverge:
 *
 * - **`overlay`** (default) — the previous page stays readable and fully
 *   uncovered: the table fades, header included, and a band of lower opacity
 *   sweeps across it. Nothing moves and nothing is drawn on top, so the eye
 *   keeps its place and the table does not change height.
 * - **`skeleton`** — the previous page is discarded for placeholders. Honest
 *   that the rows are gone, but it flashes on every page, and a short page
 *   makes the table jump.
 * - **`none`** — no visuals at all beyond `aria-busy`. For pages that already
 *   show a top-level progress bar and do not want a second indicator.
 *
 * With no rows yet, `overlay` and `skeleton` both render skeleton rows — there
 * is nothing to keep — and `none` renders an empty body rather than flashing
 * "No items" before the first response.
 */
export const LoadingBehavior: Story = {
  render: (args) => {
    const [page, setPage] = useState(1);
    const { data: rows, isLoading } = useServerQuery(
      () => MANY.slice((page - 1) * 5, page * 5),
      [page],
    );

    const shared = {
      ...args,
      shape: 'card',
      data: rows,
      isLoading,
      paginationMode: 'server',
      page,
      pageSize: 5,
      total: MANY.length,
      onPageChange: setPage,
    } as const;

    return (
      <Flow gap="4x">
        <ItemTable {...shared} footerStart={<Text>overlay</Text>} />
        <ItemTable
          {...shared}
          loadingIndicator="skeleton"
          skeletonRowCount={5}
          footerStart={<Text>skeleton</Text>}
        />
        <ItemTable
          {...shared}
          loadingIndicator="none"
          footerStart={<Text>none</Text>}
        />
      </Flow>
    );
  },
};

/**
 * `selectionMode="multiple"` adds the checkbox column. Selection is keyed, so it
 * survives sorting, searching and paging — the same row stays selected wherever
 * it lands.
 *
 * Shift-click a checkbox to extend from the last one you touched.
 *
 * The three ways a row can be special are deliberately distinct, and the last
 * table shows all of them at once:
 *
 * - **`disabledKeys`** — inert. Not focusable, not interactive.
 * - **`isRowSelectable`** — fully interactive, only the checkbox is inert.
 *   `selectionTooltip` says why.
 * - **`getRowProps().isDimmed`** — purely visual, still selectable.
 */
export const Selection: Story = {
  render: (args) => {
    const [keys, setKeys] = useState<Key[] | 'all'>([]);

    return (
      <Flow gap="4x">
        <ItemTable
          {...args}
          shape="card"
          selectionMode="multiple"
          selectedKeys={keys}
          onSelectionChange={(next) => setKeys(next)}
          footerStart={
            <Text color="#dark-03">
              {keys === 'all'
                ? 'All deployments selected'
                : `${keys.length} selected`}
            </Text>
          }
        />

        <ItemTable
          {...args}
          shape="card"
          selectionMode="single"
          defaultSelectedKeys={['d2']}
        />

        <ItemTable
          {...args}
          shape="card"
          selectionMode="multiple"
          disabledKeys={['d5']}
          isRowSelectable={(row) => row.status !== 'failed'}
          selectionTooltip={(row) =>
            `A ${row.status} deployment cannot be moved`
          }
          getRowProps={({ row }) =>
            row.status === 'stopped' ? { isDimmed: true } : undefined
          }
        />
      </Flow>
    );
  },
};

/**
 * `bulkActions` implies `selectionMode="multiple"` — a bulk action with no way
 * to select rows is a contradiction, not a configuration.
 *
 * The default `floating` bar centres itself over the body without changing the
 * table's height, so the rows never shift under the cursor. `toolbar` placement
 * takes over the actions group instead, for a page that already has a crowded
 * toolbar and nowhere to float.
 *
 * Each action drives its own spinner through `setLoading`, so one slow request
 * does not freeze the others, and the selection clears when it resolves unless
 * the action opts out with `deselectAfter: false`.
 *
 * Press Escape to clear the selection.
 */
export const BulkActions: Story = {
  render: (args) => {
    const bulkActions: CubeTableBulkAction<Deployment>[] = [
      {
        key: 'restart',
        label: 'Restart',
        onAction: async (rows, { setLoading }) => {
          setLoading(true);
          await new Promise((resolve) => setTimeout(resolve, 900));
          // eslint-disable-next-line no-console
          console.log(
            'restarted',
            rows.map((row) => row.name),
          );
        },
      },
      {
        key: 'export',
        label: 'Export',
        type: 'clear',
        // Reading rows does not consume the selection.
        deselectAfter: false,
        onAction: () => {},
      },
      {
        key: 'delete',
        label: 'Delete',
        theme: 'danger',
        isDisabled: (rows) => rows.some((row) => row.status === 'running'),
        disabledTooltip: 'A running deployment cannot be deleted',
        onAction: () => {},
      },
    ];

    return (
      <Flow gap="4x">
        <ItemTable {...args} shape="card" bulkActions={bulkActions} />
        <ItemTable
          {...args}
          shape="card"
          bulkActions={bulkActions}
          bulkBarPlacement="toolbar"
          isSearchable
          actions={
            <Button type="primary" size="small" icon={<PlusIcon />}>
              Create
            </Button>
          }
        />
      </Flow>
    );
  },
};

/**
 * `selectAllMode` decides what the header checkbox reaches. `page` (the default)
 * takes the current page, `filtered` takes every row passing the search across
 * pages, and `all` emits the `'all'` sentinel for the consumer's query to
 * interpret — the only one that can mean rows the client has never loaded.
 */
export const SelectAllScope: Story = {
  render: (args) => {
    const [keys, setKeys] = useState<Key[] | 'all'>([]);

    const label = keys === 'all' ? "'all' sentinel" : `${keys.length} keys`;

    return (
      <Flow gap="4x">
        {(['page', 'filtered', 'all'] as const).map((mode) => (
          <ItemTable
            key={mode}
            {...args}
            shape="card"
            data={MANY}
            defaultPageSize={5}
            selectionMode="multiple"
            selectAllMode={mode}
            selectedKeys={keys}
            onSelectionChange={(next) => setKeys(next)}
            footerStart={
              <Text color="#dark-03">{`selectAllMode="${mode}" — ${label}`}</Text>
            }
          />
        ))}
      </Flow>
    );
  },
};

/**
 * `rowLink` turns the row-header cell into a stretched anchor covering the whole
 * row. Because it is a real `<a href>`, ⌘-click, middle-click and "Open in new
 * tab" all work natively — which an `onClick` handler can never give you. The
 * link sits below the cells' own content in the stacking order, so the `⋮`
 * trigger still takes its own clicks.
 *
 * `onRowAction` is the non-navigational alternative: Enter, or a click that did
 * not land on a control inside a cell.
 *
 * `rowContextMenu` decides where the menu is exposed — `true` gives a `⋮`
 * column **and** right-click, `'context-only'` gives right-click and Shift+F10
 * only, keeping the rows visually clean.
 */
export const RowInteraction: Story = {
  render: (args) => {
    const [lastAction, setLastAction] = useState<string>('nothing yet');

    const menu = (row: Deployment) => (
      <>
        <Menu.Item key="open">Open {row.name}</Menu.Item>
        <Menu.Item key="restart">Restart</Menu.Item>
        <Menu.Item key="delete">Delete</Menu.Item>
      </>
    );

    return (
      <Flow gap="4x">
        <ItemTable
          {...args}
          shape="card"
          rowLink={(row) => `!https://example.com/deployments/${row.id}`}
          rowMenu={menu}
          rowContextMenu
          onRowMenuAction={(action, row) =>
            setLastAction(`${action} on ${row.name}`)
          }
        />

        <Flow gap="1x">
          <ItemTable
            {...args}
            shape="card"
            rowMenu={menu}
            rowContextMenu="context-only"
            onRowAction={(row) => setLastAction(`activated ${row.name}`)}
            onRowMenuAction={(action, row) =>
              setLastAction(`${action} on ${row.name}`)
            }
          />
          <Text color="#dark-03">
            Right-click a row (no `⋮` column here) — last action: {lastAction}
          </Text>
        </Flow>
      </Flow>
    );
  },
};

/**
 * A bounded height turns the body into a scroller and pins the header. Pinned
 * columns are sticky `<th>`/`<td>` — one scroller, no lanes, no scroll sync —
 * and are moved to the edges in DOM order so `aria-colindex` stays truthful.
 */
export const ScrollingAndPinnedColumns: Story = {
  args: {
    shape: 'card',
    height: '360px',
    paginationMode: 'off',
    data: MANY,
    columns: [
      { ...COLUMNS[0], pin: 'start', width: 220 },
      { key: 'region', title: 'Region', width: 200 },
      { key: 'owner.name', title: 'Owner', width: 220 },
      { key: 'owner.email', title: 'Email', width: 260 },
      { key: 'queries', title: 'Queries', width: 200, align: 'end' },
      { key: 'id', title: 'ID', width: 200 },
      { ...COLUMNS[1], pin: 'end', width: 140 },
    ] as CubeItemTableColumn<Deployment>[],
  },
};

/**
 * `isReorderable` lets rows be dragged into a new order, built on React Aria's
 * collection drag-and-drop through the same `DraggableCollection` wrapper that
 * `Tabs` and `ListBox` use — so `RowCollection` and the table's own
 * `SelectionManager` plug straight in.
 *
 * That buys keyboard reordering as well as pointer: focus a row and press
 * Enter to pick it up, arrow to a new position, Enter to drop, Escape to
 * cancel. A drop line is drawn on the row itself, because a native table has
 * nowhere to put an element between two `<tr>`s.
 *
 * `onReorder` reports the **whole** key order, not just the moved row, so the
 * new order can be persisted directly.
 */
export const Reorderable: Story = {
  render: (args) => {
    const [rows, setRows] = useState(DEPLOYMENTS);

    return (
      <Flow gap="1x">
        <ItemTable
          {...args}
          isReorderable
          shape="card"
          data={rows}
          onReorder={(_keys, nextRows) => setRows(nextRows as Deployment[])}
        />
        <Text color="#dark-03">
          {rows.map((row) => row.name.replace('analytics-', '')).join(' · ')}
        </Text>
      </Flow>
    );
  },
};

/**
 * `dropOnRow` moves rows *into* a row — a deployment into a folder — which is a
 * different case from reordering, and the far more common one. Cloud's
 * Workbooks page works exactly this way: drag into folders, never reorder.
 *
 * `isTarget` decides per row which rows can receive a drop, and `isAllowed`
 * adds the pair-specific guard (here: a folder cannot go into a folder).
 *
 * The two features do compose — set `isReorderable` as well and rows that
 * refuse a drop fall back to reordering — but that combination is rare, so it
 * is not what this story shows.
 */
export const DropOntoRow: Story = {
  render: (args) => {
    type Item = Deployment & { isFolder?: boolean };

    const [rows, setRows] = useState<Item[]>(() => [
      {
        ...DEPLOYMENTS[0],
        id: 'folder-eu',
        name: 'EU deployments',
        isFolder: true,
      },
      {
        ...DEPLOYMENTS[1],
        id: 'folder-us',
        name: 'US deployments',
        isFolder: true,
      },
      ...DEPLOYMENTS.slice(2),
    ]);
    const [log, setLog] = useState('drag a deployment onto a folder');

    return (
      <Flow gap="1x">
        <ItemTable<Item>
          {...args}
          shape="card"
          data={rows}
          columns={[
            {
              key: 'name',
              title: 'Name',
              isRowHeader: true,
              flex: 2,
              // A folder reads as a folder, so it is obvious which rows accept
              // a drop rather than something to be discovered by trying.
              render: (value, row) => (
                <Space placeItems="center">
                  {row.isFolder ? <FolderIcon /> : <DatabaseIcon />}
                  <Text>{String(value)}</Text>
                </Space>
              ),
            },
            ...COLUMNS.slice(1).map((column) => ({
              ...column,
              // A folder has no status or query count of its own; everything
              // else keeps the column's own `render`, or its `format` when it
              // has none, so the value pipeline is not bypassed.
              render: (value: any, row: Item, index: number, ctx: any) => {
                if (row.isFolder) return null;

                const render = (column as any).render;

                if (render) return render(value, row, index, ctx);

                const format = (column as any).format;

                return format
                  ? format(value, row, index)
                  : value == null
                    ? null
                    : String(value);
              },
            })),
          ]}
          // What the cursor drags: the row's own icon and name for one row, a
          // count for several.
          getItemDragInfo={(row) => ({
            label: row.name,
            icon: row.isFolder ? <FolderIcon /> : <DatabaseIcon />,
          })}
          dropOnRow={{
            isTarget: (row) => row.isFolder === true,
            isAllowed: (dragged) => dragged.every((row) => !row.isFolder),
            onDrop: (dragged, target) => {
              setRows((current) =>
                current.filter((row) => !dragged.includes(row)),
              );
              setLog(
                `moved ${dragged.map((row) => row.name).join(', ')} into ${target.name}`,
              );
            },
          }}
        />
        <Text color="#dark-03">{log}</Text>
      </Flow>
    );
  },
};

/**
 * `paginationMode="infinite"` replaces the page control with load-on-scroll.
 * The table never slices in this mode — `data` is the list accumulated so far,
 * and `onLoadMore` fires once the end of it comes into view.
 *
 * It is driven by an `IntersectionObserver` on a sentinel row rather than a
 * scroll handler, so `loadMoreMargin` expresses "prefetch this far before the
 * end" directly and costs nothing per scroll tick. The observer re-arms only
 * once `isLoadingMore` clears, so a request in flight is never fired twice by
 * the sentinel still sitting in view.
 *
 * Scroll to the bottom to pull the next batch.
 */
export const InfiniteScroll: Story = {
  render: (args) => {
    const [rows, setRows] = useState(() => MANY.slice(0, 20));
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const hasMore = rows.length < MANY.length;

    return (
      <Flow gap="1x">
        <ItemTable
          {...args}
          shape="card"
          height="360px"
          data={rows}
          paginationMode="infinite"
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={() => {
            setIsLoadingMore(true);
            setTimeout(() => {
              setRows((current) =>
                MANY.slice(0, Math.min(current.length + 20, MANY.length)),
              );
              setIsLoadingMore(false);
            }, LATENCY);
          }}
        />
        <Text color="#dark-03">
          {`${rows.length} of ${MANY.length} loaded${hasMore ? '' : ' — that is everything'}`}
        </Text>
      </Flow>
    );
  },
};

/**
 * `isResizable` puts a grab handle on every column's trailing edge. It is built
 * on React Aria's `useMove`, the same hook that drives `Board`'s widgets, so the
 * handle takes **keyboard** input for free: focus it and use the arrow keys,
 * or Home/End to jump to the column's minimum and maximum. ag-grid never gave
 * Cloud that.
 *
 * Widths are clamped to each column's `minWidth` / `maxWidth`, and
 * `onColumnResize` fires once the gesture ends rather than on every pixel.
 * Pair it with `storageKey` and the widths survive a reload.
 */
export const ColumnResize: Story = {
  render: (args) => {
    const [widths, setWidths] = useState<Record<string, number>>({});

    return (
      <Flow gap="1x">
        <ItemTable
          {...args}
          isResizable
          shape="card"
          columnWidths={widths}
          columns={[
            { ...COLUMNS[0], minWidth: 120 },
            { ...COLUMNS[1], minWidth: 100, maxWidth: 240 },
            { ...COLUMNS[2], minWidth: 120 },
            { ...COLUMNS[3], minWidth: 100, isResizable: false },
            { ...COLUMNS[4], minWidth: 100 },
          ]}
          onColumnResize={(key, width, all) => setWidths(all)}
        />
        <Text color="#dark-03">
          {Object.keys(widths).length
            ? Object.entries(widths)
                .map(([key, width]) => `${key}: ${Math.round(width)}px`)
                .join(' · ')
            : 'Drag a column edge — "Region" opts out with isResizable: false'}
        </Text>
      </Flow>
    );
  },
};

/**
 * Above `virtualizeThreshold` rows a bounded table virtualizes automatically.
 * The DOM and styles are identical either way — only the number of mounted rows
 * changes.
 */
export const Virtualized: Story = {
  args: {
    shape: 'card',
    height: '420px',
    paginationMode: 'off',
    data: Array.from({ length: 10_000 }, (_, i) => ({
      ...DEPLOYMENTS[i % DEPLOYMENTS.length],
      id: `row-${i}`,
      name: `deployment-${String(i + 1).padStart(5, '0')}`,
      queries: (i * 7919) % 200_000,
    })),
  },
};

const LOREM =
  'Cube Cloud runs the semantic layer, the API and the caching tier as one managed service so teams can ship metrics without operating infrastructure themselves.';

const WRAPPED_COLUMNS = [
  { key: 'name', title: 'Name', isRowHeader: true, width: 200 },
  { key: 'notes', title: 'Notes', autoHeight: true, flex: 3 },
  { key: 'region', title: 'Region', width: 160 },
] as CubeItemTableColumn<Deployment>[];

const wrappedRows = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    ...DEPLOYMENTS[i % DEPLOYMENTS.length],
    id: `row-${i}`,
    name: `deployment-${String(i + 1).padStart(4, '0')}`,
    notes: Array.from({ length: (i % 5) + 1 }, () => LOREM).join(' '),
  }));

/**
 * `autoHeight` lets a column wrap and grow its row. The second table is the case
 * virtualization usually gets wrong: 2,000 rows of differing heights, each
 * measured rather than assumed.
 */
export const WrappingCells: Story = {
  render: (args) => (
    <Flow gap="4x">
      <ItemTable
        {...args}
        shape="card"
        data={wrappedRows(6)}
        columns={WRAPPED_COLUMNS}
        paginationMode="off"
      />
      <ItemTable
        {...args}
        shape="card"
        height="420px"
        paginationMode="off"
        data={wrappedRows(2_000)}
        columns={WRAPPED_COLUMNS}
      />
    </Flow>
  ),
};

/** Per-row visuals go through `getRowProps` — dimming is purely presentational. */
export const PerRowVisuals: Story = {
  args: {
    shape: 'card',
    getRowProps: ({ row }) => ({ isDimmed: row.status === 'stopped' }),
  },
};
