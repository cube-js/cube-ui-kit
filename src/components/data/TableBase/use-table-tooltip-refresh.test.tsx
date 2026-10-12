import { render } from '@testing-library/react';

import { useTableTooltipRefresh } from './use-table-tooltip-refresh';

function Scope({ scroller }: { scroller: HTMLDivElement | null }) {
  useTableTooltipRefresh(scroller);
  return null;
}

it('releases appearance observation when its root changes or unmounts', () => {
  const observe = vi
    .spyOn(MutationObserver.prototype, 'observe')
    .mockImplementation(() => {});
  const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
  const firstRoot = document.createElement('div');
  const secondRoot = document.createElement('div');
  const firstScroller = document.createElement('div');
  const secondScroller = document.createElement('div');
  firstRoot.append(firstScroller);
  secondRoot.append(secondScroller);
  document.body.append(firstRoot, secondRoot);

  try {
    const { rerender, unmount } = render(<Scope scroller={firstScroller} />);
    expect(observe).toHaveBeenCalledWith(firstRoot, {
      attributes: true,
      subtree: true,
    });
    const firstObserver = observe.mock.contexts[0];
    expect(disconnect).not.toHaveBeenCalled();

    rerender(<Scope scroller={secondScroller} />);
    expect(disconnect.mock.contexts).toEqual([firstObserver]);
    expect(observe).toHaveBeenCalledWith(secondRoot, {
      attributes: true,
      subtree: true,
    });
    const secondObserver = observe.mock.contexts.at(-1);
    unmount();
    expect(disconnect.mock.contexts).toEqual([firstObserver, secondObserver]);
  } finally {
    observe.mockRestore();
    disconnect.mockRestore();
    firstRoot.remove();
    secondRoot.remove();
  }
});
