import { useControlledState } from '@react-stately/utils';
import { filterBaseProps, OUTER_STYLES, tasty } from '@tenphi/tasty';
import { forwardRef, useMemo } from 'react';

import { useEvent } from '../../../_internal/hooks';
import { useFormatter, useI18n } from '../../../i18n';
import { BackwardIcon, ForwardIcon, LeftIcon, RightIcon } from '../../../icons';
import { extractStyles } from '../../../utils/styles';
import { Button } from '../../actions';
import { Select } from '../../fields/Select';

import { clampPage, getPageInfo, getPaginationRange } from './use-pagination';

import type { ForwardedRef, ReactElement } from 'react';
import type { CubePaginationProps, CubeTablePageInfo } from './types';

const PaginationElement = tasty({
  qa: 'Pagination',
  as: 'nav',
  styles: {
    display: 'flex',
    flow: 'row',
    gap: '1x',
    placeItems: 'center',
    placeContent: 'start',

    Summary: {
      // Follows the control's size rather than being fixed, so the summary
      // matches whatever the buttons beside it are.
      preset: { '': 't3', 'size=xsmall': 't4' },
      color: '#dark-03',
      whiteSpace: 'nowrap',
    },

    Controls: {
      display: 'flex',
      flow: 'row',
      gap: '.5x',
      placeItems: 'center',
    },

    Gap: {
      display: 'grid',
      placeItems: 'center',
      width: 'min $gap-size',
      height: '$gap-size',
      preset: 't3',
      color: '#dark-04',
      userSelect: 'none',
    },

    /**
     * The page numbers sit tighter than the nav buttons around them: they read
     * as one run of pages, not as separate controls, and a hairline is enough
     * to keep the current page's outline off its neighbours.
     */
    Pages: {
      display: 'flex',
      flow: 'row',
      gap: '1bw',
      placeItems: 'center',
    },

    '$gap-size': {
      '': '$size-sm',
      'size=xsmall': '$size-xs',
      'size=medium': '$size-md',
    },
  },
  styleProps: OUTER_STYLES,
});

const NavButton = tasty(Button, {
  type: 'clear',
  styles: { border: true },
});

// Page buttons are borderless so the current page — which renders as `outline`
// and therefore draws its own border — is the only bordered one in the run.
const PageButton = tasty(Button, {
  type: 'clear',
});

function formatRange(info: CubeTablePageInfo): string {
  const start = (info.page - 1) * info.pageSize + 1;
  const end =
    info.total > 0
      ? Math.min(info.page * info.pageSize, info.total)
      : info.page * info.pageSize;

  return `${start}–${end}`;
}

function Pagination(
  props: CubePaginationProps,
  ref: ForwardedRef<HTMLElement>,
): ReactElement {
  const {
    page: pageProp,
    defaultPage,
    onPageChange,
    totalPages: totalPagesProp,
    total,
    pageSize: pageSizeProp,
    defaultPageSize,
    pageSizeOptions,
    onPageSizeChange,
    type = 'numbers',
    siblingCount = 1,
    boundaryCount = 1,
    size = 'small',
    isDisabled,
    hasNextPage,
    isCompact = false,
    summary = false,
    labelFormatter,
    ariaLabel,
    pageSizeSelectStyles,
    qa,
    mods,
    ...rest
  } = props;

  const { t } = useI18n();
  const { formatNumber } = useFormatter();

  const [pageSize, setPageSize] = useControlledState<number>(
    pageSizeProp as number,
    defaultPageSize ?? 50,
    onPageSizeChange as (v: number) => void,
  );
  const [page, setPage] = useControlledState<number>(
    pageProp as number,
    defaultPage ?? 1,
    onPageChange as (v: number) => void,
  );

  // Unknown total: prev/next only, with `hasNextPage` driving the next button.
  // The page must NOT be clamped in that mode — there is nothing to clamp to.
  const isCountable = totalPagesProp != null || total != null;

  const info: CubeTablePageInfo = isCountable
    ? getPageInfo({
        page,
        pageSize,
        total: total ?? 0,
        totalPages: totalPagesProp,
      })
    : {
        page: clampPage(page, Number.MAX_SAFE_INTEGER),
        pageSize,
        totalPages: 0,
        total: 0,
        from: 0,
        to: 0,
      };

  const { totalPages } = info;

  const goTo = useEvent((next: number) => {
    const clamped = isCountable
      ? clampPage(next, totalPages)
      : Math.max(next, 1);

    if (clamped !== info.page) setPage(clamped);
  });

  const onPageSizeSelectionChange = useEvent((value: any) => {
    setPageSize(Number(value));
    setPage(1);
  });

  const onPageSelectionChange = useEvent((value: any) => {
    goTo(Number(value));
  });

  const pageItems = useMemo(
    () =>
      type === 'numbers' && isCountable
        ? getPaginationRange({
            page: info.page,
            totalPages,
            siblingCount,
            boundaryCount,
          })
        : [],
    [type, isCountable, info.page, totalPages, siblingCount, boundaryCount],
  );

  // `type="select"` materializes one entry per page, so it is only safe for
  // small page counts. Above the cap we fall back to `compact`, which reads the
  // same but renders a single label.
  const selectEntries = useMemo(
    () =>
      type === 'select' && isCountable && totalPages <= 200
        ? Array.from({ length: totalPages }, (_, i) => i + 1)
        : null,
    [type, isCountable, totalPages],
  );

  const isFirst = info.page <= 1;
  const isLast = isCountable ? info.page >= totalPages : !hasNextPage;

  const styles = extractStyles(props, OUTER_STYLES);

  const summaryNode =
    summary === false
      ? null
      : typeof summary === 'function'
        ? summary(info)
        : info.total > 0
          ? // Numbers are formatted here rather than left to i18next, which
            // interpolates them raw ("1204", not "1,204").
            t('pagination.summary', '{{from}}–{{to}} of {{total}}', {
              from: formatNumber(info.from),
              to: formatNumber(info.to),
              total: formatNumber(info.total),
            })
          : null;

  function renderPageControl() {
    if (selectEntries) {
      return (
        <Select
          qa="PaginationPageSelect"
          size={size}
          isDisabled={isDisabled}
          aria-label={t('pagination.selectPage', 'Select page')}
          selectedKey={String(info.page)}
          width="min 15x"
          styles={pageSizeSelectStyles}
          onSelectionChange={onPageSelectionChange}
        >
          {selectEntries.map((entry) => {
            const entryInfo = { ...info, page: entry };
            const label =
              labelFormatter?.(entryInfo) ??
              (info.total > 0
                ? formatRange(entryInfo)
                : t('pagination.page', 'Page {{page}}', { page: entry }));

            return (
              <Select.Item key={entry} textValue={String(label)}>
                {label}
              </Select.Item>
            );
          })}
        </Select>
      );
    }

    if (type === 'numbers' && pageItems.length > 0) {
      return (
        <div data-element="Pages">
          {pageItems.map((entry, index) =>
            entry === 'gap' ? (
              <div key={`gap-${index}`} data-element="Gap" aria-hidden="true">
                {'…'}
              </div>
            ) : (
              <PageButton
                key={entry}
                qa={`PaginationPage_${entry}`}
                size={size}
                type={entry === info.page ? 'outline' : 'clear'}
                isDisabled={isDisabled}
                aria-label={t('pagination.page', 'Page {{page}}', {
                  page: entry,
                })}
                aria-current={entry === info.page ? 'page' : undefined}
                onPress={() => goTo(entry)}
              >
                {entry}
              </PageButton>
            ),
          )}
        </div>
      );
    }

    if (!isCountable) return null;

    return (
      <div data-element="Summary" data-qa="PaginationPageLabel">
        {t('pagination.pageOf', '{{page}} of {{totalPages}}', {
          page: info.page,
          totalPages,
        })}
      </div>
    );
  }

  const showEdgeButtons = !isCompact && isCountable;

  return (
    <PaginationElement
      {...filterBaseProps(rest, { eventProps: true })}
      ref={ref}
      qa={qa || 'Pagination'}
      styles={styles}
      mods={{ size, ...mods }}
      aria-label={ariaLabel ?? t('pagination.ariaLabel', 'Pagination')}
    >
      {summaryNode ? <div data-element="Summary">{summaryNode}</div> : null}

      {pageSizeOptions && onPageSizeChange ? (
        <Select
          qa="PaginationPageSizeSelect"
          size={size}
          isDisabled={isDisabled}
          aria-label={t('pagination.itemsPerPage', 'Items per page')}
          selectedKey={String(pageSize)}
          styles={pageSizeSelectStyles}
          onSelectionChange={onPageSizeSelectionChange}
        >
          {pageSizeOptions.map((option) => {
            const label = t(
              'pagination.itemsPerPageOption',
              '{{size}} / page',
              {
                size: option,
              },
            );

            return (
              <Select.Item key={option} textValue={label}>
                {label}
              </Select.Item>
            );
          })}
        </Select>
      ) : null}

      <div data-element="Controls">
        {showEdgeButtons ? (
          <NavButton
            qa="PaginationFirstButton"
            size={size}
            icon={<BackwardIcon />}
            isDisabled={isFirst || isDisabled}
            aria-label={t('pagination.firstPage', 'First page')}
            onPress={() => goTo(1)}
          />
        ) : null}

        <NavButton
          qa="PaginationPrevButton"
          size={size}
          icon={<LeftIcon />}
          isDisabled={isFirst || isDisabled}
          aria-label={t('pagination.previousPage', 'Previous page')}
          onPress={() => goTo(info.page - 1)}
        />

        {renderPageControl()}

        <NavButton
          qa="PaginationNextButton"
          size={size}
          icon={<RightIcon />}
          isDisabled={isLast || isDisabled}
          aria-label={t('pagination.nextPage', 'Next page')}
          onPress={() => goTo(info.page + 1)}
        />

        {showEdgeButtons ? (
          <NavButton
            qa="PaginationLastButton"
            size={size}
            icon={<ForwardIcon />}
            isDisabled={isLast || isDisabled}
            aria-label={t('pagination.lastPage', 'Last page')}
            onPress={() => goTo(totalPages)}
          />
        ) : null}
      </div>
    </PaginationElement>
  );
}

const _Pagination = forwardRef(Pagination);

_Pagination.displayName = 'Pagination';

export { _Pagination as Pagination };
