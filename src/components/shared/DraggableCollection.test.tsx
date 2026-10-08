import { createRef } from 'react';

import { act, render, userEvent } from '../../test';

import {
  DraggableCollection,
  DraggableCollectionProps,
} from './DraggableCollection';

const drag = vi.hoisted(() => ({
  keys: new Set<string>(),
  end: vi.fn(),
  getItems: undefined as undefined | ((keys: Set<string>) => unknown),
}));

// React Aria owns native drag initiation. Exercise this wrapper's Escape
// listener against that boundary without simulating a browser's drag session.
vi.mock(
  'react-stately',
  async (importOriginal: () => Promise<typeof import('react-stately')>) => ({
    ...(await importOriginal()),
    useDraggableCollectionState: (props: {
      getItems: typeof drag.getItems;
    }) => {
      drag.getItems = props.getItems;
      return { draggingKeys: drag.keys, endDrag: drag.end };
    },
    useDroppableCollectionState: () => ({}),
  }),
);

vi.mock(
  'react-aria',
  async (importOriginal: () => Promise<typeof import('react-aria')>) => ({
    ...(await importOriginal()),
    useDraggableCollection: () => {},
    useDroppableCollection: () => ({ collectionProps: {} }),
  }),
);

beforeEach(() => {
  drag.keys = new Set();
  drag.end = vi.fn();
  drag.getItems = undefined;
});

afterEach(() => vi.restoreAllMocks());

const state = {
  collection: { getItem: (key: string) => ({ textValue: key }) },
  selectionManager: {},
} as unknown as DraggableCollectionProps['state'];

it('cancels through the current committed drag state without reconnecting on callback replacement', async () => {
  drag.keys = new Set(['first']);
  const first = drag.end;
  const add = vi.spyOn(document, 'addEventListener');
  const listRef = createRef<HTMLDivElement>();
  const content = () => (
    <DraggableCollection
      state={state}
      listRef={listRef}
      orderedKeys={['first', 'second']}
      orientation="vertical"
    >
      {() => <div ref={listRef}>Collection</div>}
    </DraggableCollection>
  );
  const { rerender, unmount } = render(content());
  act(() => {
    drag.getItems?.(new Set(['first']));
  });
  const listenerCount = () =>
    add.mock.calls.filter(
      ([type, , capture]) => type === 'keydown' && capture === true,
    ).length;
  const connected = listenerCount();
  const second = vi.fn();
  drag.end = second;
  rerender(content());

  await userEvent.keyboard('{Escape}');
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledWith(
    expect.objectContaining({
      keys: new Set(['first']),
      dropOperation: 'cancel',
    }),
  );
  expect(listenerCount()).toBe(connected);

  drag.keys = new Set();
  rerender(content());
  await userEvent.keyboard('{Escape}');
  expect(second).toHaveBeenCalledTimes(1);
  unmount();
  await userEvent.keyboard('{Escape}');
  expect(second).toHaveBeenCalledTimes(1);
});
