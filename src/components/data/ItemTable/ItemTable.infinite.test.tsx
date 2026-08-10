import { renderWithRoot, screen, waitFor } from '../../../test';

import { ItemTable } from './ItemTable';

import type { CubeItemTableColumn } from './types';

interface Row {
  id: string;
  name: string;
}

const COLUMNS: CubeItemTableColumn<Row>[] = [
  { key: 'name', title: 'Name', isRowHeader: true },
];

const ROWS: Row[] = Array.from({ length: 10 }, (_, i) => ({
  id: `r${i}`,
  name: `row-${i}`,
}));

/**
 * jsdom has no `IntersectionObserver`. This stand-in records every observer so
 * a test can decide when the sentinel comes into view — which is the whole
 * behaviour under test, and not something layout could produce here anyway.
 */
type Trigger = (isIntersecting: boolean) => void;

let triggers: Trigger[] = [];
let observed: Element[] = [];

class MockIntersectionObserver {
  private callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    triggers.push((isIntersecting) =>
      this.callback(
        observed.map(
          (target) => ({ target, isIntersecting }) as IntersectionObserverEntry,
        ),
        this as unknown as IntersectionObserver,
      ),
    );
  }

  observe(element: Element) {
    observed.push(element);
  }

  disconnect() {
    observed = [];
  }

  unobserve() {}

  takeRecords() {
    return [];
  }
}

beforeEach(() => {
  triggers = [];
  observed = [];
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

afterEach(() => vi.unstubAllGlobals());

/** Brings the sentinel into view. */
function scrollToEnd() {
  triggers.forEach((trigger) => trigger(true));
}

const sentinel = () =>
  screen.getByRole('grid').querySelector('tr[data-sentinel]');

describe('ItemTable infinite scroll', () => {
  it('renders no sentinel in other modes', () => {
    renderWithRoot(
      <ItemTable data={ROWS} columns={COLUMNS} onLoadMore={() => {}} />,
    );

    // `onLoadMore` alone does nothing — the mode is what turns it on.
    expect(sentinel()).toBeNull();
  });

  it('replaces the page control', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        paginationMode="infinite"
        hasMore
        onLoadMore={() => {}}
      />,
    );

    expect(sentinel()).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Page 1' })).toBeNull();
  });

  it('loads more when the end comes into view', async () => {
    const onLoadMore = vi.fn();

    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        paginationMode="infinite"
        hasMore
        onLoadMore={onLoadMore}
      />,
    );

    expect(onLoadMore).not.toHaveBeenCalled();

    scrollToEnd();

    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1));
  });

  it('stays quiet once there is nothing more', () => {
    const onLoadMore = vi.fn();

    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        paginationMode="infinite"
        hasMore={false}
        onLoadMore={onLoadMore}
      />,
    );

    scrollToEnd();

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('does not fire again while a request is in flight', () => {
    const onLoadMore = vi.fn();

    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        paginationMode="infinite"
        hasMore
        isLoadingMore
        onLoadMore={onLoadMore}
      />,
    );

    scrollToEnd();

    // The sentinel is still in view while the batch loads; observing it again
    // would queue a second identical request.
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('shows skeleton rows while fetching', () => {
    const { rerender } = renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        paginationMode="infinite"
        hasMore
        onLoadMore={() => {}}
      />,
    );

    expect(
      screen.getByRole('grid').querySelectorAll('tr[data-placeholder]'),
    ).toHaveLength(0);

    rerender(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        paginationMode="infinite"
        hasMore
        isLoadingMore
        onLoadMore={() => {}}
      />,
    );

    // Skeletons rather than a spinner: they keep the row grid and read as
    // "more rows of this shape are coming".
    const placeholders = screen
      .getByRole('grid')
      .querySelectorAll('tr[data-placeholder]');

    // As many as the batch that is coming, measured from the one that arrived:
    // the list keeps its length through the load, so the user can carry on
    // scrolling into it and nothing lurches when the rows land. A fixed few
    // left them stopped at the bottom with nothing to scroll into.
    expect(placeholders).toHaveLength(ROWS.length);
    // Real cells, so the columns still line up with the rows above.
    expect(placeholders[0].querySelectorAll('td')).toHaveLength(1);
    expect(placeholders[0].querySelector('[data-state]')).toBeNull();
  });

  it('sizes the burst to the last batch, not the total', () => {
    const props = (data: typeof ROWS, isLoadingMore: boolean) => ({
      data,
      columns: COLUMNS,
      paginationMode: 'infinite' as const,
      hasMore: true,
      isLoadingMore,
      onLoadMore: () => {},
    });

    const { rerender } = renderWithRoot(
      <ItemTable {...props(ROWS.slice(0, 2), false)} />,
    );

    // A fetch: flag on, three rows arrive, flag off.
    rerender(<ItemTable {...props(ROWS.slice(0, 2), true)} />);
    rerender(<ItemTable {...props(ROWS.slice(0, 5), false)} />);

    // The next fetch starts.
    rerender(<ItemTable {...props(ROWS.slice(0, 5), true)} />);

    // 3, the size of the batch that actually arrived — not 5, the length of
    // the list.
    expect(
      screen.getByRole('grid').querySelectorAll('tr[data-placeholder]'),
    ).toHaveLength(3);
  });

  it('ignores growth that was not a fetch', () => {
    const many = Array.from({ length: 90 }, (_, i) => ({
      id: `m${i}`,
      name: `row-${i}`,
    }));
    const props = (data: typeof many, isLoadingMore: boolean) => ({
      data,
      columns: COLUMNS,
      paginationMode: 'infinite' as const,
      hasMore: true,
      isLoadingMore,
      onLoadMore: () => {},
    });

    const { rerender } = renderWithRoot(
      <ItemTable {...props(many.slice(0, 10), false)} />,
    );

    // A real fetch of 5.
    rerender(<ItemTable {...props(many.slice(0, 10), true)} />);
    rerender(<ItemTable {...props(many.slice(0, 15), false)} />);

    // Now a client filter cuts the list down and is then cleared — 90 rows
    // reappear at once. That is not a batch, and reading it as one sized the
    // next burst at the cap.
    rerender(<ItemTable {...props(many.slice(0, 3), false)} />);
    rerender(<ItemTable {...props(many, false)} />);

    rerender(<ItemTable {...props(many, true)} />);

    expect(
      screen.getByRole('grid').querySelectorAll('tr[data-placeholder]'),
    ).toHaveLength(5);
  });

  it('caps the burst so a huge batch cannot flood the DOM', () => {
    const many = Array.from({ length: 400 }, (_, i) => ({
      id: `x${i}`,
      name: `row-${i}`,
    }));

    const { rerender } = renderWithRoot(
      <ItemTable
        data={many}
        columns={COLUMNS}
        paginationMode="infinite"
        hasMore
        onLoadMore={() => {}}
      />,
    );

    // No fetch measured yet, so the burst falls back to the rows already
    // loaded — 400 of them, which is what the cap is for.
    rerender(
      <ItemTable
        data={many}
        columns={COLUMNS}
        paginationMode="infinite"
        hasMore
        isLoadingMore
        onLoadMore={() => {}}
      />,
    );

    // These rows are not virtualized, so the count is real DOM. 50 is already
    // taller than any viewport, which is all the burst has to be.
    expect(
      screen.getByRole('grid').querySelectorAll('tr[data-placeholder]'),
    ).toHaveLength(50);
  });

  it('re-arms after the batch arrives', async () => {
    const onLoadMore = vi.fn();

    const { rerender } = renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        paginationMode="infinite"
        hasMore
        isLoadingMore
        onLoadMore={onLoadMore}
      />,
    );

    rerender(
      <ItemTable
        data={[...ROWS, { id: 'r10', name: 'row-10' }]}
        columns={COLUMNS}
        paginationMode="infinite"
        hasMore
        isLoadingMore={false}
        onLoadMore={onLoadMore}
      />,
    );

    scrollToEnd();

    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1));
  });

  it('never slices the accumulated list', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        paginationMode="infinite"
        defaultPageSize={3}
        hasMore
        onLoadMore={() => {}}
      />,
    );

    // `data` is everything loaded so far, not a page of it.
    expect(screen.getAllByRole('rowheader')).toHaveLength(10);
  });

  it('keeps the sentinel out of the accessible row list', () => {
    renderWithRoot(
      <ItemTable
        data={ROWS}
        columns={COLUMNS}
        paginationMode="infinite"
        hasMore
        onLoadMore={() => {}}
      />,
    );

    expect(sentinel()).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '11');
  });
});
