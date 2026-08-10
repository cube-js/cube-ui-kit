import { createRef } from 'react';

import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';

import { Pagination } from './Pagination';
import { getPageInfo, getPaginationRange } from './use-pagination';

describe('getPaginationRange', () => {
  it('lists every page when they all fit', () => {
    expect(getPaginationRange({ page: 1, totalPages: 5 })).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });

  it('elides the tail near the start', () => {
    expect(getPaginationRange({ page: 1, totalPages: 42 })).toEqual([
      1,
      2,
      3,
      4,
      5,
      'gap',
      42,
    ]);
  });

  it('elides both sides in the middle', () => {
    expect(getPaginationRange({ page: 20, totalPages: 42 })).toEqual([
      1,
      'gap',
      19,
      20,
      21,
      'gap',
      42,
    ]);
  });

  it('elides the head near the end', () => {
    expect(getPaginationRange({ page: 42, totalPages: 42 })).toEqual([
      1,
      'gap',
      38,
      39,
      40,
      41,
      42,
    ]);
  });

  it('keeps the rendered count bounded no matter how many pages there are', () => {
    // The whole reason `type="numbers"` is the default: 1000 pages must not
    // become 1000 elements.
    const big = getPaginationRange({ page: 500, totalPages: 1000 });

    expect(big.length).toBeLessThanOrEqual(9);
    expect(big).toContain(500);
    expect(big[0]).toBe(1);
    expect(big[big.length - 1]).toBe(1000);
  });

  it('renders the elided page instead of a gap that would hide exactly one', () => {
    expect(getPaginationRange({ page: 4, totalPages: 7 })).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
  });

  it('honours siblingCount and boundaryCount', () => {
    expect(
      getPaginationRange({
        page: 20,
        totalPages: 42,
        siblingCount: 2,
        boundaryCount: 2,
      }),
    ).toEqual([1, 2, 'gap', 18, 19, 20, 21, 22, 'gap', 41, 42]);
  });

  it('returns nothing when there are no pages', () => {
    expect(getPaginationRange({ page: 1, totalPages: 0 })).toEqual([]);
  });

  it('clamps an out-of-range page', () => {
    expect(getPaginationRange({ page: 99, totalPages: 3 })).toEqual([1, 2, 3]);
  });
});

describe('getPageInfo', () => {
  it('derives totalPages and the item range', () => {
    expect(getPageInfo({ page: 3, pageSize: 50, total: 1204 })).toEqual({
      page: 3,
      pageSize: 50,
      totalPages: 25,
      total: 1204,
      from: 101,
      to: 150,
    });
  });

  it('clips the last page to the total', () => {
    const info = getPageInfo({ page: 25, pageSize: 50, total: 1204 });

    expect(info.from).toBe(1201);
    expect(info.to).toBe(1204);
  });

  it('reports an empty range when there is nothing', () => {
    const info = getPageInfo({ page: 1, pageSize: 50, total: 0 });

    expect(info).toMatchObject({ totalPages: 1, from: 0, to: 0 });
  });

  it('prefers an explicit totalPages over the derived one', () => {
    expect(
      getPageInfo({ page: 1, pageSize: 50, total: 0, totalPages: 7 })
        .totalPages,
    ).toBe(7);
  });
});

describe('<Pagination />', () => {
  it('renders page buttons and marks the current one', () => {
    renderWithRoot(<Pagination page={3} pageSize={10} total={100} />);

    const current = screen.getByRole('button', { name: 'Page 3' });

    expect(current).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Page 1' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('calls onPageChange when a page is pressed', async () => {
    const onPageChange = vi.fn();

    renderWithRoot(
      <Pagination
        page={1}
        pageSize={10}
        total={100}
        onPageChange={onPageChange}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Page 3' }));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('works uncontrolled', async () => {
    renderWithRoot(<Pagination defaultPage={1} pageSize={10} total={100} />);

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });
  });

  it('disables the edge buttons at the boundaries', () => {
    const { rerender } = renderWithRoot(
      <Pagination page={1} pageSize={10} total={100} />,
    );

    expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();

    rerender(<Pagination page={10} pageSize={10} total={100} />);

    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Last page' })).toBeDisabled();
  });

  it('never emits a page outside the range', async () => {
    const onPageChange = vi.fn();

    renderWithRoot(
      <Pagination
        page={10}
        pageSize={10}
        total={100}
        hasNextPage
        onPageChange={onPageChange}
      />,
    );

    // Next is disabled at the last page even with `hasNextPage` set, because
    // the total is known.
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('drives next from hasNextPage when the total is unknown', async () => {
    const onPageChange = vi.fn();

    renderWithRoot(
      <Pagination page={3} hasNextPage onPageChange={onPageChange} />,
    );

    // No total => no page buttons, no first/last, just prev/next.
    expect(screen.queryByRole('button', { name: 'First page' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Page 3' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('stops at the last page when hasNextPage is false', () => {
    renderWithRoot(<Pagination page={3} hasNextPage={false} />);

    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('renders a summary when asked', () => {
    renderWithRoot(<Pagination page={3} pageSize={50} total={1204} summary />);

    expect(screen.getByText('101–150 of 1,204')).toBeInTheDocument();
  });

  it('accepts a custom summary renderer', () => {
    renderWithRoot(
      <Pagination
        page={2}
        pageSize={10}
        total={95}
        summary={(info) => `${info.page}/${info.totalPages}`}
      />,
    );

    expect(screen.getByText('2/10')).toBeInTheDocument();
  });

  it('renders a compact label instead of page buttons', () => {
    renderWithRoot(
      <Pagination type="compact" page={3} pageSize={10} total={100} />,
    );

    expect(screen.getByText('3 of 10')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Page 1' })).toBeNull();
  });

  it('falls back to compact when type="select" would build too many entries', () => {
    renderWithRoot(
      <Pagination type="select" page={1} pageSize={1} total={5000} />,
    );

    // 5000 Select.Items is exactly the bug this guard exists to prevent.
    expect(screen.queryByTestId('PaginationPageSelect')).toBeNull();
    expect(screen.getByText('1 of 5000')).toBeInTheDocument();
  });

  it('disables everything when isDisabled', () => {
    renderWithRoot(
      <Pagination page={3} pageSize={10} total={100} isDisabled />,
    );

    expect(screen.getByRole('button', { name: 'Page 4' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('hides the edge buttons in compact layout', () => {
    renderWithRoot(<Pagination page={3} pageSize={10} total={100} isCompact />);

    expect(screen.queryByRole('button', { name: 'First page' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Last page' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
  });

  it('forwards a ref and exposes a navigation landmark', () => {
    const ref = createRef<HTMLElement>();

    renderWithRoot(<Pagination ref={ref} page={1} pageSize={10} total={20} />);

    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeTruthy();
  });
});
