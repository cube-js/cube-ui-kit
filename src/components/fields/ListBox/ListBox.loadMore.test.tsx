import { FilterListBox, FilterPicker, ListBox } from '../../../index';
import {
  act,
  render,
  renderWithRoot,
  screen,
  userEvent,
  within,
} from '../../../test';

import type { CubeListBoxProps } from './ListBox';

vi.mock('../../../_internal/hooks/use-warn');

/**
 * jsdom has no `IntersectionObserver`. This stand-in records every observer, so
 * a test decides when the end of the list comes into range: layout can't
 * produce that here. `ListBox.browser.test.tsx` covers the real geometry.
 */
class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  callback: IntersectionObserverCallback;
  options: IntersectionObserverInit;
  targets: Element[] = [];

  constructor(
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {},
  ) {
    this.callback = callback;
    this.options = options;
    MockIntersectionObserver.instances.push(this);
  }

  observe(target: Element) {
    this.targets.push(target);
  }

  disconnect() {
    this.targets = [];
  }

  unobserve() {}

  takeRecords() {
    return [];
  }
}

/** The observers still watching something. */
const watching = () =>
  MockIntersectionObserver.instances.filter(
    (observer) => observer.targets.length > 0,
  );

/** Brings the end of the list within range of every observer watching it. */
function reachEnd() {
  act(() => {
    for (const observer of watching()) {
      observer.callback(
        observer.targets.map(
          (target) => ({ target, isIntersecting: true }) as never,
        ),
        observer as never,
      );
    }
  });
}

beforeEach(() => {
  MockIntersectionObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

afterEach(() => vi.unstubAllGlobals());

interface Value {
  key: string;
  label: string;
}

const page = (from: number, to: number): Value[] =>
  Array.from({ length: to - from }, (_, index) => ({
    key: `v${from + index}`,
    label: `Value ${from + index}`,
  }));

function List(props: Partial<CubeListBoxProps<Value>>) {
  return (
    <ListBox aria-label="Values" items={page(0, 3)} {...props}>
      {(item: Value) => (
        <ListBox.Item key={item.key}>{item.label}</ListBox.Item>
      )}
    </ListBox>
  );
}

const sentinel = () => screen.queryByTestId('ListBoxLoadMoreSentinel');
const loadingRow = () => screen.queryByTestId('ListBoxLoadingMore');

describe('ListBox load more', () => {
  it('stays out of the way until it can load more', () => {
    const { rerender } = render(<List onLoadMore={() => {}} />);

    expect(sentinel()).not.toBeInTheDocument();
    expect(watching()).toHaveLength(0);

    rerender(<List hasMore />);

    expect(sentinel()).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('loads more once the end of the list comes within range', () => {
    const onLoadMore = vi.fn();

    render(<List hasMore onLoadMore={onLoadMore} />);

    const [observer] = watching();

    expect(observer.targets).toEqual([sentinel()]);
    expect(observer.options.root).toBe(screen.getByRole('listbox').parentNode);
    expect(observer.options.rootMargin).toBe('0px 0px 200px 0px');
    expect(onLoadMore).not.toHaveBeenCalled();

    reachEnd();

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('loads nothing, and throws nothing, without an IntersectionObserver', () => {
    // As in jsdom, where consumers run their tests.
    vi.stubGlobal('IntersectionObserver', undefined);

    const onLoadMore = vi.fn();

    render(<List hasMore onLoadMore={onLoadMore} />);

    expect(sentinel()).toBeInTheDocument();
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('starts a list height before the end by default, as ItemTable does', () => {
    // jsdom lays nothing out, so the list's height is given here.
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500);

    render(<List hasMore onLoadMore={() => {}} />);

    expect(watching()[0].options.rootMargin).toBe('0px 0px 500px 0px');

    vi.restoreAllMocks();
  });

  it('starts loadMoreMargin pixels before the end', () => {
    render(<List hasMore loadMoreMargin={1600} onLoadMore={() => {}} />);

    expect(watching()[0].options.rootMargin).toBe('0px 0px 1600px 0px');
  });

  it('waits while a page loads, then arms again for the next one', () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(<List hasMore onLoadMore={onLoadMore} />);

    rerender(<List hasMore isLoadingMore onLoadMore={onLoadMore} />);
    reachEnd();

    expect(onLoadMore).not.toHaveBeenCalled();

    rerender(<List hasMore items={page(0, 6)} onLoadMore={onLoadMore} />);
    reachEnd();

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('arms again when options arrive, so a list too short to scroll keeps loading', () => {
    const { rerender } = render(<List hasMore onLoadMore={() => {}} />);
    const [first] = watching();

    rerender(<List hasMore items={page(0, 6)} onLoadMore={() => {}} />);

    expect(watching()).toHaveLength(1);
    expect(watching()[0]).not.toBe(first);
  });

  it('shows a loading row after the last option while a page loads', () => {
    const { rerender } = render(
      <List hasMore isLoadingMore onLoadMore={() => {}} />,
    );

    const lastOption = screen.getByRole('option', { name: 'Value 2' });

    expect(lastOption.nextElementSibling).toBe(loadingRow());
    expect(loadingRow()).toHaveAttribute('aria-hidden', 'true');
    expect(loadingRow()).toHaveTextContent('Loading more…');
    expect(screen.getAllByRole('option')).toHaveLength(3);
    // Outside the listbox, which may hold only options and groups.
    expect(screen.getByRole('status')).toHaveTextContent('Loading more…');
    expect(
      within(screen.getByRole('listbox')).queryByRole('status'),
    ).not.toBeInTheDocument();

    rerender(<List hasMore items={page(0, 6)} onLoadMore={() => {}} />);

    expect(loadingRow()).not.toBeInTheDocument();
    // Still in place, so the next load is announced as a change of its text.
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('shows the loading row, not the empty label, while an empty list loads', async () => {
    render(<List items={[]} hasMore isLoadingMore onLoadMore={() => {}} />);

    const listbox = screen.getByRole('listbox');

    expect(loadingRow()).toBeInTheDocument();
    expect(screen.queryByText('No items')).not.toBeInTheDocument();
    // Described by the loading status, as by the empty label otherwise.
    expect(listbox).toHaveAccessibleDescription('Loading more…');

    // With no option to take it, focus rests on the list, and the card shows it.
    await userEvent.tab();

    expect(listbox).toHaveFocus();
    expect(screen.getByTestId('ListBoxWrapper')).toHaveAttribute(
      'data-focused',
    );
  });

  it('keeps keyboard focus on the options and does not wrap while more can load', async () => {
    const { rerender } = render(
      <List shouldFocusWrap hasMore isLoadingMore onLoadMore={() => {}} />,
    );

    await userEvent.click(screen.getByRole('option', { name: 'Value 0' }));
    await userEvent.keyboard('{End}');

    expect(screen.getByRole('option', { name: 'Value 2' })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('option', { name: 'Value 2' })).toHaveFocus();

    // With nothing left to load, focus wraps as asked.
    rerender(<List shouldFocusWrap />);
    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('option', { name: 'Value 0' })).toHaveFocus();
  });

  it('loads more in a list with sections', () => {
    const onLoadMore = vi.fn();
    const Sections = (props: Partial<CubeListBoxProps<Value>>) => (
      <ListBox aria-label="Values" hasMore onLoadMore={onLoadMore} {...props}>
        <ListBox.Section title="Fruits">
          <ListBox.Item key="apple">Apple</ListBox.Item>
        </ListBox.Section>
        <ListBox.Section title="Vegetables">
          <ListBox.Item key="carrot">Carrot</ListBox.Item>
        </ListBox.Section>
      </ListBox>
    );
    const { rerender } = render(<Sections />);

    reachEnd();

    expect(onLoadMore).toHaveBeenCalledTimes(1);

    rerender(<Sections isLoadingMore />);

    // Out of the virtualizer, both follow the sections in flow.
    expect(screen.getByRole('listbox').lastElementChild).toBe(sentinel());
    expect(sentinel()?.previousElementSibling).toBe(loadingRow());
    expect(loadingRow()).not.toHaveAttribute('data-virtual');
    expect(sentinel()).not.toHaveAttribute('data-virtualized');
  });

  it('places the sentinel at the end of a virtualized list', () => {
    render(<List hasMore onLoadMore={() => {}} />);

    expect(screen.getByRole('listbox').lastElementChild).toBe(sentinel());
    expect(sentinel()).toHaveAttribute('data-virtualized');
  });
});

describe('FilterListBox load more', () => {
  it('passes it to its list, and keeps search navigation from wrapping', async () => {
    const onLoadMore = vi.fn();

    render(
      <FilterListBox
        aria-label="Values"
        items={page(0, 3)}
        shouldFocusWrap
        hasMore
        onLoadMore={onLoadMore}
      >
        {(item: Value) => (
          <FilterListBox.Item key={item.key}>{item.label}</FilterListBox.Item>
        )}
      </FilterListBox>,
    );

    const search = screen.getByRole('combobox');
    const last = screen.getByRole('option', { name: 'Value 2' });

    await userEvent.click(search);
    await userEvent.keyboard('{End}{ArrowDown}');

    expect(search).toHaveAttribute('aria-activedescendant', last.id);

    reachEnd();

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});

describe('FilterPicker load more', () => {
  it('loads more from its popover', async () => {
    const onLoadMore = vi.fn();
    const consoleError = vi.spyOn(console, 'error');

    renderWithRoot(
      <FilterPicker
        label="Values"
        items={page(0, 3)}
        filter={false}
        hasMore
        isLoadingMore={false}
        loadMoreMargin={1600}
        onLoadMore={onLoadMore}
      >
        {(item: Value) => (
          <FilterPicker.Item key={item.key}>{item.label}</FilterPicker.Item>
        )}
      </FilterPicker>,
    );

    await userEvent.click(screen.getByRole('button'));

    expect(watching()[0].options.rootMargin).toBe('0px 0px 1600px 0px');

    reachEnd();

    expect(onLoadMore).toHaveBeenCalledTimes(1);
    // Kept off the wrapper, which forwards other `on*` props to the DOM.
    const isLeaked = consoleError.mock.calls.some((args) =>
      args.some((arg) => String(arg).includes('onLoadMore')),
    );

    expect(isLeaked).toBe(false);

    consoleError.mockRestore();
  });
});
