import { useMemo, useState } from 'react';

import { Text } from '../../content/Text';
import { Flow } from '../../layout/Flow';
import { Space } from '../../layout/Space';

import { Pagination } from './Pagination';
import { usePagination } from './use-pagination';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Navigation/Pagination',
  component: Pagination,
  parameters: {
    layout: 'padded',
  },
  args: {
    total: 1204,
    pageSize: 50,
    defaultPage: 1,
  },
  argTypes: {
    /* Page */
    page: {
      control: { type: null },
      description: 'Controlled current page (1-based)',
      table: { type: { summary: 'number' } },
    },
    defaultPage: {
      control: 'number',
      description: 'Initial page for uncontrolled usage',
      table: {
        defaultValue: { summary: '1' },
        type: { summary: 'number' },
      },
    },
    totalPages: {
      control: 'number',
      description:
        'Total pages. Derived from `total` + `pageSize` when omitted',
      table: { type: { summary: 'number' } },
    },
    total: {
      control: 'number',
      description: 'Total items across all pages. Preferred over `totalPages`',
      table: { type: { summary: 'number' } },
    },

    /* Page size */
    pageSize: {
      control: 'number',
      description: 'Controlled page size',
      table: { type: { summary: 'number' } },
    },
    defaultPageSize: {
      control: 'number',
      description: 'Initial page size for uncontrolled usage',
      table: {
        defaultValue: { summary: '50' },
        type: { summary: 'number' },
      },
    },
    pageSizeOptions: {
      control: { type: null },
      description:
        'Renders the page-size selector when supplied together with `onPageSizeChange`',
      table: { type: { summary: 'number[]' } },
    },

    /* Presentation */
    type: {
      control: 'radio',
      options: ['numbers', 'select', 'compact'],
      description: 'How the page control is rendered',
      table: {
        defaultValue: { summary: 'numbers' },
        type: { summary: "'numbers' | 'select' | 'compact'" },
      },
    },
    siblingCount: {
      control: 'number',
      description: 'Page buttons either side of the current page',
      table: {
        defaultValue: { summary: '1' },
        type: { summary: 'number' },
      },
    },
    boundaryCount: {
      control: 'number',
      description: 'Page buttons pinned at each end',
      table: {
        defaultValue: { summary: '1' },
        type: { summary: 'number' },
      },
    },
    size: {
      control: 'radio',
      options: ['small', 'medium'],
      table: {
        defaultValue: { summary: 'small' },
        type: { summary: "'small' | 'medium'" },
      },
    },
    isCompact: {
      control: 'boolean',
      description: 'Hide the first/last jump buttons',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    summary: {
      control: 'boolean',
      description: 'Show the localized "1–50 of 1,204" summary',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean | ((info) => ReactNode)' },
      },
    },

    /* State */
    isDisabled: {
      control: 'boolean',
      table: { type: { summary: 'boolean' } },
    },
    hasNextPage: {
      control: 'boolean',
      description:
        'Cursor pagination with an unknown total. Ignored when the total is known',
      table: { type: { summary: 'boolean' } },
    },

    /* Events */
    onPageChange: { action: 'pageChange', table: { category: 'Events' } },
    onPageSizeChange: {
      action: 'pageSizeChange',
      table: { category: 'Events' },
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSummary: Story = {
  args: { summary: true },
};

/**
 * `type="numbers"` keeps the rendered element count bounded no matter how many
 * pages exist — 20 000 pages still renders ~7 buttons.
 */
export const ManyPages: Story = {
  args: { total: 1_000_000, pageSize: 50, defaultPage: 9421, summary: true },
};

export const Compact: Story = {
  args: { type: 'compact', summary: true },
};

/**
 * `type="select"` materializes one entry per page, so it is only used below a
 * safety cap. Above it the component falls back to `compact` automatically.
 */
export const SelectType: Story = {
  args: { type: 'select', total: 240, pageSize: 20 },
};

export const WithPageSizeSelector: Story = {
  render: (args) => {
    const [pageSize, setPageSize] = useState(50);
    const [page, setPage] = useState(1);

    return (
      <Pagination
        {...args}
        page={page}
        pageSize={pageSize}
        pageSizeOptions={[10, 20, 50, 100, 500]}
        summary
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    );
  },
};

/** Cursor pagination: no total, so "next" is driven by `hasNextPage`. */
export const UnknownTotal: Story = {
  args: { total: undefined, totalPages: undefined, hasNextPage: true },
};

export const Disabled: Story = {
  args: { isDisabled: true, summary: true },
};

export const Sizes: Story = {
  render: (args) => (
    <Flow gap="2x">
      <Pagination {...args} size="small" />
      <Pagination {...args} size="medium" />
    </Flow>
  ),
};

const ITEMS = Array.from({ length: 137 }, (_, i) => `Item ${i + 1}`);

/**
 * `usePagination` does the client-side slicing on its own — `Pagination` is
 * only the control. `ItemTable` composes exactly these two pieces.
 */
export const WithUsePagination: Story = {
  render: () => {
    const items = useMemo(() => ITEMS, []);
    const { pageItems, page, pageSize, total, setPage, setPageSize } =
      usePagination(items, { defaultPageSize: 10 });

    return (
      <Flow gap="2x">
        <Flow gap=".5x">
          {pageItems.map((item) => (
            <Text key={item}>{item}</Text>
          ))}
        </Flow>
        <Space placeContent="space-between">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            pageSizeOptions={[5, 10, 25]}
            summary
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </Space>
      </Flow>
    );
  },
};
