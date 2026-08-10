import { tasty } from '@tenphi/tasty';

import { Pagination } from '../../navigation/Pagination';

import type { Styles } from '@tenphi/tasty';
import type { ReactNode } from 'react';
import type { CubeTablePageInfo } from '../../navigation/Pagination';

const FooterElement = tasty({
  qa: 'ItemTableFooter',
  as: 'div',
  styles: {
    gridRow: 3,
    // The footer is chrome around the data, so its text sits a step below the
    // body's. Slot content inherits this, which is what keeps a consumer's own
    // label matched to the pagination summary beside it.
    preset: 't4',
    display: 'flex',
    flow: 'row',
    gap: '1x',
    placeItems: 'center',
    padding: '1x',
    border: '1bw #border top',

    /**
     * Three named slots. This is what replaces the `MutationObserver` that Cloud
     * uses to inject a "Load all results" button into ag-grid's paging panel —
     * ag-grid Community has no status bar, so there was nowhere to put it.
     */
    Start: {
      $: '>',
      display: 'flex',
      flow: 'row',
      gap: '1x',
      placeItems: 'center',
      width: 'min 0',
    },
    Center: {
      $: '>',
      display: 'flex',
      flow: 'row',
      gap: '1x',
      placeItems: 'center',
      placeContent: 'center',
      // `flexGrow`, not a width: this is a flex item, and only grow makes it
      // take the leftover space so its content actually lands in the middle.
      flexGrow: 1,
    },
    End: {
      $: '>',
      display: 'flex',
      flow: 'row',
      gap: '1x',
      placeItems: 'center',
      placeContent: 'end',
    },
  },
});

export interface ItemTableFooterProps {
  start?: ReactNode;
  center?: ReactNode;
  end?: ReactNode;
  /** Rendered in the end slot unless `end` overrides it. */
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages?: number;
    pageSizeOptions?: number[];
    summary?: boolean | ((info: CubeTablePageInfo) => ReactNode);
    hasNextPage?: boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
  };
  styles?: Styles;
}

export function ItemTableFooter({
  start,
  center,
  end,
  pagination,
  styles,
}: ItemTableFooterProps) {
  return (
    <FooterElement styles={styles}>
      <div data-element="Start">{start}</div>
      <div data-element="Center">{center}</div>
      <div data-element="End">
        {end}
        {pagination ? (
          <Pagination
            // The footer is chrome around the data, not part of it — its
            // controls sit a step below the toolbar's.
            size="xsmall"
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            pageSizeOptions={pagination.pageSizeOptions}
            summary={pagination.summary}
            hasNextPage={pagination.hasNextPage}
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPageSizeChange}
          />
        ) : null}
      </div>
    </FooterElement>
  );
}
